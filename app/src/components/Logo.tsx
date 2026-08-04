import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Exact diamond mark + wordmark from the original build's logo component.
export function Logo({ className, linkTo = "/" }: { className?: string; linkTo?: string | null }) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)} aria-label="Peaky Blinders × FanEngine">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" className="shrink-0" role="img" aria-hidden="true">
        <path d="M20 2 L38 20 L20 38 L2 20 Z" stroke="hsl(var(--gold))" strokeWidth="1.5" fill="hsl(var(--gold) / 0.06)" />
        <path d="M20 8 L32 20 L20 32 L8 20 Z" stroke="hsl(var(--gold) / 0.5)" strokeWidth="0.75" fill="none" />
        <path
          d="M11 22 C11 18 14 16 20 16 C25 16 28 18 29 21 L30.5 21.5 C31 21.7 31 22.4 30.4 22.6 L10.5 23.2 C10 23.3 10 22.2 11 22 Z"
          fill="hsl(var(--gold))"
        />
        <rect x="10.4" y="23.2" width="20" height="1.6" rx="0.8" fill="hsl(var(--gold) / 0.7)" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">Peaky Blinders</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-gold">Prediction Market</span>
      </div>
    </div>
  );

  if (!linkTo) return content;
  return <Link to={linkTo}>{content}</Link>;
}
