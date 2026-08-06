import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import { TwitchChat, TwitchPlayer, TWITCH_CHANNEL } from "@/components/TwitchEmbed";
import { useMarket } from "@/hooks/useMarkets";
import { useTrendingStream } from "@/hooks/useTrendingTwitch";
import { formatPercent } from "@/lib/utils";

export function Stream() {
  const { data: market } = useMarket("tommygungaming-ranked");
  const { data: trending, isLoading: isTrendingLoading, isError: isTrendingError } = useTrendingStream();

  // Falls back to the static placeholder channel if Twitch isn't configured
  // yet, or the category genuinely has nothing live and embeddable right now.
  const channel = trending?.channel ?? TWITCH_CHANNEL;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-3">
        <span className="rule-gold w-10" />
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">FanEngine Embedded Widget</span>
      </div>
      <h1 className="font-display mt-2 text-2xl font-semibold text-foreground md:text-3xl">Live inside any Twitch stream</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A real, live Twitch stream and chat, embedded with Twitch's own player — proving the integration works with any channel.
        The betting overlay below it is a separate, fictional example (not tied to this streamer), showing what FanEngine would
        add once a creator actually opts in.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-card-border bg-black">
          <TwitchPlayer key={channel} channel={channel} className="aspect-video w-full" />
        </div>
        <div className="overflow-hidden rounded-lg border border-card-border">
          <TwitchChat key={channel} channel={channel} className="h-full min-h-[360px] w-full lg:min-h-0" />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {isTrendingLoading && <span>Finding the most-watched VALORANT stream right now…</span>}
        {!isTrendingLoading && trending && (
          <>
            <span className="inline-flex items-center gap-1 text-gold">
              <Radio className="h-3 w-3" /> Trending #1 in VALORANT
            </span>
            <span>
              — <span className="text-foreground">{trending.displayName}</span> ·{" "}
              <span className="num">{trending.viewers.toLocaleString("en-GB")}</span> viewers · refreshes every 60s
            </span>
          </>
        )}
        {!isTrendingLoading && !trending && (
          <span>
            {isTrendingError
              ? "Live trending lookup isn't configured yet — showing a placeholder channel instead."
              : "No embeddable VALORANT stream is live right now — showing a placeholder channel instead."}{" "}
            (<span className="num text-foreground">{channel}</span>)
          </span>
        )}
      </div>

      <Card className="mt-8 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline">Concept mockup</Badge>
          <span className="text-xs text-muted-foreground">Fictional market — not connected to the stream above</span>
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground">What FanEngine adds, once a creator opts in</h2>
        {market && (
          <div className="mt-4 max-w-sm rounded-md border border-gold/30 bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{market.category}</Badge>
              <span className="num text-xs text-gold-bright">{formatPercent(market.yesProbability)} YES</span>
            </div>
            <p className="mt-2 text-xs font-medium leading-snug text-foreground">{market.question}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Trade the outcome above — settled instantly against your Peaky Blinders wallet.</p>
            <Link to={`/market/${market.id}`}>
              <Button size="sm" className="mt-2 w-full glow-gold">
                Trade now
              </Button>
            </Link>
          </div>
        )}
      </Card>

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
