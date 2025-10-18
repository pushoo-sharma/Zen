import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { threadId, context, subject, from } = await req.json();

    // Build AI prompt for action prediction
    const prompt = `You are InboxZen's autonomous workflow engine. Analyze this email context and predict the best action.

Context:
${context || "No additional context"}

Email Subject: ${subject || "Unknown"}
From: ${from || "Unknown"}
Thread ID: ${threadId || "None"}

Based on this information, predict the most useful action:
- draft: Prepare a draft reply
- send: Ready to send immediately (high confidence only)
- snooze: Defer for later review
- archive: No action needed

Return JSON with: { "action": "draft|send|snooze|archive", "confidence": 0.0-1.0, "reasoning": "brief explanation", "payload": {"to": "email", "subject": "...", "body": "..."} }`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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
            role: "system",
            content: "You are an autonomous email workflow predictor. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI prediction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    let prediction;
    try {
      prediction = JSON.parse(content);
    } catch {
      // Fallback if AI doesn't return valid JSON
      prediction = {
        action: "draft",
        confidence: 0.5,
        reasoning: "Unable to parse AI response",
        payload: {},
      };
    }

    // Insert auto action
    const { data: action, error: insertError } = await supabaseClient
      .from("auto_actions")
      .insert({
        user_id: user.id,
        thread_id: threadId,
        action: prediction.action || "draft",
        confidence: Math.min(Math.max(prediction.confidence || 0.5, 0), 1),
        reasoning: prediction.reasoning || "",
        payload: prediction.payload || {},
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        ok: true,
        action: prediction.action,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        actionId: action.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-predict:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Prediction failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});