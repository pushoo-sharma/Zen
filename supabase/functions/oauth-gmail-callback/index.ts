import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    if (!code || !stateParam) {
      throw new Error("Missing authorization code or state");
    }

    // Validate state parameter against stored states
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean up expired states first
    await supabase.rpc('cleanup_expired_oauth_states');

    // Retrieve and validate state
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .select("user_id")
      .eq("state", stateParam)
      .single();

    if (stateError || !stateData) {
      console.error("Invalid or expired state:", stateError);
      throw new Error("Invalid or expired state parameter");
    }

    const userId = stateData.user_id;

    // Delete used state immediately
    await supabase
      .from("oauth_states")
      .delete()
      .eq("state", stateParam);

    let appOrigin: string | null = null;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const REDIRECT_URI = `${url.origin}/functions/v1/oauth-gmail-callback`;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Google OAuth credentials not configured");
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange authorization code");
    }

    const tokens = await tokenResponse.json();

    // Get user's email address
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("oauth_connections")
      .upsert({
        user_id: userId,
        provider: "gmail",
        email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      }, {
        onConflict: "user_id,provider,email"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store OAuth tokens");
    }

    // Redirect back to app with success
    const appBase = (appOrigin || Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL"));
    const redirectBase = (appBase ? appBase : url.origin).replace(/\/+$/, "");
    const redirectUrl = `${redirectBase}/settings?gmail_connected=true`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorBase = Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || new URL(req.url).origin;
    const errorUrl = `${errorBase.replace(/\/+$/, "")}/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: errorUrl,
        ...corsHeaders,
      },
    });
  }
});
