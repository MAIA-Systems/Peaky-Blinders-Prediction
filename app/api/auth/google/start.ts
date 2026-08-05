import { randomBytes } from "node:crypto";
import { getGoogleConfig } from "../../_lib/google.js";
import { buildCookie } from "../../_lib/http.js";

const STATE_COOKIE = "oauth_state";

// Browser-navigated (a plain <a href>, not fetch), so errors redirect back
// into the app instead of returning JSON the user would never see rendered.
async function handler(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const config = getGoogleConfig();

  if (!config) {
    return Response.redirect(`${origin}/login?error=google_not_configured`, 302);
  }

  const state = randomBytes(16).toString("base64url");
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  // 10 minutes is generous for a user to actually complete the Google consent screen.
  headers.append("Set-Cookie", buildCookie(req, STATE_COOKIE, state, 600));

  return new Response(null, { status: 302, headers });
}

export default handler;
