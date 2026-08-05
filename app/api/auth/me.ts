import { getSessionUser } from "../_lib/session.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await getSessionUser(req);
  return json({ user });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);