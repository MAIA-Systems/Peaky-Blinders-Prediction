import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers } from "@/hooks/useAdmin";
import { formatGbp, formatRelativeTime } from "@/lib/utils";

export function Admin() {
  const { data: users, isLoading, error } = useAdminUsers();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-3">
        <span className="rule-gold w-10" />
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Admin</span>
      </div>
      <h1 className="font-display mt-2 text-2xl font-semibold text-foreground md:text-3xl">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real accounts, from the database — this list only loads for the <code className="text-gold">admin</code> role, enforced
        server-side.
      </p>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}

      {users && (
        <div className="mt-6 space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  <Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {u.email} · joined {formatRelativeTime(u.createdAt)}
                </div>
              </div>
              <div className="num text-sm text-foreground">{formatGbp((u.balanceCents ?? 0) / 100)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
