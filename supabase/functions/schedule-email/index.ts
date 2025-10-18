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

    const { to, subject, body, sendAt } = await req.json();

    if (!to || !subject || !body || !sendAt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body, sendAt" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate sendAt is a future date
    const sendAtDate = new Date(sendAt);
    if (isNaN(sendAtDate.getTime()) || sendAtDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: "sendAt must be a valid future date" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert scheduled email
    const { data, error } = await supabaseClient
      .from("scheduled_emails")
      .insert({
        user_id: user.id,
        to_email: to,
        subject,
        body,
        send_at: sendAt,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the scheduled event for analytics
    await supabaseClient
      .from("email_events")
      .insert({
        user_id: user.id,
        event_type: "scheduled",
        subject,
        metadata: { to, scheduledEmailId: data.id, sendAt },
      });

    return new Response(
      JSON.stringify({ success: true, scheduledEmail: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in schedule-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to schedule email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
