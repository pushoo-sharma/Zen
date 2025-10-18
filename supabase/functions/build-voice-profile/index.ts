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

    const { samples } = await req.json();

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email samples provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build prompt for AI to analyze writing style
    const prompt = `Analyze these email samples and create a concise voice profile that captures the writing style, tone, and patterns:

${samples.map((s, i) => `Email ${i + 1}:\nSubject: ${s.subject}\nBody: ${s.body || s.snippet}\n`).join("\n---\n")}

Create a JSON profile with:
- tone: overall tone (e.g., "professional", "casual", "friendly")
- patterns: common phrases or patterns
- style_notes: key characteristics of the writing style
- greeting_style: how emails typically start
- closing_style: how emails typically end`;

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
            role: "system",
            content: "You are an expert at analyzing writing styles and creating voice profiles. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
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
      throw new Error("Failed to generate voice profile");
    }

    const aiData = await aiResponse.json();
    const profileText = aiData.choices[0]?.message?.content || "{}";
    
    let profile;
    try {
      profile = JSON.parse(profileText);
    } catch {
      // If AI doesn't return valid JSON, create a basic profile
      profile = {
        tone: "professional",
        patterns: [],
        style_notes: "Unable to analyze style from samples",
        greeting_style: "Standard",
        closing_style: "Standard",
      };
    }

    // Save or update voice profile
    const { data, error } = await supabaseClient
      .from("voice_profiles")
      .upsert(
        {
          user_id: user.id,
          profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ profile: data.profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in build-voice-profile:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to build voice profile" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
