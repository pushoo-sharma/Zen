import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DraftPlanInput = {
  subject: string;
  body: string;
  threadId?: string;
  contact?: string;
};

type DraftPlanOutput = {
  subject: string;
  body: string;
  sendAtISO?: string;
  warnings?: string[];
  steps: { agent: string; input?: any; output?: any; warnings?: string[] }[];
};

async function callAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a helpful email assistant." },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function runDraftPlan(
  voiceProfile: any,
  memoryContext: string,
  input: DraftPlanInput,
  apiKey: string
): Promise<DraftPlanOutput> {
  const steps: DraftPlanOutput["steps"] = [];
  let workingBody = input.body;
  let warnings: string[] = [];

  // 1) Summarize thread (if memory/context available)
  if (memoryContext) {
    const summaryPrompt = `Summarize this thread context into 5 crisp bullets:\n${memoryContext}`;
    const summary = await callAI(summaryPrompt, apiKey);
    steps.push({ agent: "SummarizerAgent", output: { summary } });
  }

  // 2) Relationship tweak
  const relPrompt = `Suggest one relationship-building improvement for this draft (gratitude, clarity, next step). Return a single sentence:\n${workingBody}`;
  const tweak = await callAI(relPrompt, apiKey);
  steps.push({ agent: "RelationshipAgent", output: { tweak } });
  if (tweak) workingBody = `${workingBody}\n\n${tweak}`;

  // 3) Tone pass
  const vp = voiceProfile || { tone: "concise friendly", signature: "Best," };
  const tonePrompt = `Rewrite in user's tone. Return ONLY the email body.\nTone: ${JSON.stringify(vp)}\nSubject: ${input.subject}\nBody: ${workingBody}`;
  const tonedBody = await callAI(tonePrompt, apiKey);
  steps.push({ agent: "ToneAgent", output: { body: tonedBody } });
  if (tonedBody) workingBody = tonedBody;

  // 4) Safety gate
  const redflags: string[] = [];
  if (/ssn|password|credit card/i.test(workingBody)) {
    redflags.push("Potential sensitive info detected");
  }
  steps.push({ agent: "SafetyAgent", output: { ok: redflags.length === 0 }, warnings: redflags });
  if (redflags.length) warnings = warnings.concat(redflags);

  // 5) Scheduler suggestion
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 30, 0, 0);
  const sendAtISO = date.toISOString();
  steps.push({ agent: "SchedulerAgent", output: { sendAtISO } });

  return {
    subject: input.subject,
    body: workingBody,
    sendAtISO,
    warnings,
    steps,
  };
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

    const { subject, body, threadId, contact } = await req.json();

    // Fetch voice profile
    const { data: vpData } = await supabaseClient
      .from("voice_profiles")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const voiceProfile = vpData?.profile;

    // Fetch memory context
    let memoryContext = "";
    if (threadId) {
      const { data: memData } = await supabaseClient
        .from("mem_threads")
        .select("summary")
        .eq("thread_id", threadId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      memoryContext = memData?.summary || "";
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const plan = await runDraftPlan(voiceProfile, memoryContext, { subject, body, threadId, contact }, LOVABLE_API_KEY);

    // Persist trace
    await supabaseClient.from("agent_traces").insert({
      user_id: user.id,
      task_type: "DRAFT",
      thread_id: threadId,
      input: { subject, body, threadId, contact },
      steps: plan.steps,
      final: {
        subject: plan.subject,
        body: plan.body,
        sendAtISO: plan.sendAtISO,
        warnings: plan.warnings,
      },
    });

    return new Response(JSON.stringify({ ok: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in coordinate:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Coordinate failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
