import { create } from "zustand";
import { toast } from "sonner";

import { inventory as baseInventory, warehouses } from "@/lib/mock-data";
import type { InventoryRow, TransferStatus, Warehouse } from "@/lib/mock-data";

export interface PlannerDecision {
  status: TransferStatus;
  note?: string;
  quantity?: number;
  decidedAt: string;
}

interface PlannerState {
  decisions: Record<string, PlannerDecision>;
  decide: (id: string, decision: Omit<PlannerDecision, "decidedAt">) => void;
  reset: () => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  decisions: {},
  decide: (id, decision) =>
    set((s) => ({
      decisions: { ...s.decisions, [id]: { ...decision, decidedAt: new Date().toISOString() } },
    })),
  reset: () => set({ decisions: {} }),
}));

interface InventoryFilterState {
  region: string;
  warehouse: string;
  category: string;
  velocity: string;
  risk: string;
  search: string;
  set: (patch: Partial<Omit<InventoryFilterState, "set" | "clear">>) => void;
  clear: () => void;
}

const emptyFilters = {
  region: "all",
  warehouse: "all",
  category: "all",
  velocity: "all",
  risk: "all",
  search: "",
};

export const useInventoryFilters = create<InventoryFilterState>((set) => ({
  ...emptyFilters,
  set: (patch) => set(patch),
  clear: () => set(emptyFilters),
}));

export type UserRole = "admin" | "warehouse";

export interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  location: string;
  initials: string;
  warehouseId?: string;
}

export interface WarehouseInventoryItem extends InventoryRow {
  minimumThreshold: number;
  maximumCapacity: number;
  supplier: string;
  lastUpdated: string;
  remarks: string;
  expiryDate?: string;
}

export type UploadRowStatus = "valid" | "invalid";

export interface UploadPreviewRow {
  id: string;
  sku: string;
  product: string;
  stock: number;
  warehouse: string;
  category: string;
  status: UploadRowStatus;
  errors: string[];
}

export interface TransferRequest {
  id: string;
  sku: string;
  product: string;
  warehouseId: string;
  requestedQty: number;
  reason: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Approved" | "Rejected";
  approvedBy: string;
  createdDate: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  action: "Inventory Added" | "Excel Imported" | "Stock Updated" | "Transfer Requested";
  user: string;
  detail: string;
}

const suppliers = [
  "Reliance Retail Supply",
  "Flipkart Wholesale",
  "Tata Consumer Logistics",
  "DHL Integrated Fulfilment",
  "Blue Dart Distribution",
  "Mahindra Logistics",
];

const adminUser: CurrentUser = {
  name: "Ananya Kulkarni",
  email: "admin@networkiq.com",
  role: "admin",
  title: "Principal Supply Planner",
  department: "Network Planning & Optimization",
  location: "Bengaluru, IN",
  initials: "AK",
};

const warehouseUser: CurrentUser = {
  name: "Rohan Mehta",
  email: "warehouse@networkiq.com",
  role: "warehouse",
  title: "Warehouse Manager",
  department: "Warehouse Operations",
  location: "Mumbai, IN",
  initials: "RM",
  warehouseId: "WH-MUM",
};

