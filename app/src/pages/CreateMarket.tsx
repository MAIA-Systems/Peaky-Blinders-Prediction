import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import { useCreateMarket } from "@/hooks/useMarkets";
import { createMarketSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Category } from "@/types";

const SEED_AMOUNTS = [100, 250, 500, 1000];

function defaultCloseDate() {
  const date = new Date(Date.now() + 30 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function CreateMarket() {
  const navigate = useNavigate();
  const createMarket = useCreateMarket();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<Category>("Sports");
  const [rules, setRules] = useState("");
  const [closeDate, setCloseDate] = useState(defaultCloseDate());
  const [probability, setProbability] = useState(50);
  const [seedLiquidity, setSeedLiquidity] = useState(250);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const closesAt = new Date(`${closeDate}T23:59:59`).toISOString();
    const result = createMarketSchema.safeParse({
      question,
      category,
      rules,
      closesAt,
      initialYesProbability: probability / 100,
      seedLiquidity,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }

    const market = await createMarket.mutateAsync(result.data);
    navigate(`/market/${market.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← All markets
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="rule-gold w-10" />
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Launch a market</span>
      </div>
      <h1 className="font-display mt-2 text-2xl font-semibold text-foreground md:text-3xl">
        Create a <span className="text-gold">Community</span> market
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pose a question, set the rules, seed the liquidity. It goes live instantly and trades just like every other market on the
        platform.
      </p>

      <Card className="mt-6 p-5">
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="question">Question</Label>
              <span className="text-xs text-muted-foreground">{question.length}/120</span>
            </div>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will England win the 2026 World Cup?"
              maxLength={120}
              data-testid="input-question"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Frame it as a clear yes/no question.</p>
            {errors.question && <p className="mt-1 text-xs text-destructive">{errors.question}</p>}
          </div>

          <div className="mt-4">
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} data-testid="select-category">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4">
            <Label htmlFor="rules">Resolution rules</Label>
            <Textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Resolves YES if… Describe the exact source and condition used to settle the market."
              rows={4}
              data-testid="input-rules"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Be specific about the source of truth and the settlement condition.</p>
            {errors.rules && <p className="mt-1 text-xs text-destructive">{errors.rules}</p>}
          </div>

          <div className="mt-4">
            <Label htmlFor="close-date">Close date</Label>
            <Input id="close-date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} data-testid="input-close-date" />
            <p className="mt-1.5 text-xs text-muted-foreground">Trading closes at the end of this day. Must be in the future.</p>
            {errors.closesAt && <p className="mt-1 text-xs text-destructive">{errors.closesAt}</p>}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Initial YES probability</Label>
              <span className="num text-sm text-foreground">{probability}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={99}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full accent-[hsl(var(--gold))]"
              data-testid="input-probability"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-yes/30 bg-yes/10 px-3 py-2 text-xs text-yes-fg">
                YES <span className="num float-right">{probability}¢</span>
              </div>
              <div className="rounded-md border border-no/30 bg-no/10 px-3 py-2 text-xs text-no-fg">
                NO <span className="num float-right">{100 - probability}¢</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label>Seed liquidity</Label>
            <div className="grid grid-cols-4 gap-2">
              {SEED_AMOUNTS.map((seed) => (
                <button
                  type="button"
                  key={seed}
                  onClick={() => setSeedLiquidity(seed)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm transition-colors",
                    seedLiquidity === seed ? "border-gold/40 bg-gold/10 text-gold" : "border-border text-muted-foreground hover-elevate",
                  )}
                >
                  £{seed}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Initial market depth. Seeds starting volume and liquidity.</p>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-md border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">Community</span>
            Your market carries a Community badge and appears under its category filter.
          </div>

          <Button type="submit" className="mt-5 w-full gap-2 glow-gold" disabled={createMarket.isPending} data-testid="button-launch-market">
            <Rocket className="h-4 w-4" />
            {createMarket.isPending ? "Launching…" : "Launch market"}
          </Button>
        </form>
      </Card>

      <div className="mt-6 flex justify-center">
        <PoweredByBadge />
      </div>
    </div>
  );
}
