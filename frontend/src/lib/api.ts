import axios from "axios";

import {
  agentFeed,
  agents,
  auditTrail,
  benchmark,
  dashboardMetrics,
  demandForecast,
  heatmap,
  inventory,
  inventoryDistribution,
  moverSplit,
  recommendations,
  topSkus,
  transferRoutes,
  transferTrend,
  warehouses,
} from "./mock-data";

/**
 * Axios client for the NetworkIQ optimization API.
 * Swap MOCK_MODE off (VITE_NETWORKIQ_API_URL set) to hit a live backend.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env["VITE_NETWORKIQ_API_URL"] ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const MOCK_MODE = !import.meta.env["VITE_NETWORKIQ_API_URL"];

const latency = (ms = 320) => new Promise((res) => setTimeout(res, ms));

const mocks: Record<string, () => unknown> = {
  "/dashboard": () => ({
    metrics: dashboardMetrics,
    demandForecast,
    transferTrend,
    inventoryDistribution,
    moverSplit,
    warehouses,
    activities: agentFeed,
  }),
  "/inventory": () => ({ rows: inventory, warehouses, routes: transferRoutes }),
  "/plan": () => ({ recommendations }),
  "/self-check": () => ({ agents, feed: agentFeed }),
  "/benchmark": () => benchmark,
  "/analytics": () => ({ demandForecast, transferTrend, warehouses, topSkus, heatmap, inventoryDistribution }),
  "/audit": () => ({ entries: auditTrail }),
  "/config": () => ({
    apiUrl: "https://api.networkiq.ai/v2",
    apiKey: "niq_live_••••••••••••7fA2",
    plannerThreshold: 0.9,
    autoApprove: true,
    budgetEnvelope: 18000000,
    notifications: { email: true, slack: true, digest: false, criticalOnly: false },
  }),
};

export async function fetchResource<T>(path: keyof typeof mocks | string): Promise<T> {
  if (MOCK_MODE) {
    await latency();
    const mock = mocks[path];
    if (!mock) throw new Error(`No mock registered for ${path}`);
    return mock() as T;
  }
  const { data } = await apiClient.get<T>(path);
  return data;
}

export async function postResource<T>(path: string, body: unknown): Promise<T> {
  if (MOCK_MODE) {
    await latency(220);
    return body as T;
  }
  const { data } = await apiClient.post<T>(path, body);
  return data;
}
