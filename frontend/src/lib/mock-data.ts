/**
 * NetworkIQ mock domain data — realistic supply-chain network for a
 * pan-India retail distribution business.
 */

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

const rand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
const r = rand(20260807);
const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]!;
const num = (min: number, max: number) => Math.round(min + r() * (max - min));

export const warehouses: Warehouse[] = [
  { id: "WH-DEL", name: "Delhi NCR Fulfilment Hub", code: "DEL-01", city: "Delhi NCR", region: "North", lat: 28.61, lng: 77.21, capacity: 480000, utilization: 91, skus: 12480, inventoryValue: 184_500_000, stores: 212, onTime: 96.4 },
  { id: "WH-MUM", name: "Bhiwandi Mega Distribution Center", code: "MUM-02", city: "Mumbai", region: "West", lat: 19.29, lng: 73.06, capacity: 620000, utilization: 84, skus: 15320, inventoryValue: 241_800_000, stores: 268, onTime: 94.1 },
  { id: "WH-BLR", name: "Bengaluru South Regional DC", code: "BLR-03", city: "Bengaluru", region: "South", lat: 12.97, lng: 77.59, capacity: 410000, utilization: 77, skus: 11190, inventoryValue: 158_200_000, stores: 194, onTime: 97.2 },
  { id: "WH-HYD", name: "Hyderabad Velocity Hub", code: "HYD-04", city: "Hyderabad", region: "South", lat: 17.39, lng: 78.49, capacity: 330000, utilization: 68, skus: 8940, inventoryValue: 112_400_000, stores: 141, onTime: 95.8 },
  { id: "WH-CCU", name: "Kolkata East Consolidation Yard", code: "CCU-05", city: "Kolkata", region: "East", lat: 22.57, lng: 88.36, capacity: 290000, utilization: 62, skus: 7460, inventoryValue: 88_900_000, stores: 118, onTime: 91.6 },
  { id: "WH-AMD", name: "Ahmedabad Industrial Depot", code: "AMD-06", city: "Ahmedabad", region: "West", lat: 23.02, lng: 72.57, capacity: 260000, utilization: 73, skus: 6820, inventoryValue: 74_600_000, stores: 102, onTime: 93.4 },
  { id: "WH-NAG", name: "Nagpur Central Cross-Dock", code: "NAG-07", city: "Nagpur", region: "Central", lat: 21.15, lng: 79.09, capacity: 210000, utilization: 58, skus: 5310, inventoryValue: 51_300_000, stores: 76, onTime: 92.9 },
  { id: "WH-MAA", name: "Chennai Coastal Fulfilment Node", code: "MAA-08", city: "Chennai", region: "South", lat: 13.08, lng: 80.27, capacity: 300000, utilization: 88, skus: 9240, inventoryValue: 121_700_000, stores: 152, onTime: 95.1 },
  { id: "WH-JAI", name: "Jaipur North-West Depot", code: "JAI-09", city: "Jaipur", region: "North", lat: 26.91, lng: 75.79, capacity: 180000, utilization: 54, skus: 4180, inventoryValue: 39_800_000, stores: 61, onTime: 90.2 },
  { id: "WH-LKO", name: "Lucknow Upcountry Hub", code: "LKO-10", city: "Lucknow", region: "North", lat: 26.85, lng: 80.95, capacity: 165000, utilization: 66, skus: 3960, inventoryValue: 35_400_000, stores: 58, onTime: 89.7 },
];

