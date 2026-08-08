import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { RotateCcw, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/types";
import { useWarehouseStore } from "@/store/app-store";

const warehouses = [
  { id: "WH-NORTH", city: "North Regional Hub" },
  { id: "WH-SOUTH", city: "South Regional Hub" },
  { id: "WH-EAST", city: "East Regional Hub" },
  { id: "WH-WEST", city: "West Regional Hub" },
];

const schema = z.object({
  sku: z.string().min(3, "SKU is required"),
  product: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Select a category"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  minimumThreshold: z.coerce.number().min(1, "Minimum threshold is required"),
  maximumCapacity: z.coerce.number().min(1, "Maximum capacity is required"),
  unitCost: z.coerce.number().min(1, "Unit price is required"),
  expiryDate: z.string().optional(),
  supplier: z.string().min(2, "Supplier is required"),
  remarks: z.string().min(2, "Remarks are required"),
}).refine((value) => value.maximumCapacity >= value.currentStock, {
  path: ["maximumCapacity"],
  message: "Maximum capacity must be above current stock",
});

type FormValues = z.infer<typeof schema>;

const fields = [
  ["sku", "SKU"],
  ["product", "Product Name"],
  ["currentStock", "Current Stock"],
  ["minimumThreshold", "Minimum Threshold"],
  ["maximumCapacity", "Maximum Capacity"],
  ["unitCost", "Unit Price"],
  ["expiryDate", "Expiry Date"],
  ["supplier", "Supplier"],
] as const;

export function InventoryForm() {
  const addInventory = useWarehouseStore((s) => s.addInventory);
  const activeWarehouse = useWarehouseStore((s) => s.warehouse);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      product: "",
      category: "",
      warehouseId: activeWarehouse.id,
      currentStock: 0,
      minimumThreshold: 0,
      maximumCapacity: 0,
      unitCost: 0,
      expiryDate: "",
      supplier: "",
      remarks: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const warehouse = warehouses.find((w) => w.id === values.warehouseId) ?? activeWarehouse;
    addInventory({
      ...values,
      warehouse: warehouse.city,
      velocity: "medium",
      lastUpdated: new Date().toLocaleString(),
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl glass-panel p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type={["currentStock", "minimumThreshold", "maximumCapacity", "unitCost"].includes(name) ? "number" : name === "expiryDate" ? "date" : "text"}
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Remarks</FormLabel>
              <FormControl><Textarea className="min-h-24 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="submit" className="rounded-xl bg-gradient-primary"><Save className="mr-2 size-4" /> Save</Button>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => form.reset()}><RotateCcw className="mr-2 size-4" /> Reset</Button>
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => void navigate({ to: "/warehouse/inventory" })}><X className="mr-2 size-4" /> Cancel</Button>
        </div>
      </form>
    </Form>
  );
}
