export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Defensive headers on every API response — this is a JSON API, never
      // meant to be framed or sniffed as something else.
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      ...init?.headers,
    },
  });
}

export function errorResponse(status: number, message: string): Response {
  return json({ error: message }, { status });
}

const MAX_BODY_BYTES = 64 * 1024; // 64KB — generous for auth/payment payloads, tiny enough to block abuse

export async function readJsonBody<T = unknown>(req: Request): Promise<T> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body too large");
  }

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body too large");
  }
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function getClientIp(req: Request): string | null {
  // Vercel sets this on every request it proxies; not spoofable by the client.
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export function isHttps(req: Request): boolean {
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return true; // fail closed — assume it should be Secure if we can't tell
  }
}

/** Shared cookie builder — used for the session cookie and the short-lived
 * OAuth CSRF-state cookie alike. */
export function buildCookie(req: Request, name: string, value: string, maxAgeSeconds: number, opts?: { sameSite?: "Lax" | "Strict" }): string {
  const attrs = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", `SameSite=${opts?.sameSite ?? "Lax"}`, `Max-Age=${maxAgeSeconds}`];
  // Secure is required for cookies to work over HTTPS in real deployments,
  // but must be omitted for local http:// dev (`vercel dev`) or the browser
  // silently refuses to store the cookie at all.
  if (isHttps(req)) attrs.push("Secure");
  return attrs.join("; ");
}

/** Wraps a handler so thrown HttpErrors (and unexpected errors) become clean JSON responses. */
export function withErrorHandling(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof HttpError) {
        return errorResponse(error.status, error.message);
      }
      console.error("Unhandled API error:", error);
      return errorResponse(500, "Internal server error");
    }
  };
}
