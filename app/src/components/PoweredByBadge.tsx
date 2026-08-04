import { cn } from "@/lib/utils";

export function PoweredByBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-background/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
      data-testid="badge-powered-by-ipx"
    >
      <span className="text-muted-foreground/70">Powered by</span>
      <span className="flex items-center gap-1 font-semibold text-gold">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4 L12 12 L4 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M13 4 L21 12 L13 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
        </svg>
        FanEngine
      </span>
    </div>
  );
}
