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

    const { threadId, contact } = await req.json();

    // Get user's memory preferences
    const { data: prefs } = await supabaseClient
      .from("mem_prefs")
      .select("flags")
      .eq("user_id", user.id)
      .single();

    const maxChars = prefs?.flags?.max_context_chars ?? 2000;
    const useMemory = prefs?.flags?.use_memory ?? true;

    if (!useMemory) {
      return new Response(
        JSON.stringify({ context: "" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contextParts: string[] = [];

    // Fetch thread summary if threadId provided
    if (threadId) {
      const { data: threadMem } = await supabaseClient
        .from("mem_threads")
        .select("summary, subject")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .maybeSingle();

      if (threadMem?.summary) {
        contextParts.push(`THREAD SUMMARY (${threadMem.subject}):\n${threadMem.summary}`);
      }
    }

    // Fetch contact notes if contact provided
    if (contact) {
      const { data: contactMem } = await supabaseClient
        .from("mem_contacts")
        .select("notes, preferences")
        .eq("user_id", user.id)
        .eq("contact", contact)
        .maybeSingle();

      if (contactMem?.notes) {
        contextParts.push(`CONTACT NOTES (${contact}):\n${contactMem.notes}`);
      }

      if (contactMem?.preferences && Object.keys(contactMem.preferences).length > 0) {
        contextParts.push(`CONTACT PREFERENCES:\n${JSON.stringify(contactMem.preferences, null, 2)}`);
      }
    }

    const context = contextParts.join("\n\n").slice(0, maxChars);

    return new Response(
      JSON.stringify({ context }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in memory-context:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Context fetch failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
