import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import { useMarket } from "@/hooks/useMarkets";
import { formatPercent } from "@/lib/utils";

export function Stream() {
  const { data: market } = useMarket("tommygungaming-ranked");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-3">
        <span className="rule-gold w-10" />
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">FanEngine Embedded Widget</span>
      </div>
      <h1 className="font-display mt-2 text-2xl font-semibold text-foreground md:text-3xl">Live inside any Twitch stream</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Same wallet. Same markets. Zero user acquisition. This is a demo of the FanEngine widget embedded directly into a creator's
        stream — viewers trade without ever leaving Twitch.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="relative aspect-video w-full bg-black">
          <img src="/images/game-feed.jpg" alt="Live stream feed" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            <Radio className="h-3 w-3 animate-pulse" /> Live
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <img src="/images/streamer-avatar.jpg" alt="TommyGunGaming" className="h-9 w-9 rounded-full border-2 border-white/80 object-cover" />
            <div>
              <p className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">TommyGunGaming</p>
              <p className="text-xs text-twitch">Ranked Grind — can we hit Diamond tonight?</p>
            </div>
          </div>

          {market && (
            <div className="absolute bottom-3 right-3 w-[min(280px,calc(100%-1.5rem))] rounded-md border border-gold/30 bg-background/90 p-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{market.category}</Badge>
                <span className="num text-xs text-gold-bright">{formatPercent(market.yesProbability)} YES</span>
              </div>
              <p className="mt-2 text-xs font-medium leading-snug text-foreground">{market.question}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Trade the outcome above — settled instantly against your Peaky Blinders wallet.
              </p>
              <Link to={`/market/${market.id}`}>
                <Button size="sm" className="mt-2 w-full glow-gold">
                  Trade now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">How it works</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. A streamer or IP holder adds one script tag to their overlay or site.</li>
          <li>2. FanEngine renders live markets tied to their content, pulling odds from the same order book as peaky-predictions.pplx.app.</li>
          <li>3. Viewers trade with the wallet they already have — no new sign-up, no separate app.</li>
        </ol>
      </Card>

      <div className="mt-6 flex justify-center">
        <PoweredByBadge />
      </div>
    </div>
  );
}