const products: { name: string; category: string; cost: number }[] = [
  { name: 'LED Smart TV 43" 4K', category: "Consumer Electronics", cost: 24990 },
  { name: "Front Load Washing Machine 7kg", category: "Large Appliances", cost: 31450 },
  { name: "Inverter Split AC 1.5T 5-Star", category: "Large Appliances", cost: 38900 },
  { name: "Wireless ANC Headphones", category: "Consumer Electronics", cost: 8490 },
  { name: "Cold Pressed Groundnut Oil 5L", category: "Grocery & Staples", cost: 1240 },
  { name: "Basmati Rice Premium 10kg", category: "Grocery & Staples", cost: 1180 },
  { name: "Cotton Bedsheet King Set", category: "Home & Furnishing", cost: 2190 },
  { name: "Non-Stick Cookware 5-pc Set", category: "Kitchenware", cost: 3450 },
  { name: "Running Shoes Mesh Pro", category: "Footwear", cost: 2890 },
  { name: "Men's Slim Fit Denim", category: "Apparel", cost: 1690 },
  { name: "Baby Diapers Jumbo Pack XL", category: "Baby Care", cost: 1490 },
  { name: "Protein Supplement 1kg", category: "Health & Nutrition", cost: 2990 },
  { name: "Robotic Vacuum Cleaner", category: "Small Appliances", cost: 21990 },
  { name: "Air Fryer 4.2L Digital", category: "Small Appliances", cost: 6790 },
  { name: "Ergonomic Office Chair", category: "Furniture", cost: 9490 },
  { name: "Solar Power Bank 20000mAh", category: "Mobile Accessories", cost: 2290 },
  { name: "Water Purifier RO+UV", category: "Large Appliances", cost: 14990 },
  { name: "Ceiling Fan BLDC 1200mm", category: "Electricals", cost: 3690 },
];

export const categories = Array.from(new Set(products.map((p) => p.category))).sort();
export const regions = ["North", "South", "East", "West", "Central"] as const;

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildInventory(): InventoryRow[] {
  const rows: InventoryRow[] = [];
  let n = 1;
  for (const wh of warehouses) {
    for (const p of products.slice(0, 9 + Math.floor(r() * 6))) {
      const velocity: VelocityClass = pick(["fast", "fast", "medium", "medium", "slow"]);
      const predictedDemand = num(velocity === "fast" ? 900 : velocity === "medium" ? 380 : 90, velocity === "fast" ? 4200 : velocity === "medium" ? 1400 : 420);
      const ratio = 0.35 + r() * 1.8;
      const currentStock = Math.max(0, Math.round(predictedDemand * ratio));
      const daysCover = Math.round((currentStock / Math.max(predictedDemand, 1)) * 30);
      const risk: RiskLevel = daysCover < 8 ? "critical" : daysCover < 16 ? "high" : daysCover > 70 ? "medium" : "low";
      const status = daysCover < 8 ? "Stockout Risk" : daysCover < 16 ? "Understock" : daysCover > 70 ? "Overstock" : "Healthy";
      const base = predictedDemand;
      rows.push({
        id: `INV-${String(n).padStart(4, "0")}`,
        sku: `SKU-${p.category.slice(0, 2).toUpperCase()}${String(1000 + n * 7).slice(0, 4)}`,
        product: p.name,
        category: p.category,
        warehouseId: wh.id,
        warehouse: wh.city,
        currentStock,
        predictedDemand,
        daysCover,
        velocity,
        capacityUsed: Math.min(99, Math.round(wh.utilization * (0.7 + r() * 0.5))),
        risk,
        status,
        unitCost: p.cost,
        history: MONTHS.map((m, i) => {
          const seasonal = 1 + Math.sin((i / MONTHS.length) * Math.PI * 2) * 0.18;
          const demand = Math.round(base * seasonal * (0.82 + r() * 0.32));
          return {
            month: m,
            demand,
            forecast: Math.round(demand * (0.94 + r() * 0.14)),
            stock: Math.round(currentStock * (0.7 + r() * 0.6)),
          };
        }),
      });
      n += 1;
    }
  }
  return rows;
}

export const inventory: InventoryRow[] = buildInventory();

const REASONS = [
  "Destination node shows 11-week accelerating demand while source carries 84 days of idle cover. Rebalancing releases working capital without breaching service levels.",
  "Forecast agent detected a festive-season uplift of 34% in the destination catchment. Source has surplus above safety stock even after the transfer.",
  "Slow-moving cover at source exceeds the 60-day guardrail. Lane cost is below the margin unlocked, so the transfer is net accretive.",
  "Capacity agent flagged source utilization at 91%. Moving this SKU frees pallet positions for higher-velocity inbound receipts.",
  "Destination stockout probability is 62% within 14 days. Transfer removes the risk at 1/4th the cost of expedited vendor replenishment.",
];

