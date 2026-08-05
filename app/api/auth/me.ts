import { getSessionUser } from "../_lib/session";
import { errorResponse, json, withErrorHandling } from "../_lib/http";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await getSessionUser(req);
  return json({ user });
}

export default withErrorHandling(handler);
