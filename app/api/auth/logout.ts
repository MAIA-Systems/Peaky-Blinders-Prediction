import { clearSessionCookie, destroySession } from "../_lib/session.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  await destroySession(req);
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(req) } });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);