const warehouseInventorySeed: WarehouseInventoryItem[] = baseInventory.map((item, index) => {
  const maximumCapacity = Math.max(item.currentStock + 850, Math.round(item.predictedDemand * 2.4));
  return {
    ...item,
    minimumThreshold: Math.max(40, Math.round(item.predictedDemand * 0.35)),
    maximumCapacity,
    supplier: suppliers[index % suppliers.length]!,
    lastUpdated: `2026-08-${String(1 + (index % 7)).padStart(2, "0")} ${String(9 + (index % 8)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    remarks: item.status === "Healthy" ? "Cycle count matched" : "Needs operations review",
    expiryDate: item.category.includes("Grocery") ? `2026-${String(10 + (index % 2)).padStart(2, "0")}-${String(12 + (index % 14)).padStart(2, "0")}` : undefined,
  };
});

const sampleUploadRows: UploadPreviewRow[] = [
  { id: "UP-1", sku: "SKU-CE9021", product: "Bluetooth Speaker Max", stock: 420, warehouse: "Mumbai", category: "Consumer Electronics", status: "valid", errors: [] },
  { id: "UP-2", sku: "SKU-GR6712", product: "Organic Atta 10kg", stock: 980, warehouse: "Mumbai", category: "Grocery & Staples", status: "valid", errors: [] },
  { id: "UP-3", sku: "", product: "Sports Duffel Bag", stock: 240, warehouse: "Mumbai", category: "Apparel", status: "invalid", errors: ["Empty SKU"] },
  { id: "UP-4", sku: "SKU-CE9021", product: "Bluetooth Speaker Max", stock: 125, warehouse: "Mumbai", category: "Consumer Electronics", status: "invalid", errors: ["Duplicate SKU"] },
  { id: "UP-5", sku: "SKU-KT4490", product: "", stock: 88, warehouse: "Mumbai", category: "Kitchenware", status: "invalid", errors: ["Missing Product Name"] },
  { id: "UP-6", sku: "SKU-HN7722", product: "Multivitamin Pack", stock: -16, warehouse: "Mumbai", category: "Health & Nutrition", status: "invalid", errors: ["Negative Quantity"] },
  { id: "UP-7", sku: "SKU-FT3201", product: "Walking Shoes Flex", stock: 560, warehouse: "Pune", category: "Footwear", status: "invalid", errors: ["Invalid Warehouse"] },
  { id: "UP-8", sku: "SKU-XX7788", product: "Travel Mug Steel", stock: 340, warehouse: "Mumbai", category: "Outdoor", status: "invalid", errors: ["Invalid Category"] },
];

const initialRequests: TransferRequest[] = [
  { id: "WTR-4108", sku: "SKU-CO1007", product: "LED Smart TV 43\" 4K", warehouseId: "WH-MUM", requestedQty: 340, reason: "Weekend store replenishment", priority: "High", status: "Pending", approvedBy: "-", createdDate: "2026-08-07" },
  { id: "WTR-4102", sku: "SKU-GR1035", product: "Basmati Rice Premium 10kg", warehouseId: "WH-MUM", requestedQty: 620, reason: "Festival demand uplift", priority: "Critical", status: "Approved", approvedBy: "A. Kulkarni", createdDate: "2026-08-05" },
  { id: "WTR-4097", sku: "SKU-LA1014", product: "Front Load Washing Machine 7kg", warehouseId: "WH-MUM", requestedQty: 75, reason: "Regional appliance campaign", priority: "Medium", status: "Rejected", approvedBy: "R. Iyer", createdDate: "2026-08-03" },
];

const initialHistory: HistoryEntry[] = [
  { id: "H-1", date: "2026-08-07 18:20", action: "Excel Imported", user: "Rohan Mehta", detail: "48 valid rows imported into Bhiwandi Mega Distribution Center" },
  { id: "H-2", date: "2026-08-07 15:42", action: "Transfer Requested", user: "Rohan Mehta", detail: "Requested 340 units for SKU-CO1007" },
  { id: "H-3", date: "2026-08-06 11:08", action: "Stock Updated", user: "Priya Shah", detail: "Cycle count corrected 12 consumer electronics SKUs" },
  { id: "H-4", date: "2026-08-05 09:31", action: "Inventory Added", user: "Rohan Mehta", detail: "Added 980 units of grocery inventory" },
];

interface AuthState {
  user: CurrentUser | null;
  authenticated: boolean;
  loginError: string | null;
  logout: () => void;
  login: (email: string, password: string) => CurrentUser | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: adminUser,
  authenticated: true,
  loginError: null,
  logout: () => set({ authenticated: false, user: null }),
  login: (email, password) => {
    const normalized = email.trim().toLowerCase();
    const match =
      normalized === "admin@networkiq.com" && password === "admin123"
        ? adminUser
        : normalized === "warehouse@networkiq.com" && password === "warehouse123"
          ? warehouseUser
          : null;

    if (!match) {
      set({ authenticated: false, user: null, loginError: "Invalid NetworkIQ credentials" });
      return null;
    }

    set({ authenticated: true, user: match, loginError: null });
    return match;
  },
}));

interface WarehouseState {
  warehouse: Warehouse;
  inventory: WarehouseInventoryItem[];
  uploadRows: UploadPreviewRow[];
  uploadStatus: "Idle" | "Ready" | "Validated" | "Imported" | "Failed";
  transferRequests: TransferRequest[];
  history: HistoryEntry[];
  addInventory: (item: Omit<WarehouseInventoryItem, "id" | "history" | "risk" | "status" | "daysCover" | "capacityUsed" | "predictedDemand">) => void;
  selectUploadFile: (fileName: string) => void;
  validateUpload: () => void;
  deleteUploadRow: (id: string) => void;
  importUpload: (userName: string) => void;
  createTransferRequest: (request: Omit<TransferRequest, "id" | "status" | "approvedBy" | "createdDate">) => void;
  approveTransfer: (id: string) => void;
  rejectTransfer: (id: string) => void;
}

function warehouseStatus(stock: number, min: number, max: number): WarehouseInventoryItem["status"] {
  if (stock <= Math.round(min * 0.45)) return "Stockout Risk";
  if (stock < min) return "Understock";
  if (stock > max * 0.9) return "Overstock";
  return "Healthy";
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  warehouse: warehouses.find((w) => w.id === "WH-MUM") ?? warehouses[0]!,
  inventory: warehouseInventorySeed,
  uploadRows: sampleUploadRows,
  uploadStatus: "Ready",
  transferRequests: initialRequests,
  history: initialHistory,
  addInventory: (item) =>
    set((s) => {
      const status = warehouseStatus(item.currentStock, item.minimumThreshold, item.maximumCapacity);
      const next: WarehouseInventoryItem = {
        ...item,
        id: `INV-${String(s.inventory.length + 1001).padStart(4, "0")}`,
        risk: status === "Stockout Risk" ? "critical" : status === "Understock" ? "high" : status === "Overstock" ? "medium" : "low",
        status,
        daysCover: Math.round((item.currentStock / Math.max(item.minimumThreshold, 1)) * 10),
        capacityUsed: Math.round((item.currentStock / Math.max(item.maximumCapacity, 1)) * 100),
        predictedDemand: Math.round(item.minimumThreshold * 2.3),
        history: [],
      };
      toast.success("Inventory Successfully Updated");
      return {
        inventory: [next, ...s.inventory],
        history: [
          {
            id: `H-${s.history.length + 1}`,
            date: new Date().toLocaleString(),
            action: "Inventory Added",
            user: "Warehouse Manager",
            detail: `${item.product} added to ${item.warehouse}`,
          },
          ...s.history,
        ],
      };
    }),
  selectUploadFile: (fileName) =>
    set((s) => ({
      uploadStatus: "Ready",
      history: [
        {
          id: `H-${s.history.length + 1}`,
          date: new Date().toLocaleString(),
          action: "Excel Imported",
          user: "Warehouse Manager",
          detail: `${fileName} selected for validation`,
        },
        ...s.history,
      ],
    })),
  validateUpload: () => set({ uploadStatus: get().uploadRows.some((r) => r.status === "invalid") ? "Failed" : "Validated" }),
  deleteUploadRow: (id) => set((s) => ({ uploadRows: s.uploadRows.filter((r) => r.id !== id) })),
  importUpload: (userName) =>
    set((s) => {
      const validRows = s.uploadRows.filter((r) => r.status === "valid");
      toast.success("Inventory Successfully Updated", {
        description: `${validRows.length} rows imported and planner notified`,
      });
      return {
        uploadStatus: "Imported",
        history: [
          {
            id: `H-${s.history.length + 1}`,
            date: new Date().toLocaleString(),
            action: "Excel Imported",
            user: userName,
            detail: `${validRows.length} valid rows imported into ${s.warehouse.name}`,
          },
          ...s.history,
        ],
      };
    }),
  createTransferRequest: (request) =>
    set((s) => {
      const next: TransferRequest = {
        ...request,
        id: `WTR-${4100 + s.transferRequests.length + 1}`,
        status: "Pending",
        approvedBy: "-",
        createdDate: new Date().toISOString().slice(0, 10),
      };
      toast.success("Transfer request submitted", {
        description: "Admin has been notified for approval",
      });
      return {
        transferRequests: [next, ...s.transferRequests],
        history: [
          {
            id: `H-${s.history.length + 1}`,
            date: new Date().toLocaleString(),
            action: "Transfer Requested",
            user: "Warehouse Manager",
            detail: `${request.requestedQty} units requested for ${request.sku}`,
          },
          ...s.history,
        ],
      };
    }),
  approveTransfer: (id) =>
    set((s) => ({
      transferRequests: s.transferRequests.map((r) =>
        r.id === id ? { ...r, status: "Approved", approvedBy: "A. Kulkarni" } : r,
      ),
    })),
  rejectTransfer: (id) =>
    set((s) => ({
      transferRequests: s.transferRequests.map((r) =>
        r.id === id ? { ...r, status: "Rejected", approvedBy: "A. Kulkarni" } : r,
      ),
    })),
}));
