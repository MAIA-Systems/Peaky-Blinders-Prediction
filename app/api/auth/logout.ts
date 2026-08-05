import { clearSessionCookie, destroySession } from "../_lib/session.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  await destroySession(req);
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(req) } });
}

export default withErrorHandling(handler);
