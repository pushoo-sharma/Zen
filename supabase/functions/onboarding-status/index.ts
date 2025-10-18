import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_STEPS = {
  connect_email: false,
  try_priority: false,
  send_draft: false,
  add_calendar: false,
  review_digest: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    if (req.method === "GET") {
      // Get onboarding status
      let { data, error } = await supabaseClient
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no record exists, create one
      if (!data) {
        const { data: newData, error: insertError } = await supabaseClient
          .from("onboarding_progress")
          .insert({
            user_id: user.id,
            steps: DEFAULT_STEPS,
            completed: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      // Update onboarding status
      const body = await req.json();
      const { step, completed } = body;

      if (!step) throw new Error("Step name required");

      // Get current progress
      let { data: current } = await supabaseClient
        .from("onboarding_progress")
        .select("steps, completed")
        .eq("user_id", user.id)
        .maybeSingle();

      // Initialize if doesn't exist
      if (!current) {
        const { data: newData, error: insertError } = await supabaseClient
          .from("onboarding_progress")
          .insert({
            user_id: user.id,
            steps: { ...DEFAULT_STEPS, [step]: true },
            completed: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        return new Response(JSON.stringify(newData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Update step
      const updatedSteps = { ...current.steps, [step]: completed !== false };
      const allCompleted = Object.values(updatedSteps).every((v) => v === true);

      const { data: updated, error: updateError } = await supabaseClient
        .from("onboarding_progress")
        .update({
          steps: updatedSteps,
          completed: allCompleted,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify(updated), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Method not allowed");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in onboarding-status:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
