import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemoPositions, useDemoActivity, useDemoCashout } from "@/hooks/useDemoTrading";
import { formatGbp, formatPercent, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Portfolio() {
  const { data: positions, isLoading } = useDemoPositions();
  const { data: transactions } = useDemoActivity();
  const cashout = useDemoCashout();

  const totalValue = (positions ?? []).reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalCost = (positions ?? []).reduce((sum, p) => sum + p.shares * p.avgPrice, 0);
  const unrealizedPnl = totalValue - totalCost;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Portfolio</h1>
        <Badge variant="outline">Demo</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Simulated trading — separate from your real wallet balance. Every visitor sees the same demo positions.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open Positions" value={String(positions?.length ?? 0)} />
        <Stat label="Position Value" value={formatGbp(totalValue)} />
        <Stat label="Unrealised P/L" value={formatGbp(unrealizedPnl)} tone={unrealizedPnl >= 0 ? "yes" : "no"} />
        <Stat label="Total Trades" value={String((transactions ?? []).filter((t) => t.type === "trade").length)} />
      </div>

      <h2 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">Open positions</h2>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : !positions || positions.length === 0 ? (
        <Card className="mt-3 p-6 text-center text-sm text-muted-foreground">
          No positions yet. You haven't placed a trade. The Shelbys didn't build an empire by watching from the Garrison.
          <div className="mt-3">
            <Link to="/">
              <Button variant="outline" size="sm">
                Browse markets
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-3 space-y-2">
          {positions.map((position) => {
            const value = position.shares * position.currentPrice;
            const pnl = value - position.shares * position.avgPrice;
            return (
              <Card key={position.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={position.side === "YES" ? "yes" : "no"}>{position.side}</Badge>
                    <Link to={`/market/${position.marketId}`} className="truncate text-sm text-foreground hover:text-gold">
                      {position.marketQuestion}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {position.shares.toFixed(2)} shares · avg {formatPercent(position.avgPrice)} · now {formatPercent(position.currentPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="num text-sm font-semibold text-foreground">{formatGbp(value)}</div>
                    <div className={cn("num text-xs", pnl >= 0 ? "text-yes-fg" : "text-no-fg")}>
                      {pnl >= 0 ? "+" : ""}
                      {formatGbp(pnl)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => cashout.mutate(position.id)} disabled={cashout.isPending}>
                    Cash out
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">Recent activity</h2>
      {!transactions || transactions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {transactions.slice(0, 10).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-md border border-card-border bg-card px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-foreground">{tx.detail}</div>
                <div className="text-[10px] capitalize text-muted-foreground">
                  {tx.type} · {formatRelativeTime(tx.createdAt)}
                </div>
              </div>
              <span className={cn("num shrink-0 text-xs", tx.amount >= 0 ? "text-yes-fg" : "text-muted-foreground")}>
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
      <div
        className={cn(
          "num text-lg font-semibold",
          tone === "yes" && "text-yes-fg",
          tone === "no" && "text-no-fg",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </Card>
  );
}
