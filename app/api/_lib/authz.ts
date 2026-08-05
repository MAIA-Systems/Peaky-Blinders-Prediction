import { getSessionUser, type SessionUser } from "./session";
import { HttpError } from "./http";

/** Throws 401 if there's no valid session. */
export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

/** Throws 401/403 unless the session belongs to an admin. Role check happens
 * server-side against the DB row every time — never trust a client-supplied role. */
export async function requireAdmin(req: Request): Promise<SessionUser> {
  const user = await requireUser(req);
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}
