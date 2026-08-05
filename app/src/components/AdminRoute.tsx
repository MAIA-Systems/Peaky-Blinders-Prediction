import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/** Like ProtectedRoute, but also requires role === "admin". The real
 * enforcement lives server-side (api/_lib/authz.ts requireAdmin) — this
 * only decides what the standard-role UI renders, never the source of truth. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
