import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Wallet as WalletIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import { useCreateDepositCheckout, useTransactions, useWallet } from "@/hooks/useWallet";
import { cn, formatGbp, formatRelativeTime } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 250, 500];

export function Wallet() {
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions();
  const createCheckout = useCreateDepositCheckout();
  const [searchParams] = useSearchParams();
  const depositStatus = searchParams.get("deposit"); // "success" | "cancelled", set by Stripe's redirect

  const [tab, setTab] = useState<"fiat" | "crypto">("fiat");
  const [amount, setAmount] = useState(100);
  const [error, setError] = useState<string | null>(null);

  async function handleDeposit() {
    setError(null);
    try {
      const { checkoutUrl } = await createCheckout.mutateAsync(amount);
      window.location.href = checkoutUrl; // full-page redirect — Stripe hosts the actual card form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fund your account in seconds — fiat or crypto.</p>
        </div>
        <PoweredByBadge className="hidden sm:inline-flex" />
      </div>

      {depositStatus === "success" && (
        <p className="mt-4 rounded-md border border-yes/30 bg-yes/10 p-3 text-sm text-yes-fg" data-testid="text-deposit-success">
          Payment received — your balance updates as soon as Stripe confirms it (usually a few seconds).
        </p>
      )}
      {depositStatus === "cancelled" && (
        <p className="mt-4 rounded-md border border-border bg-card/60 p-3 text-sm text-muted-foreground">Deposit cancelled — no charge was made.</p>
      )}

      <Card className="mt-6 flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
          <WalletIcon className="h-5 w-5 text-gold" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Available balance</div>
          <div className="num text-3xl font-semibold text-gold-bright">{wallet ? formatGbp(wallet.balance) : "…"}</div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("fiat")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors",
                tab === "fiat" ? "border-gold/40 bg-gold/10 text-gold" : "border-border text-muted-foreground hover-elevate",
              )}
            >
              <CreditCard className="h-4 w-4" /> Fiat
            </button>
            <button
              onClick={() => setTab("crypto")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors",
                tab === "crypto" ? "border-gold/40 bg-gold/10 text-gold" : "border-border text-muted-foreground hover-elevate",
              )}
            >
              Crypto
            </button>
          </div>

          {tab === "fiat" ? (
            <Card className="mt-4 p-5">
              <Label>Amount (GBP)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="num pl-7"
                  data-testid="input-deposit-amount"
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

              {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

              <Button className="mt-5 w-full glow-gold" disabled={createCheckout.isPending || amount <= 0} onClick={handleDeposit} data-testid="button-deposit-card">
                {createCheckout.isPending ? "Redirecting…" : `Continue to payment — ${formatGbp(amount)}`}
              </Button>
              <p className="mt-3 text-[11px] text-muted-foreground">
                You'll finish this on Stripe's secure checkout page — card, Apple Pay or Google Pay, whatever your device offers. We
                never see or store your card details.
              </p>
            </Card>
          ) : (
            <Card className="mt-4 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="outline">Demo</Badge>
                <span className="text-xs text-muted-foreground">Not a real network — no funds move.</span>
              </div>
              <Label>Network</Label>
              <div className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">Ethereum (USDC)</div>
              <Label className="mt-4">Amount (USDC)</Label>
              <Input type="number" min={1} defaultValue={150} className="num" data-testid="input-usdc" />
              <Button className="mt-5 w-full glow-gold" disabled data-testid="button-deposit-crypto">
                Coming soon
              </Button>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Transactions</h2>
          {!transactions || transactions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="thin-scroll max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-md border border-card-border bg-card px-3 py-2.5" data-testid={`wallet-tx-${tx.id}`}>
                  <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", tx.amount >= 0 ? "bg-yes/15" : "bg-secondary")}>
                    <span className={cn("num text-[10px]", tx.amount >= 0 ? "text-yes-fg" : "text-muted-foreground")}>{tx.amount >= 0 ? "+" : "-"}</span>
                  </div>
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
      </div>
    </div>
  );
}
