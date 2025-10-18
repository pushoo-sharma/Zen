import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Feature extraction
type EmailFeatures = {
  id: string;
  fromVIP: number;
  hasDeadlineWords: number;
  isThread: number;
  hourBucket: number;
  isNewsletter: number;
  recencyHours: number;
};

const DEADLINE_WORDS = [
  "contract", "invoice", "timeline", "due", "urgent", "nda", 
  "renewal", "quote", "delivery", "meeting", "asap", "deadline"
];

const DEFAULT_WEIGHTS = {
  fromVIP: 2.5,
  hasDeadlineWords: 2.0,
  isThread: 0.8,
  hourBucket: 0.0,
  isNewsletter: -1.0,
  recencyHours: -0.05,
};

function extractFeatures(e: any): EmailFeatures {
  const subj = (e.subject || "").toLowerCase();
  const snip = (e.snippet || "").toLowerCase();
  const from = (e.from || "").toLowerCase();
  const now = Date.now();
  const ts = e.dateISO ? Date.parse(e.dateISO) : now;
  const hours = Math.max(0, (now - ts) / 36e5);

  return {
    id: e.id,
    fromVIP: Number(/vip|ceo|founder|client|director|manager/.test(from)),
    hasDeadlineWords: Number(DEADLINE_WORDS.some(w => subj.includes(w) || snip.includes(w))),
    isThread: Number(Boolean(e.threadId)),
    hourBucket: new Date(ts).getHours(),
    isNewsletter: Number(/newsletter|unsubscribe|no-reply|noreply/.test(from) || subj.includes("newsletter")),
    recencyHours: hours,
  };
}

function scoreEmail(f: EmailFeatures, w: any, hourBias = 0): number {
  return (
    f.fromVIP * w.fromVIP +
    f.hasDeadlineWords * w.hasDeadlineWords +
    f.isThread * w.isThread +
    hourBias +
    f.isNewsletter * w.isNewsletter +
    f.recencyHours * w.recencyHours
  );
}

function selectTop(items: { id: string; score: number }[], epsilon = 0.12, k = 7) {
  const out: { id: string; score: number }[] = [];
  const pool = [...items];

  for (let i = 0; i < Math.min(k, pool.length); i++) {
    if (Math.random() < epsilon && pool.length > 1) {
      const j = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(j, 1)[0]);
    } else {
      let best = 0;
      for (let t = 1; t < pool.length; t++) {
        if (pool[t].score > pool[best].score) best = t;
      }
      out.push(pool.splice(best, 1)[0]);
    }
  }
  return out;
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

    // Get user's Gmail connection
    const { data: connection, error: connError } = await supabaseClient
      .from("oauth_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Gmail connection required", recommendations: [] }),
        {
          status: 200,
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
        await supabaseClient
          .from("oauth_connections")
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq("user_id", user.id)
          .eq("provider", "gmail");
      }
    }

    // Fetch recent emails
    const listResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      throw new Error("Failed to fetch emails from Gmail");
    }

    const listData = await listResponse.json();
    const messageIds = (listData.messages || []).map((m: any) => m.id);

    const emails: any[] = [];
    for (const id of messageIds.slice(0, 50)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgResponse.ok) continue;

      const msg = await msgResponse.json();
      const headers = msg.payload?.headers || [];
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
      const dateISO = new Date(
        msg.internalDate ? Number(msg.internalDate) : Date.now()
      ).toISOString();

      emails.push({
        id,
        from,
        subject,
        snippet: msg.snippet || "",
        threadId: msg.threadId,
        dateISO,
      });
    }

    // Get user preferences or use defaults
    const { data: prefs } = await supabaseClient
      .from("recommendation_preferences")
      .select("weights, hour_bias")
      .eq("user_id", user.id)
      .single();

    const weights = prefs?.weights || DEFAULT_WEIGHTS;
    const hourBias = prefs?.hour_bias || {};

    // Score and rank emails
    const features = emails.map(extractFeatures);
    const scored = features.map((f) => ({
      id: f.id,
      score: scoreEmail(f, weights, hourBias[f.hourBucket] || 0),
    }));

    const recommendations = selectTop(scored, 0.12, 7);
    const enriched = recommendations.map((r) => ({
      ...emails.find((e) => e.id === r.id),
      recoScore: r.score.toFixed(2),
    }));

    return new Response(
      JSON.stringify({ recommendations: enriched }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in recommendations:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to get recommendations" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
