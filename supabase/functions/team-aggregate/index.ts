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

    console.log("Starting team pattern aggregation...");

    // Get all team links
    const { data: links, error: linksError } = await supabaseAdmin
      .from("user_team_links")
      .select("user_id, team_id");

    if (linksError) {
      console.error("Error fetching team links:", linksError);
      throw linksError;
    }

    if (!links || links.length === 0) {
      console.log("No team links found");
      return new Response(
        JSON.stringify({ ok: true, message: "No teams to aggregate", teams: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get unique teams
    const teams = [...new Set(links.map((l) => l.team_id))];
    console.log(`Found ${teams.length} teams to process`);

    for (const teamId of teams) {
      console.log(`Processing team: ${teamId}`);
      
      // Get team members
      const teamMembers = links
        .filter((l) => l.team_id === teamId)
        .map((l) => l.user_id);

      console.log(`Team ${teamId} has ${teamMembers.length} members`);

      // Fetch email events for team members
      const { data: events, error: eventsError } = await supabaseAdmin
        .from("email_events")
        .select("event_type, response_time_seconds, created_at")
        .in("user_id", teamMembers);

      if (eventsError) {
        console.error(`Error fetching events for team ${teamId}:`, eventsError);
        continue;
      }

      if (!events || events.length === 0) {
        console.log(`No events found for team ${teamId}`);
        continue;
      }

      console.log(`Found ${events.length} events for team ${teamId}`);

      // Calculate average response time
      const responseEvents = events.filter(
        (e) => e.response_time_seconds && e.response_time_seconds > 0
      );
      const avgResponse =
        responseEvents.length > 0
          ? responseEvents.reduce(
              (sum, e) => sum + (e.response_time_seconds || 0),
              0
            ) / responseEvents.length
          : 0;

      console.log(`Team ${teamId} avg response time: ${avgResponse}s`);

      // Calculate event type distribution
      const eventTypes = events.reduce((acc: any, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {});

      const totalEvents = events.length;
      const eventDistribution = Object.fromEntries(
        Object.entries(eventTypes).map(([type, count]) => [
          type,
          Number(((count as number) / totalEvents).toFixed(3)),
        ])
      );

      console.log(`Team ${teamId} event distribution:`, eventDistribution);

      // Calculate activity by hour (for timing recommendations)
      const hourActivity = events.reduce((acc: any, e) => {
        const hour = new Date(e.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      console.log(`Team ${teamId} hour activity calculated`);

      // Store aggregated metrics
      const now = new Date().toISOString();

      // Upsert average reply time
      await supabaseAdmin.from("team_patterns").upsert(
        {
          team_id: teamId,
          metric: "avg_reply_time",
          data: { value: Math.round(avgResponse), unit: "seconds" },
          last_updated: now,
        },
        { onConflict: "team_id,metric" }
      );

      // Upsert event distribution
      await supabaseAdmin.from("team_patterns").upsert(
        {
          team_id: teamId,
          metric: "event_distribution",
          data: eventDistribution,
          last_updated: now,
        },
        { onConflict: "team_id,metric" }
      );

      // Upsert hour activity
      await supabaseAdmin.from("team_patterns").upsert(
        {
          team_id: teamId,
          metric: "hour_activity",
          data: hourActivity,
          last_updated: now,
        },
        { onConflict: "team_id,metric" }
      );

      console.log(`Successfully aggregated patterns for team ${teamId}`);
    }

    console.log(`Team aggregation complete. Processed ${teams.length} teams.`);

    return new Response(
      JSON.stringify({ ok: true, teams: teams.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in team-aggregate:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Team aggregation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
