import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchResource, postResource } from "@/lib/api";
import type {
  AgentState,
  AuditEntry,
  InventoryRow,
  Recommendation,
  Warehouse,
} from "@/lib/types";

export interface DashboardPayload {
  metrics: {
    totalWarehouses: number;
    totalStores: number;
    activeSkus: number;
    inventoryValue: number;
    holdingCost: number;
    transferCost: number;
    estimatedSavings: number;
    aiConfidence: number;
    pendingTransfers: number;
    rejectedTransfers: number;
    warehouseUtilization: number;
    stockoutRisk: number;
  };
  demandForecast: any[];
  transferTrend: any[];
  inventoryDistribution: any[];
  moverSplit: any[];
  warehouses: Warehouse[];
  activities: any[];
  recentTransfers: Recommendation[];
}

export const dashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: () => fetchResource<DashboardPayload>("/dashboard"),
    staleTime: 60_000,
  });

export const inventoryQuery = () =>
  queryOptions({
    queryKey: ["inventory"],
    queryFn: () =>
      fetchResource<{
        rows: InventoryRow[];
        warehouses: Warehouse[];
        routes: any[];
      }>("/inventory"),
    staleTime: 60_000,
  });

export const planQuery = () =>
  queryOptions({
    queryKey: ["plan"],
    queryFn: () => fetchResource<{ recommendations: Recommendation[] }>("/plan"),
    staleTime: 60_000,
  });

export const selfCheckQuery = () =>
  queryOptions({
    queryKey: ["self-check"],
    queryFn: () => fetchResource<{ agents: AgentState[]; feed: any[]; result?: any }>("/self-check"),
    refetchInterval: 15_000,
  });

export const benchmarkQuery = () =>
  queryOptions({
    queryKey: ["benchmark"],
    queryFn: () => fetchResource<any>("/benchmark"),
    staleTime: 300_000,
  });

export const analyticsQuery = () =>
  queryOptions({
    queryKey: ["analytics"],
    queryFn: () =>
      fetchResource<{
        demandForecast: any[];
        transferTrend: any[];
        warehouses: Warehouse[];
        topSkus: any[];
        heatmap: any[];
        inventoryDistribution: any[];
        velocityDistribution: any;
      }>("/analytics"),
    staleTime: 120_000,
  });

export const auditQuery = () =>
  queryOptions({
    queryKey: ["audit"],
    queryFn: () => fetchResource<{ entries: AuditEntry[] }>("/audit"),
    staleTime: 120_000,
  });

export interface ConfigPayload {
  apiUrl: string;
  apiKey: string;
  plannerThreshold: number;
  autoApprove: boolean;
  budgetEnvelope: number;
  notifications: { email: boolean; slack: boolean; digest: boolean; criticalOnly: boolean };
  supportedRegions?: string[];
}

export const configQuery = () =>
  queryOptions({
    queryKey: ["config"],
    queryFn: () => fetchResource<ConfigPayload>("/config"),
    staleTime: Infinity,
  });

export const useDashboard = () => useQuery(dashboardQuery());
export const useInventory = () => useQuery(inventoryQuery());
export const usePlan = () => useQuery(planQuery());
export const useSelfCheck = () => useQuery(selfCheckQuery());
export const useBenchmark = () => useQuery(benchmarkQuery());
export const useAnalytics = () => useQuery(analyticsQuery());
export const useAudit = () => useQuery(auditQuery());
export const useConfig = () => useQuery(configQuery());

export const useDecideTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; decision: string; note?: string; quantity?: number }) =>
      postResource<typeof payload>("/plan/decision", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
};
