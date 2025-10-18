import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting helper
async function checkRateLimit(supabase: any, userId: string, endpoint: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { data, error } = await supabase
    .from("rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("window_start", oneMinuteAgo)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check error:", error);
    return true;
  }

  const currentCount = data?.request_count || 0;
  
  // Limit: 20 fetches per minute
  if (currentCount >= 20) {
    return false;
  }

  if (data) {
    await supabase
      .from("rate_limits")
      .update({ request_count: currentCount + 1 })
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .gte("window_start", oneMinuteAgo);
  } else {
    await supabase
      .from("rate_limits")
      .insert({
        user_id: userId,
        endpoint,
        request_count: 1,
        window_start: new Date(),
      });
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check rate limit
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rateLimitOk = await checkRateLimit(supabaseServiceRole, user.id, "fetch-gmail-emails");
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 20 fetches per minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth token using secure RPC function
    const { data: tokenData, error: tokenError } = await supabaseServiceRole.rpc('get_oauth_token', {
      _user_id: user.id,
      _provider: 'gmail'
    });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error("Token fetch error:", tokenError);
      throw new Error("No Gmail connection found");
    }

    const connection = tokenData[0];

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const expiresAt = new Date(connection.expires_at);
    
    if (expiresAt < new Date()) {
      // Token expired, refresh it
      const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
      const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: connection.refresh_token,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update stored tokens using service role
      await supabaseServiceRole
        .from("oauth_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt,
        })
        .eq("user_id", user.id)
        .eq("provider", "gmail");
    }

    // Fetch emails from Gmail API
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!gmailResponse.ok) {
      const error = await gmailResponse.text();
      console.error("Gmail API error:", error);
      throw new Error("Failed to fetch emails from Gmail");
    }

    const gmailData = await gmailResponse.json();
    const messageIds = gmailData.messages || [];

    // Fetch details for each message
    const emails = await Promise.all(
      messageIds.map(async (msg: any) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!detailResponse.ok) return null;

        const detail = await detailResponse.json();
        const headers = detail.payload?.headers || [];
        
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        return {
          id: msg.id,
          from: getHeader("from"),
          subject: getHeader("subject"),
          snippet: detail.snippet || "",
          body: detail.snippet || "", // For now, use snippet as body
          date: new Date(parseInt(detail.internalDate)).toISOString(),
          time: formatTimeAgo(parseInt(detail.internalDate)),
        };
      })
    );

    const validEmails = emails.filter(e => e !== null);

    return new Response(
      JSON.stringify({ emails: validEmails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching Gmail emails:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch emails" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
