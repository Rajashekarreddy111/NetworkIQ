import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchResource, postResource } from "@/lib/api";
import type {
  AgentState,
  AuditEntry,
  InventoryRow,
  Recommendation,
  Warehouse,
} from "@/lib/mock-data";
import type {
  agentFeed,
  benchmark,
  dashboardMetrics,
  demandForecast,
  heatmap,
  inventoryDistribution,
  moverSplit,
  topSkus,
  transferRoutes,
  transferTrend,
} from "@/lib/mock-data";

type Feed = typeof agentFeed;

export interface DashboardPayload {
  metrics: typeof dashboardMetrics;
  demandForecast: typeof demandForecast;
  transferTrend: typeof transferTrend;
  inventoryDistribution: typeof inventoryDistribution;
  moverSplit: typeof moverSplit;
  warehouses: Warehouse[];
  activities: Feed;
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
        routes: typeof transferRoutes;
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
    queryFn: () => fetchResource<{ agents: AgentState[]; feed: Feed }>("/self-check"),
    refetchInterval: 15_000,
  });

export const benchmarkQuery = () =>
  queryOptions({
    queryKey: ["benchmark"],
    queryFn: () => fetchResource<typeof benchmark>("/benchmark"),
    staleTime: 300_000,
  });

export const analyticsQuery = () =>
  queryOptions({
    queryKey: ["analytics"],
    queryFn: () =>
      fetchResource<{
        demandForecast: typeof demandForecast;
        transferTrend: typeof transferTrend;
        warehouses: Warehouse[];
        topSkus: typeof topSkus;
        heatmap: typeof heatmap;
        inventoryDistribution: typeof inventoryDistribution;
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
