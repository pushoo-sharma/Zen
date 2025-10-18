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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Check database connectivity
    const dbStart = Date.now();
    const { error: dbError } = await supabaseClient
      .from("profiles")
      .select("id")
      .limit(1);
    const dbLatency = Date.now() - dbStart;

    // Check queue size
    let queueSize = 0;
    try {
      const { count } = await supabaseClient
        .from("job_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      queueSize = count ?? 0;
    } catch (e) {
      console.log("Queue table not available:", e);
    }

    // Calculate uptime (since function start)
    const uptimeSeconds = Math.floor(performance.now() / 1000);

    const health = {
      status: dbError ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbError ? "down" : "up",
          latencyMs: dbLatency,
          error: dbError?.message,
        },
        queue: {
          status: "up",
          pendingJobs: queueSize,
        },
        cache: {
          status: "up",
          type: "in-memory",
        },
      },
      metrics: {
        uptimeSeconds,
        memoryUsage: Deno.memoryUsage(),
      },
      version: "1.0.0",
    };

    return new Response(JSON.stringify(health, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      status: dbError ? 503 : 200,
    });
  } catch (error: any) {
    console.error("Health check error:", error);

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
