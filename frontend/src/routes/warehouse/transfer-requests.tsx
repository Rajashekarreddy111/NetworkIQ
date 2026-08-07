import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { TransferForm } from "@/components/warehouse/TransferForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { num } from "@/lib/format";
import { useWarehouseStore } from "@/store/app-store";

export const Route = createFileRoute("/warehouse/transfer-requests")({
  head: () => ({ meta: [{ title: "Transfer Requests - NetworkIQ" }] }),
  component: TransferRequests,
});

function TransferRequests() {
  const requests = useWarehouseStore((s) => s.transferRequests);
  const warehouse = useWarehouseStore((s) => s.warehouse);
  const rows = requests.filter((request) => request.warehouseId === warehouse.id);

  return (
    <div className="space-y-5">
      <PageHeader title="Transfer Requests" description="Warehouse users can request inventory but cannot approve transfers." />
      <TransferForm />
      <div className="overflow-hidden rounded-2xl glass-panel">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Requested Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="numeric font-semibold">{request.id}</TableCell>
                  <TableCell>{request.sku}</TableCell>
                  <TableCell className="numeric">{num(request.requestedQty)}</TableCell>
                  <TableCell><StatusBadge status={request.status} /></TableCell>
                  <TableCell>{request.approvedBy}</TableCell>
                  <TableCell>{request.createdDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
