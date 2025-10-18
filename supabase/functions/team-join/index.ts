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

    const { teamId, action } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "teamId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "join") {
      // Join or update team
      const { error } = await supabaseClient
        .from("user_team_links")
        .upsert(
          {
            user_id: user.id,
            team_id: teamId,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, message: "Successfully joined team" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "leave") {
      // Leave team
      const { error } = await supabaseClient
        .from("user_team_links")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, message: "Successfully left team" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'join' or 'leave'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in team-join:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Team join/leave failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
