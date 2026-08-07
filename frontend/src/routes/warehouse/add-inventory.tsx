import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { InventoryForm } from "@/components/warehouse/InventoryForm";

export const Route = createFileRoute("/warehouse/add-inventory")({
  head: () => ({ meta: [{ title: "Add Inventory - NetworkIQ" }] }),
  component: AddInventory,
});

function AddInventory() {
  return (
    <div className="space-y-5">
      <PageHeader title="Add Inventory" description="Manually enter new warehouse stock with validation." />
      <InventoryForm />
    </div>
  );
}
