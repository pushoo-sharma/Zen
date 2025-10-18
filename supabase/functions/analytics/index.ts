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

    // Fetch all email events for the user
    const { data: events, error } = await supabaseClient
      .from("email_events")
      .select("event_type, created_at, response_time_seconds, subject")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Compute aggregates
    const byType: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseCount = 0;

    events.forEach((event: any) => {
      // Count by event type
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;

      // Calculate average response time
      if (event.response_time_seconds) {
        totalResponseTime += event.response_time_seconds;
        responseCount++;
      }
    });

    const avgResponse = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Group by week for trend analysis
    const byWeek = new Map<string, number>();
    events.forEach((event: any) => {
      const date = new Date(event.created_at);
      const weekKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      byWeek.set(weekKey, (byWeek.get(weekKey) || 0) + 1);
    });

    // Convert map to array for easier frontend consumption
    const weeklyTrend = Array.from(byWeek.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate AI assist ratio
    const aiDrafted = byType["ai_drafted"] || 0;
    const totalReplies = (byType["replied"] || 0) + aiDrafted;
    const aiAssistRatio = totalReplies > 0 ? (aiDrafted / totalReplies) * 100 : 0;

    return new Response(
      JSON.stringify({
        byType,
        avgResponse: Math.round(avgResponse),
        weeklyTrend,
        aiAssistRatio: Math.round(aiAssistRatio),
        totalEvents: events.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch analytics" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
