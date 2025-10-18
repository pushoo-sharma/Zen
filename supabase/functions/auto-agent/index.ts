import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Auto-agent: Fetching pending actions...");

    // Fetch high-confidence pending actions
    const { data: actions, error } = await supabaseAdmin
      .from("auto_actions")
      .select("*")
      .eq("status", "pending")
      .gte("confidence", 0.8)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching actions:", error);
      throw error;
    }

    if (!actions || actions.length === 0) {
      console.log("No pending actions to process");
      return new Response(JSON.stringify({ ok: true, executed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${actions.length} pending actions...`);

    let executedCount = 0;

    for (const action of actions) {
      try {
        console.log(`Executing action ${action.id}: ${action.action}`);

        switch (action.action) {
          case "draft":
            // Create scheduled email for user approval
            if (action.payload?.to && action.payload?.body) {
              const sendAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
              await supabaseAdmin.from("scheduled_emails").insert({
                user_id: action.user_id,
                to_email: action.payload.to,
                subject: action.payload.subject || "Draft Reply",
                body: action.payload.body,
                send_at: sendAt.toISOString(),
                status: "pending",
              });
            }
            break;

          case "send":
            // Placeholder for direct send via Gmail API
            console.log("Send action not yet implemented");
            break;

          case "snooze":
            // Placeholder for snooze logic
            console.log("Snooze action not yet implemented");
            break;

          case "archive":
            // Placeholder for archive logic
            console.log("Archive action not yet implemented");
            break;

          default:
            console.log(`Unknown action type: ${action.action}`);
            continue;
        }

        // Mark as executed
        await supabaseAdmin
          .from("auto_actions")
          .update({
            status: "executed",
            executed_at: new Date().toISOString(),
          })
          .eq("id", action.id);

        executedCount++;
      } catch (actionError: any) {
        console.error(`Error executing action ${action.id}:`, actionError);
        // Continue with next action
      }
    }

    console.log(`Auto-agent completed: ${executedCount} actions executed`);

    return new Response(
      JSON.stringify({ ok: true, executed: executedCount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-agent:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Agent execution failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});