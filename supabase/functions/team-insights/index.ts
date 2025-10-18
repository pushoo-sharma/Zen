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

    // Get user's team
    const { data: teamLink, error: linkError } = await supabaseClient
      .from("user_team_links")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // If no team, return empty state
    if (linkError || !teamLink) {
      return new Response(
        JSON.stringify({ 
          teamId: null,
          isAdmin: false,
          stats: {},
          patterns: {}
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin using security definer function
    const { data: isAdminResult } = await supabaseClient
      .rpc("is_team_admin", {
        _user_id: user.id,
        _team_id: teamLink.team_id,
      });
    
    const isAdmin = isAdminResult || false;

    // Get team member count
    const { count } = await supabaseClient
      .from("user_team_links")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamLink.team_id);

    // Fetch team patterns
    const { data: patterns } = await supabaseClient
      .from("team_patterns")
      .select("metric, data, last_updated")
      .eq("team_id", teamLink.team_id);

    // Build insights object with mock data as fallback
    const insights: any = {
      teamId: teamLink.team_id,
      isAdmin,
      stats: {
        memberCount: count || 1,
        avgResponseTime: "4.2h",
        dominantTone: "Professional",
        clarityScore: 82,
        totalEmails: 147,
      },
      patterns: {
        toneDistribution: {
          professional: 45,
          friendly: 30,
          concise: 15,
          warm: 10,
        },
        hourlyActivity: Array.from({ length: 24 }, (_, i) => {
          // Peak hours 9-17
          return i >= 9 && i <= 17 ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 20);
        }),
        peakHours: ["9:00", "14:00", "16:00"],
        sentimentTrend: 5,
        weeklyTrend: [
          { day: "Mon", emails: 25 },
          { day: "Tue", emails: 32 },
          { day: "Wed", emails: 28 },
          { day: "Thu", emails: 35 },
          { day: "Fri", emails: 27 },
          { day: "Sat", emails: 5 },
          { day: "Sun", emails: 3 },
        ],
      },
    };

    // Override with real data if available
    if (patterns) {
      patterns.forEach((p) => {
        if (p.data) {
          (insights.patterns as any)[p.metric] = p.data;
        }
      });
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in team-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Team insights failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
