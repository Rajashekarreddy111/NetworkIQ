import { create } from "zustand";
import { toast } from "sonner";

import type { InventoryRow, TransferStatus, Warehouse } from "@/lib/types";

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

const defaultWarehouse: Warehouse = {
  id: "WH-MUM",
  name: "Bhiwandi Mega Distribution Center",
  code: "MUM-02",
  city: "Mumbai",
  region: "West",
  lat: 19.29,
  lng: 73.06,
  capacity: 620000,
  utilization: 84,
  skus: 15320,
  inventoryValue: 241800000,
  stores: 268,
  onTime: 94.1,
};

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

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  warehouse: defaultWarehouse,
  inventory: [],
  uploadRows: [],
  uploadStatus: "Ready",
  transferRequests: [],
  history: [],
  addInventory: (item) =>
    set((s) => {
      const next: WarehouseInventoryItem = {
        ...item,
        id: `INV-${String(s.inventory.length + 1001).padStart(4, "0")}`,
        risk: "low",
        status: "Healthy",
        daysCover: 30,
        capacityUsed: 50,
        predictedDemand: 100,
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
