import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const emailSchema = z.object({
  to: z.string().email("Invalid email address").max(255, "Email too long"),
  subject: z.string().min(1, "Subject required").max(200, "Subject too long").refine(s => !s.includes("\n") && !s.includes("\r"), "Subject cannot contain line breaks"),
  body: z.string().min(1, "Body required").max(50000, "Body too long (max 50KB)"),
});

// Rate limiting helper
async function checkRateLimit(supabase: any, userId: string, endpoint: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  // Count recent requests
  const { data, error } = await supabase
    .from("rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("window_start", oneMinuteAgo)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check error:", error);
    return true; // Allow on error
  }

  const currentCount = data?.request_count || 0;
  
  // Limits: 10 emails per minute
  if (currentCount >= 10) {
    return false;
  }

  // Update or insert rate limit record
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const rateLimitOk = await checkRateLimit(supabaseServiceRole, user.id, "send-email");
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 10 emails per minute." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await req.json();
    
    // Validate input
    const validation = emailSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { to, subject, body } = validation.data;

    // Get OAuth token using secure RPC function
    const { data: tokenData, error: tokenError } = await supabaseServiceRole.rpc('get_oauth_token', {
      _user_id: user.id,
      _provider: 'gmail'
    });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error("Token fetch error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Gmail connection not found. Please connect your Gmail account." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const connection = tokenData[0];
    let accessToken = connection.access_token;

    // Check if token is expired and refresh if needed
    if (connection.expires_at && new Date(connection.expires_at) <= new Date()) {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID"),
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET"),
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh access token");
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update the token in database using service role
      await supabaseServiceRole
        .from("oauth_connections")
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("user_id", user.id)
        .eq("provider", "gmail");
    }

    // Create email in RFC 2822 format
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\r\n");

    // Encode email in base64url format
    const encodedEmail = btoa(email)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Gmail API error:", sendResponse.status, errorText);
      throw new Error("Failed to send email via Gmail");
    }

    const result = await sendResponse.json();

    // Log the sent event for analytics
    await supabaseClient
      .from("email_events")
      .insert({
        user_id: user.id,
        event_type: "sent",
        subject,
        metadata: { to, messageId: result.id },
      });

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
