/**
 * Minimal local stand-in for `vercel dev` (which needs an interactive
 * `vercel login`/`vercel link` we can't do in this environment). Serves the
 * production build from dist/ and dispatches /api/* to the same handler
 * modules Vercel would call, using the same Fetch Request/Response shape —
 * so this is a faithful rehearsal of the real deployment, not a separate
 * mock path.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";

const PORT = 3000;
const DIST_DIR = join(process.cwd(), "dist");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function nodeReqToFetchRequest(req: IncomingMessage, url: string): Promise<Request> {
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

  return new Request(url, { method: req.method, headers, body: body && body.length > 0 ? body : undefined });
}

function sendFetchResponse(res: ServerResponse, fetchRes: Response, body: string) {
  res.statusCode = fetchRes.status;
  for (const [key, value] of fetchRes.headers.entries()) {
    // Headers can repeat (e.g. multiple Set-Cookie) — Fetch's Headers merges
    // them with ", " which breaks Set-Cookie specifically, so special-case it
    // via getSetCookie(), which keeps them as separate values.
    if (key.toLowerCase() === "set-cookie") continue;
    res.setHeader(key, value);
  }
  const setCookies = fetchRes.headers.getSetCookie();
  if (setCookies.length > 0) res.setHeader("Set-Cookie", setCookies);
  res.end(body);
}

async function handleApi(req: IncomingMessage, res: ServerResponse, fullUrl: string, pathname: string) {
  const routePath = pathname.replace(/^\/api\//, "");
  // Vercel resolves both api/<route>.ts and api/<route>/index.ts to the same
  // path — this rehearsal server needs to try both, not just the first.
  const directPath = join(process.cwd(), "api", `${routePath}.ts`);
  const indexPath = join(process.cwd(), "api", routePath, "index.ts");
  const modulePath = existsSync(directPath) ? directPath : existsSync(indexPath) ? indexPath : null;

  if (!modulePath) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const fetchReq = await nodeReqToFetchRequest(req, fullUrl);
  const moduleUrl = pathToFileURL(modulePath).href;
  const mod = await import(`${moduleUrl}?t=${Date.now()}`);
  const handler = mod.default as (r: Request) => Promise<Response>;
  const fetchRes = await handler(fetchReq);
  const body = await fetchRes.text();
  sendFetchResponse(res, fetchRes, body);
}

async function handleStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
  let filePath = join(DIST_DIR, pathname === "/" ? "index.html" : pathname);
  if (!existsSync(filePath)) filePath = join(DIST_DIR, "index.html"); // SPA fallback, mirrors vercel.json

  const ext = extname(filePath);
  const content = await readFile(filePath);
  res.setHeader("Content-Type", CONTENT_TYPES[ext] ?? "application/octet-stream");
  res.end(content);
}

const server = createServer(async (req, res) => {
  try {
    // req.url already includes the query string (e.g. "/api/auth/google/callback?code=..&state=..") —
    // routing only needs the pathname, but the handler needs the full thing.
    const { pathname } = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const fullUrl = `http://localhost:${PORT}${req.url ?? "/"}`;
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, fullUrl, pathname);
    } else {
      await handleStatic(req, res, pathname);
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Local rehearsal server → http://localhost:${PORT}`);
});
