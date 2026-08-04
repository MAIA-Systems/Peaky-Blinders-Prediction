import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/Sparkline";
import { formatCompact, formatCloseDate, formatPercent } from "@/lib/utils";
import type { Market } from "@/types";

export function MarketCard({ market }: { market: Market }) {
  return (
    <Link to={`/market/${market.id}`} data-testid={`card-market-${market.id}`}>
      <Card className="flex h-full flex-col p-5 transition-colors hover-elevate">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{market.category}</Badge>
            {market.community && <Badge variant="secondary">Community</Badge>}
          </div>
          <Sparkline data={market.priceHistory} />
        </div>

        <h3 className="font-display mt-3 flex-1 text-base font-semibold leading-snug text-foreground">{market.question}</h3>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-yes/30 bg-yes/10 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-yes-fg">Yes</div>
            <div className="num text-lg font-semibold text-yes-fg">{formatPercent(market.yesProbability)}</div>
          </div>
          <div className="rounded-md border border-no/30 bg-no/10 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-no-fg">No</div>
            <div className="num text-lg font-semibold text-no-fg">{formatPercent(1 - market.yesProbability)}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="num">{formatCompact(market.volumeTotal)} vol.</span>
          <span>Closes {formatCloseDate(market.closesAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
