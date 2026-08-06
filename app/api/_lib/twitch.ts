import { HttpError } from "./http.js";

// VALORANT was picked deliberately over Counter-Strike: Twitch rates the
// entire CS category as a "MatureGame" (graphic violence) — confirmed by
// querying every live CS stream's content classification labels, all of
// which carried it — and mature-rated content forces a hard sign-in wall
// in Twitch's non-interactive embed player with no supported bypass. Top
// VALORANT streams don't carry that category-wide label, so the embed
// actually plays for anonymous viewers.
const TRENDING_GAME_NAME = "VALORANT";

// Twitch's own public web client id (shipped in their frontend bundle, not
// a secret) — used read-only against gql.twitch.tv, the same internal API
// the twitch.tv website itself calls. This is undocumented/unofficial, so
// it can change or stop working without notice; every call here is wrapped
// so a failure just means that one candidate stream gets skipped, not a
// crash.
const TWITCH_GQL_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Module-level cache: survives for the life of a warm serverless instance,
// saving a token request on every call — not guaranteed across cold starts,
// which is fine, it just means an occasional extra token fetch.
let cachedToken: CachedToken | null = null;

interface TwitchConfig {
  clientId: string;
  clientSecret: string;
}

function getTwitchConfig(): TwitchConfig | null {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function getAppAccessToken(config: TwitchConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!response.ok) {
    throw new Error(`Twitch token request failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function helixGet<T>(path: string, config: TwitchConfig, token: string): Promise<T> {
  const response = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: { "Client-Id": config.clientId, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Twitch API request failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

interface HelixGamesResponse {
  data: { id: string; name: string }[];
}
interface HelixStreamsResponse {
  data: { user_login: string; user_name: string; title: string; viewer_count: number }[];
}

export interface TrendingStream {
  channel: string;
  displayName: string;
  title: string;
  viewers: number;
}

/** True if the channel's current live stream carries no content
 * classification labels at all (Gambling, Mature Game, Sexual Themes,
 * etc.) — i.e. it will play in an anonymous embed without Twitch's
 * sign-in wall. Fails "closed" (treats errors as gated) so an outage or
 * schema change on this unofficial endpoint just skips a candidate
 * rather than risking a gated stream slipping through. */
async function embedsWithoutSignIn(login: string): Promise<boolean> {
  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Id": TWITCH_GQL_CLIENT_ID },
      body: JSON.stringify({
        query: `query { user(login: "${login}") { stream { contentClassificationLabels { id } } } }`,
      }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      data?: { user?: { stream?: { contentClassificationLabels: { id: string }[] } | null } | null };
    };
    const stream = data.data?.user?.stream;
    return stream != null && stream.contentClassificationLabels.length === 0;
  } catch {
    return false;
  }
}

/** Resolves the top (most-viewed) currently-live stream in the trending
 * game category that's confirmed safe to embed anonymously. Returns null
 * if the category is empty right now, or every live stream we checked is
 * content-classification-flagged. */
export async function getTopTrendingStream(): Promise<TrendingStream | null> {
  const config = getTwitchConfig();
  if (!config) throw new HttpError(503, "Twitch integration is not configured yet.");

  const token = await getAppAccessToken(config);

  const games = await helixGet<HelixGamesResponse>(`/games?name=${encodeURIComponent(TRENDING_GAME_NAME)}`, config, token);
  const game = games.data[0];
  if (!game) return null;

  const streams = await helixGet<HelixStreamsResponse>(`/streams?game_id=${game.id}&first=15`, config, token);
  for (const stream of streams.data) {
    if (await embedsWithoutSignIn(stream.user_login)) {
      return { channel: stream.user_login, displayName: stream.user_name, title: stream.title, viewers: stream.viewer_count };
    }
  }

  return null;
}
