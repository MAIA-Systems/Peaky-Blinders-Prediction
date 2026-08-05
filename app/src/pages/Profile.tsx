import { Calendar, Pencil, Twitch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDemoPositions, useDemoActivity } from "@/hooks/useDemoTrading";
import { cn, formatGbp, formatRelativeTime } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Profile() {
  const { user } = useAuth();
  const { data: positions } = useDemoPositions();
  const { data: transactions } = useDemoActivity();

  if (!user) return null;

  const trades = (transactions ?? []).filter((t) => t.type === "trade");
  const volumeTraded = trades.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  // Net cash flow from trading + cashing out (deposits excluded) — a simple stand-in
  // for realised P/L until the backend tracks cost basis per closed position.
  const realisedPnl = (transactions ?? [])
    .filter((t) => t.type === "trade" || t.type === "cashout")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Card className="p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="h-14 w-14 text-base" />
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">{user.name}</h1>
              <p className="text-sm text-gold">@{user.username}</p>
              {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined{" "}
                  {new Date(user.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
                {user.socials?.x && <XIcon className="h-3.5 w-3.5" />}
                {user.socials?.twitch && <Twitch className="h-3.5 w-3.5 text-twitch" />}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </Button>
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Trading stats</h2>
        <Badge variant="outline">Demo</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Trades" value={String(trades.length)} />
        <Stat label="Open Positions" value={String(positions?.length ?? 0)} />
        <Stat label="Volume Traded" value={formatGbp(volumeTraded)} />
        <Stat label="Realised P/L" value={formatGbp(realisedPnl)} tone={realisedPnl >= 0 ? "yes" : "no"} />
      </div>

      <h2 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">Recent activity</h2>
      {!transactions || transactions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No trades yet. Your moves will show up here.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-md border border-card-border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{tx.detail}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  {tx.type} · {formatRelativeTime(tx.createdAt)}
                </div>
              </div>
              <span className={cn("num shrink-0 text-sm", tx.amount >= 0 ? "text-yes-fg" : "text-muted-foreground")}>
                {tx.amount >= 0 ? "+" : ""}
                {formatGbp(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "yes" | "no" }) {
  return (
    <Card className="p-4">
      <div className={cn("num text-lg font-semibold", tone === "yes" && "text-yes-fg", tone === "no" && "text-no-fg", !tone && "text-foreground")}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </Card>
  );
}
