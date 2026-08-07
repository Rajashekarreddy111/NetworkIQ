import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  height = 280,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-2xl glass-panel p-4 sm:p-5", className)}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </motion.section>
  );
}

export const chartColors = {
  primary: "var(--chart-1)",
  cyan: "var(--chart-2)",
  green: "var(--chart-3)",
  amber: "var(--chart-4)",
  rose: "var(--chart-5)",
  violet: "var(--chart-6)",
};

export const axisProps = {
  stroke: "var(--muted-foreground)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border-strong)",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "var(--shadow-soft)",
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11, marginBottom: 4 },
  itemStyle: { color: "var(--popover-foreground)" },
} as const;