function buildRecommendations(): Recommendation[] {
  const recs: Recommendation[] = [];
  for (let i = 0; i < 34; i += 1) {
    const row = inventory[Math.floor(r() * inventory.length)]!;
    let dest = pick(warehouses);
    while (dest.id === row.warehouseId) dest = pick(warehouses);
    const source = warehouses.find((w) => w.id === row.warehouseId)!;
    const quantity = num(120, 2600);
    const costPerUnit = Number((6 + r() * 34).toFixed(2));
    const transferCost = Math.round(quantity * costPerUnit);
    const marginUnlocked = Math.round(transferCost * (1.6 + r() * 3.4));
    const status: TransferStatus = i < 14 ? "pending" : i < 22 ? "approved" : i < 27 ? "rejected" : i < 31 ? "executed" : "overridden";
    const confidence = Number((0.71 + r() * 0.27).toFixed(2));
    recs.push({
      id: `TR-${2600 + i}`,
      sku: row.sku,
      product: row.product,
      source: source.city,
      destination: dest.city,
      quantity,
      transferCost,
      marginUnlocked,
      demandBasis: pick(["12-week Prophet + XGBoost ensemble", "Festive uplift model v4", "Store-level POS velocity", "Regional demand heat index", "Promotion-adjusted baseline"]),
      costTradeoff: `₹${(transferCost / 100000).toFixed(2)}L lane cost vs ₹${(marginUnlocked / 100000).toFixed(2)}L margin`,
      costPerUnit,
      status,
      confidence,
      expectedProfit: marginUnlocked - transferCost,
      reasoning: pick(REASONS),
      agentExplanation: `Coordinator agent merged the demand signal (conf ${(confidence * 100).toFixed(0)}%) with capacity headroom at ${dest.city} (${dest.utilization}% utilized) and cleared the guardrail check on safety stock, lane SLA and budget envelope.`,
      businessImpact: `Protects ₹${(marginUnlocked / 100000).toFixed(1)}L of revenue at risk, lifts availability in ${dest.region} by ${num(2, 9)}0 bps and reduces holding cost at ${source.city} by ₹${(transferCost / 100000).toFixed(1)}L per cycle.`,
      riskAnalysis: pick([
        "Low risk. Source retains 22 days of cover post-transfer; lane has 96% on-time history.",
        "Moderate risk. Monsoon disruption on this corridor may add 1-2 days transit. Buffer applied.",
        "Low risk. Reversible within the same planning cycle if destination demand softens.",
      ]),
      createdAt: `2026-08-0${1 + (i % 7)}T${String(8 + (i % 9)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
      forecast: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((week, k) => ({
        week,
        destinationDemand: Math.round(quantity * (0.3 + k * 0.06) * (0.85 + r() * 0.3)),
        sourceDemand: Math.round(quantity * (0.24 - k * 0.012) * (0.9 + r() * 0.25)),
        plan: Math.round(quantity * (0.28 + k * 0.05)),
      })),
    });
  }
  return recs;
}

export const recommendations: Recommendation[] = buildRecommendations();

export const agents: AgentState[] = [
  { id: "demand", name: "Demand Forecast Agent", role: "Predicts SKU × node demand over a 12-week horizon", status: "healthy", latencyMs: 412, confidence: 0.94, currentTask: "Scoring 15,320 SKU-node pairs for W36 festive uplift", throughput: "1.2k inferences/min", uptime: 99.98 },
  { id: "inventory", name: "Inventory Agent", role: "Tracks live position, safety stock and cover", status: "busy", latencyMs: 268, confidence: 0.91, currentTask: "Reconciling Bhiwandi cycle-count variance (0.4%)", throughput: "3.8k reads/min", uptime: 99.95 },
  { id: "capacity", name: "Capacity Agent", role: "Models pallet positions, dock slots and throughput", status: "healthy", latencyMs: 189, confidence: 0.89, currentTask: "Re-slotting Delhi NCR overflow (91% utilized)", throughput: "740 checks/min", uptime: 99.99 },
  { id: "transfer", name: "Transfer Optimization Agent", role: "Solves the multi-echelon rebalancing MILP", status: "busy", latencyMs: 1340, confidence: 0.87, currentTask: "Optimizing 34 candidate lanes under ₹1.8Cr budget", throughput: "12 plans/hour", uptime: 99.82 },
  { id: "coordinator", name: "Coordinator Agent", role: "Orchestrates agent handoffs and conflict resolution", status: "healthy", latencyMs: 96, confidence: 0.96, currentTask: "Merging demand + capacity signals into plan v41", throughput: "60 cycles/min", uptime: 100 },
  { id: "guardrail", name: "Guardrail Agent", role: "Enforces policy, budget and safety-stock limits", status: "degraded", latencyMs: 728, confidence: 0.82, currentTask: "Re-validating 3 lanes that breached SLA tolerance", throughput: "410 checks/min", uptime: 99.4 },
];

export const agentFeed = [
  { id: 1, agent: "Coordinator Agent", message: "Plan v41 assembled from 6 agent outputs", level: "info", time: "12s ago" },
  { id: 2, agent: "Guardrail Agent", message: "Lane MUM→LKO rejected: safety stock breach at source", level: "warning", time: "48s ago" },
  { id: 3, agent: "Demand Forecast Agent", message: "Festive uplift detected in South region (+34%)", level: "success", time: "1m ago" },
  { id: 4, agent: "Transfer Optimization Agent", message: "MILP converged in 1.34s — 34 lanes, gap 0.6%", level: "success", time: "2m ago" },
  { id: 5, agent: "Capacity Agent", message: "Delhi NCR utilization crossed 90% threshold", level: "warning", time: "3m ago" },
  { id: 6, agent: "Inventory Agent", message: "Cycle-count variance reconciled for 412 SKUs", level: "info", time: "5m ago" },
  { id: 7, agent: "Coordinator Agent", message: "Escalated 4 low-confidence lanes to planner review", level: "info", time: "7m ago" },
  { id: 8, agent: "Demand Forecast Agent", message: "Retrained ensemble on 18 months POS history", level: "success", time: "11m ago" },
];

export const demandForecast = [
  { period: "W28", actual: 41200, forecast: 40600, upper: 43800, lower: 37400 },
  { period: "W29", actual: 43850, forecast: 43100, upper: 46200, lower: 40000 },
  { period: "W30", actual: 46100, forecast: 45800, upper: 48900, lower: 42700 },
  { period: "W31", actual: 44720, forecast: 45200, upper: 48300, lower: 42100 },
  { period: "W32", actual: 48900, forecast: 48100, upper: 51400, lower: 44800 },
  { period: "W33", actual: 52400, forecast: 51900, upper: 55200, lower: 48600 },
  { period: "W34", actual: 54100, forecast: 53800, upper: 57100, lower: 50500 },
  { period: "W35", actual: null, forecast: 58200, upper: 62000, lower: 54400 },
  { period: "W36", actual: null, forecast: 63400, upper: 67800, lower: 59000 },
  { period: "W37", actual: null, forecast: 61100, upper: 65600, lower: 56600 },
  { period: "W38", actual: null, forecast: 57800, upper: 62100, lower: 53500 },
  { period: "W39", actual: null, forecast: 55200, upper: 59400, lower: 51000 },
];

export const transferTrend = [
  { month: "Mar", recommended: 182, approved: 141, executed: 132, savings: 84 },
  { month: "Apr", recommended: 214, approved: 168, executed: 159, savings: 96 },
  { month: "May", recommended: 198, approved: 152, executed: 148, savings: 91 },
  { month: "Jun", recommended: 246, approved: 201, executed: 190, savings: 118 },
  { month: "Jul", recommended: 288, approved: 238, executed: 226, savings: 142 },
  { month: "Aug", recommended: 312, approved: 262, executed: 241, savings: 164 },
];

export const inventoryDistribution = categories.slice(0, 6).map((c, i) => ({
  name: c,
  value: [284, 216, 178, 142, 118, 96][i] ?? 80,
}));

export const moverSplit = [
  { name: "Fast movers", value: 46 },
  { name: "Medium movers", value: 34 },
  { name: "Slow movers", value: 20 },
];

export const benchmark = {
  metrics: [
    { metric: "Holding Cost", classical: 412, ai: 318, unit: "₹L", lowerIsBetter: true },
    { metric: "Transfer Cost", classical: 96, ai: 112, unit: "₹L", lowerIsBetter: true },
    { metric: "Stock Availability", classical: 91.2, ai: 97.6, unit: "%", lowerIsBetter: false },
    { metric: "Catalog Coverage", classical: 78.4, ai: 93.1, unit: "%", lowerIsBetter: false },
    { metric: "Net Savings", classical: 0, ai: 164, unit: "₹L", lowerIsBetter: false },
  ],
  radar: [
    { axis: "Availability", classical: 72, ai: 94 },
    { axis: "Cost Efficiency", classical: 68, ai: 89 },
    { axis: "Coverage", classical: 63, ai: 92 },
    { axis: "Responsiveness", classical: 51, ai: 96 },
    { axis: "Explainability", classical: 44, ai: 88 },
    { axis: "Guardrail Safety", classical: 70, ai: 91 },
  ],
};

export const auditTrail: AuditEntry[] = recommendations.slice(0, 22).map((rec, i) => ({
  id: `AUD-${9100 + i}`,
  timestamp: `2026-08-0${1 + (i % 7)} ${String(9 + (i % 9)).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}`,
  sku: rec.sku,
  transfer: `${rec.source} → ${rec.destination}`,
  planner: pick(["A. Kulkarni", "R. Iyer", "S. Bhatt", "N. Verma", "Auto-Pilot"]),
  decision: rec.status === "approved" ? "Approved" : rec.status === "rejected" ? "Rejected" : rec.status === "overridden" ? "Overridden" : "Auto-Executed",
  reason: pick([
    "Confidence above 0.90 auto-approval threshold",
    "Planner reduced quantity to protect source safety stock",
    "Lane cost exceeded regional budget envelope",
    "Aligned with festive season allocation plan",
    "Guardrail flagged SLA risk on corridor",
  ]),
  status: pick(["Completed", "In Transit", "Closed"]) as AuditEntry["status"],
  stage: (["recommended", "reviewed", "executed", "completed"] as const)[i % 4]!,
}));

export const dashboardMetrics = {
  totalWarehouses: warehouses.length,
  totalStores: warehouses.reduce((a, w) => a + w.stores, 0),
  activeSkus: warehouses.reduce((a, w) => a + w.skus, 0),
  inventoryValue: warehouses.reduce((a, w) => a + w.inventoryValue, 0),
  holdingCost: 31_800_000,
  transferCost: 11_200_000,
  estimatedSavings: 16_400_000,
  aiConfidence: 0.91,
  pendingTransfers: recommendations.filter((x) => x.status === "pending").length,
  rejectedTransfers: recommendations.filter((x) => x.status === "rejected").length,
  warehouseUtilization: Math.round(warehouses.reduce((a, w) => a + w.utilization, 0) / warehouses.length),
  stockoutRisk: Math.round((inventory.filter((i) => i.risk === "critical").length / inventory.length) * 1000) / 10,
};

export const topSkus = inventory
  .slice()
  .sort((a, b) => b.predictedDemand * b.unitCost - a.predictedDemand * a.unitCost)
  .slice(0, 8)
  .map((i) => ({ sku: i.sku, product: i.product, revenue: Math.round((i.predictedDemand * i.unitCost) / 100000), velocity: i.velocity }));

export const heatmap = regions.map((region) => ({
  region,
  cells: categories.slice(0, 8).map((cat) => ({ category: cat, value: num(18, 98) })),
}));

export const transferRoutes = [
  { from: "WH-MUM", to: "WH-BLR", volume: 92 },
  { from: "WH-DEL", to: "WH-LKO", volume: 74 },
  { from: "WH-MAA", to: "WH-HYD", volume: 61 },
  { from: "WH-AMD", to: "WH-JAI", volume: 48 },
  { from: "WH-NAG", to: "WH-CCU", volume: 55 },
  { from: "WH-BLR", to: "WH-MAA", volume: 38 },
  { from: "WH-DEL", to: "WH-NAG", volume: 44 },
];

export const notifications = [
  { id: 1, title: "14 transfers awaiting your approval", body: "Plan v41 published by Coordinator Agent", time: "2m", tone: "info" as const },
  { id: 2, title: "Delhi NCR utilization at 91%", body: "Capacity Agent recommends overflow re-slotting", time: "18m", tone: "warning" as const },
  { id: 3, title: "₹1.64Cr savings realised in August", body: "241 executed transfers, 96.2% on-time", time: "1h", tone: "success" as const },
  { id: 4, title: "Guardrail Agent degraded", body: "Latency 728ms, above the 500ms SLO", time: "3h", tone: "danger" as const },
];
