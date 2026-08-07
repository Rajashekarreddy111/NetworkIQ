import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { ProfileCard } from "@/components/warehouse/ProfileCard";

export const Route = createFileRoute("/warehouse/profile")({
  head: () => ({ meta: [{ title: "Warehouse Profile - NetworkIQ" }] }),
  component: WarehouseProfile,
});

function WarehouseProfile() {
  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description="Warehouse identity, manager contact details, and fulfillment address." />
      <ProfileCard />
    </div>
  );
}
