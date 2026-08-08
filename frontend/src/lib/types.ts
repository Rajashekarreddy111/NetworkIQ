export type RiskLevel = "critical" | "high" | "medium" | "low";
export type VelocityClass = "fast" | "medium" | "slow";
export type TransferStatus = "pending" | "approved" | "rejected" | "executed" | "overridden";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  region: "North" | "South" | "East" | "West" | "Central";
  lat: number;
  lng: number;
  capacity: number;
  utilization: number;
  skus: number;
  inventoryValue: number;
  stores: number;
  onTime: number;
}

export interface InventoryRow {
  id: string;
  sku: string;
  product: string;
  category: string;
  warehouseId: string;
  warehouse: string;
  currentStock: number;
  predictedDemand: number;
  daysCover: number;
  velocity: VelocityClass;
  capacityUsed: number;
  risk: RiskLevel;
  status: "Healthy" | "Overstock" | "Understock" | "Stockout Risk";
  unitCost: number;
  history: { month: string; demand: number; forecast: number; stock: number }[];
  location?: string;
  avgDailyDemand?: number;
  velocityClass?: string;
  unitMargin?: number;
  perishable?: boolean;
  capacityRemaining?: number;
  holdingCostRate?: number;
  leadTime?: number;
  reorderPoint?: number;
  reorderStatus?: boolean;
}

export interface Recommendation {
  id: string;
  sku: string;
  product: string;
  source: string;
  destination: string;
  quantity: number;
  transferCost: number;
  marginUnlocked: number;
  demandBasis: string;
  costTradeoff: string;
  costPerUnit: number;
  status: TransferStatus;
  confidence: number;
  expectedProfit: number;
  reasoning: string;
  agentExplanation: string;
  businessImpact: string;
  riskAnalysis: string;
  createdAt: string;
  forecast: { week: string; destinationDemand: number; sourceDemand: number; plan: number }[];
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: "healthy" | "busy" | "degraded";
  latencyMs: number;
  confidence: number;
  currentTask: string;
  throughput: string;
  uptime: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  sku: string;
  transfer: string;
  planner: string;
  decision: "Approved" | "Rejected" | "Overridden" | "Auto-Executed";
  reason: string;
  status: "Completed" | "In Transit" | "Closed" | "Cancelled";
  stage: "recommended" | "reviewed" | "executed" | "completed";
}

export const categories = [
  "Apparel",
  "Baby Care",
  "Consumer Electronics",
  "Electricals",
  "Footwear",
  "Furniture",
  "Grocery & Staples",
  "Health & Nutrition",
  "Home & Furnishing",
  "Kitchenware",
  "Large Appliances",
  "Mobile Accessories",
  "Small Appliances",
] as const;

export const regions = ["North", "South", "East", "West", "Central"] as const;

export const notifications = [
  { id: 1, title: "14 transfers awaiting your approval", body: "Plan v41 published by Coordinator Agent", time: "2m", tone: "info" as const },
  { id: 2, title: "Delhi NCR utilization at 91%", body: "Capacity Agent recommends overflow re-slotting", time: "18m", tone: "warning" as const },
  { id: 3, title: "₹1.64Cr savings realised in August", body: "241 executed transfers, 96.2% on-time", time: "1h", tone: "success" as const },
  { id: 4, title: "Guardrail Agent degraded", body: "Latency 728ms, above the 500ms SLO", time: "3h", tone: "danger" as const },
];
