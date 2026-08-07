import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWarehouseStore } from "@/store/app-store";

const schema = z.object({
  sku: z.string().min(3, "SKU is required"),
  requestedQty: z.coerce.number().min(1, "Quantity is required"),
  reason: z.string().min(5, "Reason is required"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
});

type FormValues = z.infer<typeof schema>;

export function TransferForm() {
  const createTransferRequest = useWarehouseStore((s) => s.createTransferRequest);
  const inventory = useWarehouseStore((s) => s.inventory);
  const warehouse = useWarehouseStore((s) => s.warehouse);
  const warehouseRows = inventory.filter((row) => row.warehouseId === warehouse.id);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sku: "", requestedQty: 1, reason: "", priority: "Medium" },
  });

  const onSubmit = (values: FormValues) => {
    const item = warehouseRows.find((row) => row.sku === values.sku);
    createTransferRequest({
      sku: values.sku,
      product: item?.product ?? "Unknown SKU",
      warehouseId: warehouse.id,
      requestedQty: values.requestedQty,
      reason: values.reason,
      priority: values.priority,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl glass-panel p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select SKU" /></SelectTrigger></FormControl>
                  <SelectContent>{warehouseRows.slice(0, 40).map((row) => <SelectItem key={row.id} value={row.sku}>{row.sku}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requestedQty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Quantity</FormLabel>
                <FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{["Low", "Medium", "High", "Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-end">
            <Button className="w-full rounded-xl bg-gradient-primary"><Send className="mr-2 size-4" /> Submit Request</Button>
          </div>
        </div>
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Reason</FormLabel>
              <FormControl><Textarea className="min-h-24 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
