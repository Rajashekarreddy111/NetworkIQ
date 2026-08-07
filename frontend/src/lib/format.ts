export const inr = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
};

export const compact = (value: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export const num = (value: number) => value.toLocaleString("en-IN");
