import { create } from "zustand";

import type { TransferStatus } from "@/lib/mock-data";

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

interface AuthState {
  user: {
    name: string;
    email: string;
    role: string;
    department: string;
    location: string;
    initials: string;
  };
  authenticated: boolean;
  logout: () => void;
  login: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: "Ananya Kulkarni",
    email: "ananya.kulkarni@networkiq.ai",
    role: "Principal Supply Planner",
    department: "Network Planning & Optimization",
    location: "Bengaluru, IN",
    initials: "AK",
  },
  authenticated: true,
  logout: () => set({ authenticated: false }),
  login: () => set({ authenticated: true }),
}));
