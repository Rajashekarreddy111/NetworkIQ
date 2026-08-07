import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { HistoryTimeline } from "@/components/warehouse/HistoryTimeline";
import { useWarehouseStore } from "@/store/app-store";

export const Route = createFileRoute("/warehouse/history")({
  head: () => ({ meta: [{ title: "Warehouse History - NetworkIQ" }] }),
  component: History,
});

function History() {
  const history = useWarehouseStore((s) => s.history);
  return (
    <div className="space-y-5">
      <PageHeader title="History" description="Inventory added, Excel imports, stock updates, and transfer requests." />
      <HistoryTimeline entries={history} />
    </div>
  );
}
