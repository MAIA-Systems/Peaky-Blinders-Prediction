export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
}

export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function exchangeCodeForTokens(config: GoogleConfig, code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Google userinfo fetch failed: ${response.status}`);
  }
  return (await response.json()) as GoogleUserInfo;
}
