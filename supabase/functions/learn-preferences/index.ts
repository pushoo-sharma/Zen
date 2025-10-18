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
    // Validate internal secret for cron job authentication
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_CRON_SECRET");
    
    if (internalSecret !== expectedSecret) {
      console.error("Unauthorized cron access attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting nightly learning job...");

    // Fetch all users with activity in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("email_events")
      .select("user_id, created_at, event_type")
      .gte("created_at", thirtyDaysAgo);

    if (eventsError) {
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log("No recent events found");
      return new Response(
        JSON.stringify({ ok: true, message: "No recent events to learn from" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Group by user
    const userEvents = new Map<string, any[]>();
    events.forEach((event) => {
      if (!userEvents.has(event.user_id)) {
        userEvents.set(event.user_id, []);
      }
      userEvents.get(event.user_id)!.push(event);
    });

    console.log(`Processing ${userEvents.size} users...`);

    let processed = 0;
    for (const [userId, userEventList] of userEvents) {
      try {
        // Calculate hour-of-day bias
        const hourBias: Record<number, { engaged: number; total: number }> = {};

        for (const event of userEventList) {
          const hour = new Date(event.created_at).getHours();
          
          if (!hourBias[hour]) {
            hourBias[hour] = { engaged: 0, total: 0 };
          }

          hourBias[hour].total++;

          // Count engagement actions
          if (["opened", "replied", "ai_drafted", "sent"].includes(event.event_type)) {
            hourBias[hour].engaged++;
          }
        }

        // Calculate engagement ratio per hour
        const hourBiasScores: Record<number, number> = {};
        for (const [hour, stats] of Object.entries(hourBias)) {
          if (stats.total > 0) {
            // Engagement ratio normalized to [-1, 1] range
            const ratio = stats.engaged / stats.total;
            // Map 0-1 to -0.5 to 0.5 for subtle bias adjustment
            hourBiasScores[parseInt(hour)] = parseFloat(((ratio - 0.5) * 1.0).toFixed(2));
          }
        }

        // Upsert preferences
        const { error: upsertError } = await supabaseAdmin
          .from("recommendation_preferences")
          .upsert(
            {
              user_id: userId,
              hour_bias: hourBiasScores,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        if (upsertError) {
          console.error(`Error updating preferences for user ${userId}:`, upsertError);
          continue;
        }

        processed++;
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    console.log(`Successfully processed ${processed} users`);

    return new Response(
      JSON.stringify({
        ok: true,
        usersProcessed: processed,
        totalUsers: userEvents.size,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in learn-preferences:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Learning job failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
