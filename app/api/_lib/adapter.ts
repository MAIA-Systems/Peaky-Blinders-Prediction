import type { IncomingMessage, ServerResponse } from "node:http";

type FetchHandler = (req: Request) => Promise<Response>;
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/**
 * Every handler in this project is written against the Fetch API
 * (Request in, Response out) — it reads cleanly and is trivial to unit
 * test (see scripts/test-backend.ts, which calls handlers directly with
 * plain `new Request(...)`).
 *
 * Vercel's Node.js runtime, however, invokes functions with the classic
 * `(req, res)` signature (Node's IncomingMessage/ServerResponse) — it
 * does not auto-detect a Fetch-style export. This adapter is the one
 * seam that bridges the two, so every route file's actual logic never
 * has to know which world it's running in.
 */
export function toNodeHandler(fetchHandler: FetchHandler): NodeHandler {
  return async (req, res) => {
    const host = req.headers.host ?? "localhost";
    // Vercel's proxy always sets this to "https" — it's only ever absent in
    // local dev (this rehearsal server, plain http), where "http" is correct.
    const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
    const url = `${proto}://${host}${req.url ?? "/"}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(", "));
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body: Buffer | undefined;
    if (hasBody) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      body = Buffer.concat(chunks);
    }

    const fetchReq = new Request(url, {
      method: req.method,
      headers,
      body: body && body.length > 0 ? body : undefined,
    });

    const fetchRes = await fetchHandler(fetchReq);

    res.statusCode = fetchRes.status;
    for (const [key, value] of fetchRes.headers.entries()) {
      // Multiple Set-Cookie headers collapse into one comma-joined string
      // through a plain Headers iteration — handled separately below via
      // getSetCookie(), which keeps them as an array Node can send as
      // distinct header lines.
      if (key.toLowerCase() === "set-cookie") continue;
      res.setHeader(key, value);
    }
    const setCookies = fetchRes.headers.getSetCookie();
    if (setCookies.length > 0) res.setHeader("Set-Cookie", setCookies);

    const buf = Buffer.from(await fetchRes.arrayBuffer());
    res.end(buf);
  };
}
