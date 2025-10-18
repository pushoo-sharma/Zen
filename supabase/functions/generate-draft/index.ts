import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    const requestBody = await req.json();
    
    // Validate input
    const draftSchema = z.object({
      subject: z.string().max(200, "Subject must be 200 characters or less"),
      from: z.string().email("Invalid email format").max(255, "Email must be 255 characters or less"),
      snippet: z.string().max(5000, "Snippet must be 5000 characters or less"),
      tone: z.enum(['formal', 'friendly', 'brief']).default('friendly')
    });

    const validated = draftSchema.parse(requestBody);
    const { subject, from, snippet, tone } = validated;
    
    console.log(`Generating draft reply for email: ${subject.substring(0, 50)}...`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const toneInstructions = {
      formal: "Write in a professional, formal business tone.",
      friendly: "Write in a warm, conversational yet professional tone.",
      brief: "Write a very brief, concise response getting straight to the point.",
    };

    const systemPrompt = `You are an AI email assistant that drafts professional email replies.
${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.friendly}

Guidelines:
- Keep replies focused and actionable
- Match the sender's level of formality
- Include a clear next step or call to action when appropriate
- Be polite and professional
- Keep it concise (2-4 short paragraphs max)

Return ONLY the email body text, no subject line, no greetings beyond the opening.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Draft a ${tone} reply to this email:

From: ${from}
Subject: ${subject}
Message: ${snippet}

Write the reply:` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to your workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const draft = data.choices[0].message.content;
    
    console.log("Generated draft successfully");

    // Log the AI drafted event for analytics
    await supabaseClient
      .from("email_events")
      .insert({
        user_id: user.id,
        event_type: "ai_drafted",
        subject,
        metadata: { from, tone },
      });

    return new Response(
      JSON.stringify({ draft }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-draft function:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Draft generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
