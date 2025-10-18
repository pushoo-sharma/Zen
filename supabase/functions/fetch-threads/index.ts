import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get user's Gmail connection
    const { data: connection } = await supabaseClient
      .from("oauth_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (!connection) {
      return new Response(
        JSON.stringify({ error: "Gmail not connected" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let accessToken = connection.access_token;

    // Refresh token if expired
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

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Update the token in the database
        await supabaseClient
          .from("oauth_connections")
          .update({
            access_token: refreshData.access_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq("user_id", user.id)
          .eq("provider", "gmail");
      }
    }

    // Fetch threads from Gmail
    const threadsResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=30",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!threadsResponse.ok) {
      const errorText = await threadsResponse.text();
      throw new Error(`Failed to fetch threads: ${errorText}`);
    }

    const threadsData = await threadsResponse.json();
    const threadsList = threadsData.threads || [];

    // Fetch details for each thread
    const threads = await Promise.all(
      threadsList.map(async (thread: any) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!detailResponse.ok) {
          return {
            id: thread.id,
            subject: "Error loading thread",
            from: "Unknown",
          };
        }

        const detail = await detailResponse.json();
        const firstMessage = detail.messages?.[0];
        const headers = firstMessage?.payload?.headers || [];
        
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";

        return {
          id: thread.id,
          subject,
          from,
        };
      })
    );

    return new Response(
      JSON.stringify({ threads }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in fetch-threads:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch threads" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
