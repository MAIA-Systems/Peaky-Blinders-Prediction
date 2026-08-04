import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/Sparkline";
import { useMarket, usePlaceTrade } from "@/hooks/useMarkets";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { cn, formatCloseDate, formatCompact, formatGbp, formatPercent } from "@/lib/utils";
import type { TradeSide } from "@/types";

const QUICK_AMOUNTS = [5, 25, 100, 500];

export function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: market, isLoading } = useMarket(id);
  const { isAuthenticated } = useAuth();
  const { data: wallet } = useWallet();
  const placeTrade = usePlaceTrade();

  const [side, setSide] = useState<TradeSide>("YES");
  const [amount, setAmount] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Loading market…</div>;
  }

  if (!market) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Market not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-gold hover:text-gold-bright">
          Back to all markets
        </Link>
      </div>
    );
  }

  const price = side === "YES" ? market.yesProbability : 1 - market.yesProbability;
  const estimatedShares = price > 0 ? amount / price : 0;
  const potentialReturn = estimatedShares - amount;

  async function handleTrade() {
    setError(null);
    setSuccess(false);
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/market/${id}` } });
      return;
    }
    try {
      await placeTrade.mutateAsync({ marketId: market!.id, side, amountGbp: amount });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All markets
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{market.category}</Badge>
        {market.community && <Badge variant="secondary">Community</Badge>}
      </div>

      <h1 className="font-display mt-3 text-2xl font-semibold leading-tight text-foreground md:text-3xl">{market.question}</h1>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="num">{formatCompact(market.volumeTotal)} volume</span>
        <span>Closes {formatCloseDate(market.closesAt)}</span>
        {market.creatorUsername && <span>Created by @{market.creatorUsername}</span>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Yes probability</span>
              <span className="num text-2xl font-semibold text-gold-bright">{formatPercent(market.yesProbability)}</span>
            </div>
            <Sparkline data={market.priceHistory} width={560} height={140} />
          </Card>

          <Card className="p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Resolution rules</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{market.rules}</p>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("YES")}
              className={cn(
                "rounded-md border px-3 py-3 text-center transition-colors",
                side === "YES" ? "border-yes/50 bg-yes/15" : "border-border hover-elevate",
              )}
              data-testid="button-side-yes"
            >
              <div className="text-[10px] uppercase tracking-wider text-yes-fg">Yes</div>
              <div className="num text-lg font-semibold text-yes-fg">{formatPercent(market.yesProbability)}</div>
            </button>
            <button
              onClick={() => setSide("NO")}
              className={cn(
                "rounded-md border px-3 py-3 text-center transition-colors",
                side === "NO" ? "border-no/50 bg-no/15" : "border-border hover-elevate",
              )}
              data-testid="button-side-no"
            >
              <div className="text-[10px] uppercase tracking-wider text-no-fg">No</div>
              <div className="num text-lg font-semibold text-no-fg">{formatPercent(1 - market.yesProbability)}</div>
            </button>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
                className="num flex h-10 w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="input-trade-amount"
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((quick) => (
                <button
                  key={quick}
                  onClick={() => setAmount(quick)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs transition-colors",
                    amount === quick ? "border-gold/40 bg-gold/10 text-gold" : "border-border text-muted-foreground hover-elevate",
                  )}
                >
                  £{quick}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-1.5 rounded-md border border-border/60 bg-background/40 p-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Est. shares</span>
              <span className="num text-foreground">{estimatedShares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Potential return</span>
              <span className="num text-yes-fg">+{formatGbp(potentialReturn)}</span>
            </div>
            {wallet && (
              <div className="flex justify-between text-muted-foreground">
                <span>Available balance</span>
                <span className="num text-foreground">{formatGbp(wallet.balance)}</span>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          {success && <p className="mt-3 text-xs text-yes-fg">Trade placed — check your Portfolio.</p>}

          <Button
            onClick={handleTrade}
            disabled={placeTrade.isPending || amount <= 0}
            className={cn("mt-4 w-full glow-gold", side === "NO" && "bg-no border-no/60 text-white")}
            data-testid="button-place-trade"
          >
            {placeTrade.isPending ? "Placing…" : isAuthenticated ? `Buy ${side}` : "Sign in to trade"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
