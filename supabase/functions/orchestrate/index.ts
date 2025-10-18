import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent types
type AgentTask = {
  id: string;
  type: 'DRAFT' | 'SCHEDULE' | 'RELATIONSHIP' | 'SUMMARIZE';
  threadId?: string;
  to?: string;
  subject?: string;
  body?: string;
  meta?: Record<string, any>;
};

type AgentResult = {
  taskId: string;
  agent: string;
  score?: number;
  output?: any;
  warnings?: string[];
};

// AI helper
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
    const errorText = await response.text();
    console.error("AI API error:", errorText);
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Agent implementations
async function runToneAgent(task: AgentTask, voiceProfile: any, apiKey: string): Promise<AgentResult> {
  const vp = voiceProfile || { tone: 'concise friendly', signature: 'Best,' };
  const prompt = `Rewrite the reply in the user's tone. Return ONLY the email body.
Tone: ${JSON.stringify(vp)}
Subject: ${task.subject}
Body: ${task.body}`;
  
  const out = await callAI(prompt, apiKey);
  return { taskId: task.id, agent: 'ToneAgent', output: { body: out }, score: 1.0 };
}

async function runSummarizerAgent(task: AgentTask, memoryContext: string, apiKey: string): Promise<AgentResult> {
  const prompt = `Summarize the thread context into 5 crisp bullets with owners/dates. Return ONLY bullets.
Context:
${memoryContext || ''}`;
  
  const out = await callAI(prompt, apiKey);
  return { taskId: task.id, agent: 'SummarizerAgent', output: { summary: out }, score: 1.0 };
}

async function runRelationshipAgent(task: AgentTask, apiKey: string): Promise<AgentResult> {
  const prompt = `Given the contact preferences and memory, suggest one relationship-building tweak to the draft (e.g., gratitude, clarity, next step). Return a single sentence.`;
  
  const tweak = await callAI(prompt, apiKey);
  return { taskId: task.id, agent: 'RelationshipAgent', output: { tweak }, score: 0.9 };
}

async function runSchedulerAgent(task: AgentTask): Promise<AgentResult> {
  // Heuristic schedule: tomorrow 9:30am local
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 30, 0, 0);
  return { taskId: task.id, agent: 'SchedulerAgent', output: { sendAtISO: date.toISOString() }, score: 0.8 };
}

async function runSafetyAgent(task: AgentTask, memoryContext: string): Promise<AgentResult> {
  const redflags: string[] = [];
  const txt = [task.body, memoryContext].join('\n');
  if (/ssn|password|credit card/i.test(txt || '')) {
    redflags.push('Potential sensitive info detected');
  }
  return { 
    taskId: task.id, 
    agent: 'SafetyAgent', 
    output: { ok: redflags.length === 0 }, 
    warnings: redflags,
    score: redflags.length === 0 ? 1.0 : 0.2
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

    const requestBody = await req.json();
    
    // Validate input
    const taskSchema = z.object({
      type: z.enum(['DRAFT', 'SCHEDULE', 'RELATIONSHIP', 'SUMMARIZE'], {
        errorMap: () => ({ message: "Task type must be one of: DRAFT, SCHEDULE, RELATIONSHIP, SUMMARIZE" })
      }),
      threadId: z.string().max(100).optional(),
      to: z.string().email().max(255).optional(),
      subject: z.string().max(200).optional(),
      body: z.string().max(10000).optional(),
      meta: z.record(z.unknown()).optional()
    });

    const validatedTask = taskSchema.parse(requestBody.task || requestBody);
    const agentTask: AgentTask = { 
      id: crypto.randomUUID().slice(0, 8), 
      ...validatedTask 
    };
    
    console.log(`Orchestrating ${agentTask.type} task ${agentTask.id}`);

    // Fetch voice profile
    const { data: vpData } = await supabaseClient
      .from("voice_profiles")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const voiceProfile = vpData?.profile;

    // Fetch memory context if threadId provided
    let memoryContext = "";
    if (agentTask.threadId) {
      const { data: memData } = await supabaseClient
        .from("mem_threads")
        .select("summary")
        .eq("thread_id", agentTask.threadId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      memoryContext = memData?.summary || "";
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Run agents based on task type
    const results: AgentResult[] = [];

    if (agentTask.type === "DRAFT") {
      results.push(await runToneAgent(agentTask, voiceProfile, LOVABLE_API_KEY));
      results.push(await runRelationshipAgent(agentTask, LOVABLE_API_KEY));
      results.push(await runSafetyAgent(agentTask, memoryContext));
    } else if (agentTask.type === "SUMMARIZE") {
      results.push(await runSummarizerAgent(agentTask, memoryContext, LOVABLE_API_KEY));
      results.push(await runSafetyAgent(agentTask, memoryContext));
    } else if (agentTask.type === "SCHEDULE") {
      results.push(await runSchedulerAgent(agentTask));
    }

    // Sort by score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Log event
    await supabaseClient.from("email_events").insert({
      user_id: user.id,
      event_type: "ai_orchestrated",
      subject: agentTask.subject || agentTask.type,
      metadata: { taskId: agentTask.id, agentCount: results.length },
    });

    return new Response(JSON.stringify({ task: agentTask, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in orchestrate:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid task structure", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || "Orchestration failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
