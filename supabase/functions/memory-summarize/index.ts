import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to fetch and decode Gmail thread
async function fetchThread(accessToken: string, threadId: string) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch thread");
  }

  const data = await res.json();
  
  const messages = (data.messages || []).map((m: any) => {
    const headers = m.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    
    let body = "";
    const walk = (p: any): void => {
      if (!p) return;
      if (p.mimeType?.startsWith("text/")) {
        const encodedData = p.body?.data || "";
        try {
          const decoded = atob(encodedData.replace(/-/g, "+").replace(/_/g, "/"));
          body += decoded + "\n\n";
        } catch {}
      }
      (p.parts || []).forEach(walk);
    };
    walk(m.payload);

    return { subject, from, body: body.slice(0, 4000) };
  });

  const subject = messages[0]?.subject || "No Subject";
  const stitched = messages.map((m: any) => `From: ${m.from}\n${m.body}`).join("\n---\n");

  return { id: data.id, subject, content: stitched.slice(0, 12000) };
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

    const { threadId } = await req.json();

    if (!threadId) {
      return new Response(
        JSON.stringify({ error: "threadId required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
      }
    }

    const thread = await fetchThread(accessToken, threadId);

    // Generate summary using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Summarize this email thread into 5 concise bullet points. Focus on: key decisions, important dates, responsible people, and open questions. Return ONLY the bullet list.\n\nThread:\n${thread.content}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Failed to generate summary");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0]?.message?.content || "Summary unavailable.";

    // Store in mem_threads
    const { error } = await supabaseClient
      .from("mem_threads")
      .upsert(
        {
          user_id: user.id,
          thread_id: threadId,
          subject: thread.subject,
          summary,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,thread_id" }
      );

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, subject: thread.subject, summary }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in memory-summarize:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Summarization failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
