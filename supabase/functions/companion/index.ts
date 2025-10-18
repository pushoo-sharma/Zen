import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to fetch Gmail thread
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
    const date = new Date(m.internalDate ? Number(m.internalDate) : Date.now()).toISOString();
    
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

    return { id: m.id, subject, from, dateISO: date, body: body.slice(0, 12000) };
  });

  return { id: data.id, messages };
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

    const { query, history = [] } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user mentions a thread ID (format: #threadId)
    let threadContext = "";
    const threadMatch = /#([a-zA-Z0-9_-]{10,})/.exec(query);

    if (threadMatch) {
      try {
        // Get user's Gmail connection
        const { data: connection } = await supabaseClient
          .from("oauth_connections")
          .select("access_token, refresh_token, expires_at")
          .eq("user_id", user.id)
          .eq("provider", "gmail")
          .single();

        if (connection) {
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

          const thread = await fetchThread(accessToken, threadMatch[1]);
          const stitched = thread.messages
            .map(
              (m: any) =>
                `From: ${m.from}\nDate: ${m.dateISO}\nSubject: ${m.subject}\nBody:\n${m.body}`
            )
            .join("\n\n---\n\n");
          threadContext = `\n\nTHREAD CONTEXT:\n${stitched}`;
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
      }
    }

    // Build AI prompt
    const systemPrompt = `You are an AI inbox copilot for InboxZen. You help users manage their email intelligently.

Your capabilities:
- Summarize email threads and extract key points
- Identify action items and next steps
- Draft professional email replies
- Answer questions about email content
- Suggest email management strategies

Guidelines:
- Be concise and actionable
- Focus on practical next steps
- When drafting replies, match the user's tone and context
- If summarizing, provide 3-5 key points
- If suggesting actions, provide 3-5 specific steps
- Always be helpful and professional`;

    const conversationContext = history.length > 0
      ? `\n\nPrevious conversation:\n${JSON.stringify(history.slice(-6))}`
      : "";

    const fullPrompt = `${systemPrompt}${threadContext}${conversationContext}\n\nUser query: ${query}\n\nProvide a helpful, concise response:`;

    // Call Lovable AI
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
            content: fullPrompt,
          },
        ],
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate response");
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ answer }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in companion:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Companion failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
