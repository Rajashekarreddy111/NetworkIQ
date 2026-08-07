import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, useWarehouseStore } from "@/store/app-store";

export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const warehouse = useWarehouseStore((s) => s.warehouse);
  const fields = [
    ["Warehouse Name", warehouse.name],
    ["Manager Name", user?.name ?? "Rohan Mehta"],
    ["Email", user?.email ?? "warehouse@networkiq.com"],
    ["Phone", "+91 98765 43210"],
  ];

  return (
    <section className="rounded-2xl glass-panel p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="space-y-2">
            <Label>{label}</Label>
            <Input defaultValue={value} className="rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Label>Address</Label>
        <Textarea
          defaultValue="Bhiwandi Mega Distribution Center, Mumbai-Nashik Highway, Thane District, Maharashtra 421302"
          className="min-h-28 rounded-xl"
        />
      </div>
      <div className="mt-6 flex justify-end">
        <Button className="rounded-xl bg-gradient-primary"><Save className="mr-2 size-4" /> Update Profile</Button>
      </div>
    </section>
  );
}
