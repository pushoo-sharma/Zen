import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { confirm_deletion } = await req.json();
    if (!confirm_deletion) {
      throw new Error("Deletion not confirmed");
    }

    // Delete data in order (respecting foreign key constraints)
    const tables = [
      'audit_logs',
      'email_events',
      'mem_threads',
      'mem_contacts',
      'mem_prefs',
      'agent_traces',
      'auto_actions',
      'scheduled_emails',
      'recommendation_preferences',
      'voice_profiles',
      'oauth_connections',
      'oauth_states',
      'data_retention_settings',
      'privacy_consents',
      'onboarding_progress',
      'user_team_roles',
      'user_team_links',
      'profiles'
    ];

    for (const table of tables) {
      logStep(`Deleting from ${table}`);
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq('user_id', user.id);
      
      if (error && error.code !== '42P01') { // Ignore table doesn't exist errors
        logStep(`Error deleting from ${table}`, { error: error.message });
      }
    }

    // Finally, delete the user account
    logStep("Deleting user account");
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      logStep("Error deleting user", { error: deleteUserError.message });
      throw deleteUserError;
    }

    logStep("User data deletion complete");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "All user data has been permanently deleted" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
