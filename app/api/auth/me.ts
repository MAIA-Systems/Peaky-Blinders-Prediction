import { getSessionUser } from "../_lib/session.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await getSessionUser(req);
  return json({ user });
}

export default withErrorHandling(handler);
