
# NetworkIQ — Data Preprocessing Report

## 1. Source Dataset

Source dataset: Indian Store Sales Data

Input file:
`store_sales_data (2).csv`

Dataset size:
- Rows: 100,000
- Columns: 25
- Date range: Based on the Order Date field
- Regions: 4
- Sub-Categories: 24

The source dataset contains sales transaction information including Sales,
Profit, Quantity, Region, Sub-Category, Order ID, and Order Date.

---

## 2. Data Quality and Cleaning

The source dataset was inspected before preprocessing.

Results:

- Total rows: 100,000
- Total columns: 25
- Missing values: 0
- Duplicate rows: 0

Therefore, no rows were removed because of missing values or duplicates.

The `Order Date` column was converted from object/string format to
datetime format before calculating the selling period.

---

## 3. Aggregation Method

The raw transaction-level data was aggregated using:

`Region + Sub-Category`

Each output row therefore represents one logical inventory group:

`(Region, Sub-Category)`

The dataset contains:

- 4 regions
- 24 sub-categories

Therefore:

`4 × 24 = 96`

aggregated inventory groups were produced.

This grouping was selected because Product IDs in the source data are
transaction-level identifiers rather than reliable reusable SKUs across
regions.

No external Supply Chain dataset was joined to the Indian Store Sales
dataset.

---

## 4. Fields Derived Directly from Real Sales Data

The following fields were calculated from the source dataset:

### Total Quantity

Sum of `Quantity` for each Region + Sub-Category group.

### Total Sales

Sum of `Sales` for each Region + Sub-Category group.

### Total Profit

Sum of `Profit` for each Region + Sub-Category group.

### Sales Frequency

Count of `Order ID` records for each Region + Sub-Category group.

### Average Daily Demand

Formula:

`Average Daily Demand = Total Quantity / Number of Selling Days`

The observed selling period contained 1,826 days.

### Unit Margin

Formula:

`Unit Margin = Total Profit / Total Quantity`

### Average Unit Price

Formula:

`Average Unit Price = Total Sales / Total Quantity`

---

## 5. Velocity Classification

ABC-style velocity classification was applied using
`Avg_Daily_Demand`.

The aggregated records were sorted by average daily demand in descending
order.

Classification:

- A: Top 20% of records by demand
- B: Next 30% of records
- C: Remaining 50% of records

The resulting `Velocity_Class` values are:

`A`, `B`, `C`

---

## 6. Current Inventory Derivation

The source dataset does not contain actual on-hand inventory or warehouse
stock levels.

Therefore, Current Inventory is an assumed/derived field.

Formula:

`Current Inventory = Average Daily Demand × Coverage Days`

Coverage days are assigned deterministically according to velocity class:

| Velocity Class | Coverage Days |
|---|---:|
| A | 8 |
| B | 15 |
| C | 25 |

These values are assumptions used to simulate inventory positions for the
inventory optimization demonstration.

They are not claimed to be actual inventory values from the source data.

---

## 7. Holding Cost Rate

The source dataset does not contain inventory holding costs.

Therefore, a deterministic assumption was used.

Formula:

`Holding Cost Rate = Average Unit Price × 2%`

The resulting value represents an assumed daily holding cost per unit.

This is a configurable assumption and can be replaced by real business
data if available.

---

## 8. Lead Time

The source dataset does not contain supplier or transportation lead-time
information.

Therefore, lead time was assigned based on velocity class.

| Velocity Class | Lead Time |
|---|---:|
| A | 2 days |
| B | 4 days |
| C | 6 days |

These values are assumptions used for inventory-control calculations.

---

## 9. Safety Stock

Safety stock is not provided by the source dataset.

For the preprocessing demonstration, it was derived as:

`Safety Stock = Average Daily Demand × 2`

This represents two days of average demand.

---

## 10. Reorder Point

Reorder Point was calculated using:

`Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock`

This provides the threshold at which replenishment should be considered.

---

## 11. Reorder Status

The reorder status was calculated using:

`Reorder Status = Current Inventory < Reorder Point`

Therefore:

- `True` → Current inventory is below the reorder point.
- `False` → Current inventory is at or above the reorder point.

---

## 12. Assumption and Transparency Policy

The following fields are not available directly in the Indian Store Sales
dataset and are therefore derived or assumed:

- Current Inventory
- Coverage Days
- Holding Cost Rate
- Lead Time
- Safety Stock
- Reorder Point
- Reorder Status

These assumptions are deterministic and reproducible.

The same input data and preprocessing rules produce the same output.

No random inventory values or fabricated product mappings are used.

---

## 13. Supporting Configuration Files

### lane_cost.csv

Contains assumed transportation cost per unit between regions.

The source dataset does not contain logistics costs.

Therefore, these values are configuration assumptions used by the Cost
Engine.

### region_capacity.csv

Contains assumed regional inventory/storage capacity.

The source dataset does not contain warehouse capacity information.

Therefore, capacity values are configurable assumptions used by Guardrails.

### cold_chain.csv

Contains assumed cold-chain availability by region.

This file is optional and is intended for Guardrails when handling
perishable products.

The source dataset does not provide cold-chain facility information.

---

## 14. Final Output Files

The preprocessing pipeline produces the following backend inputs:

1. `master_inventory.csv`
2. `lane_cost.csv`
3. `region_capacity.csv`
4. `cold_chain.csv`

The primary backend dataset is:

`master_inventory.csv`

Each row represents:

`One Region + One Sub-Category`

The final `master_inventory.csv` contains 96 rows and the required
inventory-management fields.

---

## 15. Data Flow

Indian Store Sales Dataset
        |
        v
Data Validation & Preprocessing
        |
        v
Region + Sub-Category Aggregation
        |
        v
master_inventory.csv
        |
        +----> Regional Agent
        |
        +----> Coordinator Agent
        |
        +----> Cost Engine
        |
        +----> Guardrails

Supporting configuration:

lane_cost.csv
region_capacity.csv
cold_chain.csv

These supporting files are used by the Cost Engine and Guardrails.

---

## 16. Important Dataset Strategy

The Indian Store Sales dataset is the primary data source.

The Supply Chain dataset is not merged with the Indian Store Sales dataset
because there is no reliable product-level key connecting its SKUs to the
Indian Store Sub-Categories.

Region alone is not sufficient to establish a product-level relationship.

Therefore, no unsupported cross-dataset product mapping was performed.
