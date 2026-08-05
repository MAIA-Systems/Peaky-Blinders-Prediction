import { clearSessionCookie, destroySession } from "../_lib/session";
import { errorResponse, json, withErrorHandling } from "../_lib/http";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  await destroySession(req);
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(req) } });
}

export default withErrorHandling(handler);
