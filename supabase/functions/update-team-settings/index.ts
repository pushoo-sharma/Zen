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

    const { teamId, settings } = await req.json();

    if (!teamId || !settings) {
      return new Response(
        JSON.stringify({ error: "Missing teamId or settings" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is a member of the team
    const { data: teamLink } = await supabaseClient
      .from("user_team_links")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (!teamLink) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this team" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is admin using security definer function
    const { data: isAdminResult, error: adminCheckError } = await supabaseClient
      .rpc("is_team_admin", {
        _user_id: user.id,
        _team_id: teamId,
      });

    if (adminCheckError || !isAdminResult) {
      console.error("Admin check error:", adminCheckError);
      return new Response(
        JSON.stringify({ error: "Only team admins can update settings" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Store settings in team_patterns table using service role
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseServiceRole
      .from("team_patterns")
      .upsert({
        team_id: teamId,
        metric: "ai_preferences",
        data: settings,
        last_updated: new Date().toISOString(),
      });

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Settings updated" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error updating team settings:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Update failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
