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

    console.log(`Resetting learning data for user: ${user.id}`);

    // Delete all email events for this user (feedback and analytics)
    const { error: eventsError } = await supabaseClient
      .from("email_events")
      .delete()
      .eq("user_id", user.id);

    if (eventsError) {
      console.error("Error deleting events:", eventsError);
      throw eventsError;
    }

    // Delete recommendation preferences
    const { error: prefsError } = await supabaseClient
      .from("recommendation_preferences")
      .delete()
      .eq("user_id", user.id);

    if (prefsError) {
      console.error("Error deleting preferences:", prefsError);
      throw prefsError;
    }

    console.log("Learning data reset successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "All learning data has been cleared. Smart suggestions will use default scoring until new patterns are learned."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-learning:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to reset learning data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
