import type { PricePoint } from "@/types";

export function Sparkline({ data, width = 120, height = 36 }: { data: PricePoint[]; width?: number; height?: number }) {
  if (!data.length) return null;

  const prices = data.map((point) => point.price);
  const min = Math.min(...prices);
  const range = Math.max(...prices) - min || 1;

  const coords = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.price - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const up = prices[prices.length - 1] >= prices[0];
  const color = up ? "hsl(var(--yes-fg))" : "hsl(var(--no-fg))";
  const gradientId = `spark-gradient-${up ? "up" : "down"}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
