import { Logo } from "@/components/Logo";
import { PoweredByBadge } from "@/components/PoweredByBadge";

export function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-md">
            <Logo linkTo={null} />
            <p className="mt-3 text-sm text-muted-foreground">
              Where culture becomes a market. A white-label prediction market experience built on FanEngine infrastructure. Demo
              environment — no real funds.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <PoweredByBadge />
            <p className="num text-[11px] text-muted-foreground/60">From zero to first trade in under 60 seconds.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
