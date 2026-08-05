/**
 * Minimal local stand-in for `vercel dev` (which needs an interactive
 * `vercel login`/`vercel link` we can't do in this environment). Serves the
 * production build from dist/ and dispatches /api/* to the same handler
 * modules Vercel would call — including api/_lib/adapter.ts, the exact
 * Node (req,res) entry point Vercel's runtime actually invokes — so this
 * rehearses the real deployment shape, not a separate mock path.
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

async function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string) {
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

  const moduleUrl = pathToFileURL(modulePath).href;
  const mod = await import(`${moduleUrl}?t=${Date.now()}`);
  const handler = mod.default as (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  await handler(req, res);
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
    const { pathname } = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
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
