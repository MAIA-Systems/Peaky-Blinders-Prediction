import { useMemo, useState } from "react";
import { MarketCard } from "@/components/MarketCard";
import { useMarkets } from "@/hooks/useMarkets";
import { formatCompact } from "@/lib/utils";
import { CATEGORIES, type Category } from "@/types";
import { cn } from "@/lib/utils";

const FILTERS: (Category | "All")[] = ["All", ...CATEGORIES];

export function Home() {
  const [filter, setFilter] = useState<Category | "All">("All");
  const { data: markets, isLoading } = useMarkets();

  const filtered = useMemo(() => {
    if (!markets) return [];
    return filter === "All" ? markets : markets.filter((m) => m.category === filter);
  }, [markets, filter]);

  const totalVolume = useMemo(() => (markets ?? []).reduce((sum, m) => sum + m.volumeTotal, 0), [markets]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(/images/home-backdrop.jpg)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="rule-gold w-10" />
              <span className="text-[11px] uppercase tracking-[0.28em] text-gold">By Order of the Peaky Blinders</span>
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] text-foreground md:text-5xl lg:text-6xl">
              The Official Peaky Blinders <span className="text-gold">Prediction Market</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
              Trade the film. The characters. The business. And now sport, politics, music, esports and crypto — live markets on every
              outcome, settled in real time.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <Stat label="Markets" value={(markets ?? []).length} />
            <Stat label="Volume" value={formatCompact(totalVolume)} isText />
            <Stat label="Categories" value={CATEGORIES.length} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="rule-gold w-10" />
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-gold">Six categories. Every outcome. Zero hesitation.</h2>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === item ? "border-gold/40 bg-gold/10 text-gold" : "border-border text-muted-foreground hover-elevate",
              )}
              data-testid={`filter-${item.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading markets…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
            No markets in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="num text-xl font-semibold text-gold-bright md:text-2xl">{isText ? value : Number(value).toLocaleString("en-GB")}</span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </div>
  );
}
