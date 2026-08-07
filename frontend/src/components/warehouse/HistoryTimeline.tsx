import { FileClock } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import type { HistoryEntry } from "@/store/app-store";

export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {entries.map((entry) => (
        <li key={entry.id} className="relative rounded-2xl glass-panel p-4">
          <span className="absolute -left-[33px] top-5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
            <FileClock className="size-3" />
          </span>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{entry.action}</p>
              <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p>
            </div>
            <StatusBadge status={entry.action} variant="primary" dot={false} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Date: {entry.date}</span>
            <span>User: {entry.user}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
