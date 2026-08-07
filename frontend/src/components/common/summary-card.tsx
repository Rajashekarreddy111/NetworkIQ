import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  invertDelta?: boolean;
  progress?: number;
  index?: number;
}

const toneMap = {
  primary: { icon: "bg-primary/15 text-primary-glow", bar: "bg-gradient-primary" },
  success: { icon: "bg-success/15 text-success", bar: "bg-success" },
  warning: { icon: "bg-warning/15 text-warning", bar: "bg-warning" },
  danger: { icon: "bg-danger/15 text-danger", bar: "bg-danger" },
  neutral: { icon: "bg-muted text-muted-foreground", bar: "bg-muted-foreground" },
};

export function SummaryCard({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  icon: Icon,
  tone = "primary",
  invertDelta,
  progress,
  index = 0,
}: SummaryCardProps) {
  const good = delta === undefined ? null : invertDelta ? delta < 0 : delta > 0;
  const t = toneMap[tone];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl glass-panel p-4 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", t.icon)}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>

      <p className="mt-3 numeric text-2xl font-semibold leading-none sm:text-[26px]">{value}</p>

      <div className="mt-2 flex items-center gap-2 text-xs">
        {good !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              good ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
            )}
          >
            {(delta ?? 0) > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta ?? 0)}%
          </span>
        )}
        <span className="truncate text-muted-foreground">{deltaLabel ?? hint}</span>
      </div>

      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={cn("h-full rounded-full", t.bar)}
          />
        </div>
      )}
    </motion.article>
  );
}
