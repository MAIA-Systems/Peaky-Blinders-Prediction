import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", {
  variants: {
    variant: {
      default: "border-primary-border bg-primary text-primary-foreground",
      secondary: "border-secondary-border bg-secondary text-secondary-foreground",
      outline: "border-gold/30 bg-transparent text-gold",
      yes: "border-yes/30 bg-yes/10 text-yes-fg",
      no: "border-no/30 bg-no/10 text-no-fg",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
