# Shopify Merchant Analytics Dashboard

AI-ready Shopify merchant analytics metric engine and foundation dashboard built with Next.js (App Router), React 19, TypeScript, Recharts, and Vitest.

---

## 1. Overview & Architecture

This repository forms the core foundation for an AI-powered merchant analytics platform. It parses real-world store order history data, provides robust and modular analytical metric functions, supports predefined and custom date windows anchored to a fixed reference date, and is fully covered by automated unit and integration tests.

### Project Structure

```text
├── Store Order History, May to October 2025.csv  # Raw merchant dataset (28 line items)
├── src/
│   ├── types/
│   │   ├── order.ts                              # Core OrderLineItem and CSV schema types
│   │   └── metrics.ts                            # Domain metric interfaces across all 5 categories
│   ├── data/
│   │   ├── parser.ts                             # PapaParse wrapper, type coercion, validation
│   │   └── loader.ts                             # Disk loader with memory caching
│   ├── utils/
│   │   ├── date.ts                               # Fixed reference date rules and range filters
│   │   ├── math.ts                               # Safe division (zero-safe) and rounding
│   │   └── format.ts                             # Currency, percentage, and number formatters
│   ├── metrics/
│   │   ├── sales.ts                              # Category 1: Sales Performance
│   │   ├── products.ts                           # Category 2: Best-Selling Products
│   │   ├── returns.ts                            # Category 3: Returns & Refunds
│   │   ├── customers.ts                          # Category 4: Repeat Customer Performance
│   │   ├── channels.ts                           # Category 5: Sales Channel Performance
│   │   └── index.ts                              # Unified metric aggregation pipeline
│   ├── components/
│   │   └── MetricCard.tsx                        # Reusable KPI component
│   └── app/
│       ├── layout.tsx                            # Root layout
│       ├── page.tsx                              # Foundation KPI dashboard page
│       ├── globals.css                           # Tailwind CSS setup
│       └── api/metrics/route.ts                  # REST API endpoint for metric queries
└── tests/
    ├── parser.test.ts                            # CSV parsing & validation tests
    ├── date.test.ts                              # Date interpretation tests (Oct 27, 2025)
    ├── sales.test.ts                             # Sales metrics verification
    ├── products.test.ts                          # Product & category metrics verification
    ├── returns.test.ts                           # Returns & refunds verification
    ├── customers.test.ts                         # Repeat customer metrics verification
    ├── channels.test.ts                          # Channel metrics verification
    └── dashboard.test.ts                         # Integration pipeline tests
```

---

## 2. Dataset

The source dataset is `Store Order History, May to October 2025.csv`, containing **28 line items** across **20 unique orders**, **18 unique customers**, and 19 columns:

`order_id, line_item_id, order_date, customer_id, is_repeat_customer, product_id, product_title, product_category, variant, quantity, unit_price, discount_amount, line_total, sales_channel, fulfillment_status, returned, return_date, return_reason, refund_amount`

### Verified Dataset Totals:
- **Total Sales (`line_total` sum):** $3,098.35
- **Gross Sales (`quantity * unit_price`):** $3,216.00
- **Total Discounts (`discount_amount`):** $117.65
- **Total Refunds (`refund_amount`):** $1,116.94
- **Net Sales (`totalSales - totalRefunds`):** $1,981.41
- **Unique Orders:** 20 (multi-line orders: #1047, #1342, #2402, #2571, #2846, #2988, #3149)
- **Line Items:** 28
- **Total Units Sold:** 33 units

---

## 3. Date Interpretation Rules (Task 4)

All relative date queries are evaluated against a **fixed reference date: October 27, 2025** (Monday).

| Period | Date Range (Inclusive) | Notes |
| :--- | :--- | :--- |
| **Today** | October 27, 2025 – October 27, 2025 | Exactly the reference date |
| **Yesterday** | October 26, 2025 – October 26, 2025 | Day prior to reference date |
| **This Week** | October 27, 2025 – October 27, 2025 | Starts Monday, capped at reference date |
| **Last Week** | October 20, 2025 – October 26, 2025 | Monday through Sunday of previous week |
| **This Month** | October 1, 2025 – October 27, 2025 | Current calendar month capped at reference date |
| **Last Month** | September 1, 2025 – September 30, 2025 | Complete prior month |

### Date Query Dimensions
- **General Return Activity:** Uses `return_date` (e.g., returns processed during October 2025 = 6 returns, $1,014.94 refunded).
- **Orders Placed & Subsequently Returned:** Uses `order_date` (e.g., orders placed during October 2025 that were returned = 5 orders, $886.15 refunded).
- **No Future Dates:** Custom date ranges are automatically capped at the reference date (`2025-10-27`).

---

## 4. The Five Metric Categories & Formulas

### 1. Sales Performance (`src/metrics/sales.ts`)
- **Total Sales:** $\sum \text{line\_total} = \$3,098.35$
- **Gross Sales:** $\sum (\text{quantity} \times \text{unit\_price}) = \$3,216.00$
- **Total Discounts:** $\sum \text{discount\_amount} = \$117.65$
- **Net Sales:** $\text{Total Sales} - \text{Total Refunds} = \$1,981.41$
- **Total Orders:** $\text{Count of distinct } \text{order\_id} = 20$ (prevents duplicate counting of multi-item orders)
- **Average Order Value (AOV):** $\frac{\text{Total Sales}}{\text{Total Orders}} = \frac{\$3,098.35}{20} = \$154.92$ (safe division with 0 fallback)
- **Monthly Sales & MoM Growth:**
  - May 2025: $224.00 (2 orders)
  - June 2025: $162.00 (1 order, -27.68% MoM)
  - July 2025: $118.00 (1 order, -27.16% MoM)
  - August 2025: $102.00 (1 order, -13.56% MoM)
  - September 2025: $231.10 (2 orders, +126.57% MoM)
  - October 2025: $2,261.25 (13 orders, +878.47% MoM)

### 2. Best-Selling Products (`src/metrics/products.ts`)
- **Top Product by Revenue:**
  1. `P-1001` Alpine Down Parka: $854.10 (4 units)
  2. `P-1002` Northridge Insulated Jacket: $596.25 (4 units)
  3. `P-1008` Selvedge Slim Jeans: $436.60 (4 units)
- **Top Products by Units Sold:**
  - 5 products tied at 4 units sold (Alpine Down Parka, Northridge Insulated Jacket, Selvedge Slim Jeans, Organic Cotton Tee, Wool Beanie), sorted with revenue tie-breakers.
- **Category Performance:**
  - Outerwear: $1,638.35 (52.88% share, 10 units)
  - Bottoms: $658.60 (21.26% share, 7 units)
  - Knitwear: $450.20 (14.53% share, 5 units)
  - Accessories: $183.40 (5.92% share, 6 units)
  - Tops: $167.80 (5.42% share, 5 units)

### 3. Returns & Refunds (`src/metrics/returns.ts`)
- **Total Returned Line Items:** 8 items (out of 28 line items = 28.57% item return rate)
- **Total Returned Orders:** 8 unique orders (out of 20 orders = 40.00% order return rate)
- **Total Refund Amount:** $1,116.94
- **Most Frequently Returned Products:**
  1. Alpine Down Parka: 3 returns ($657.00 refunded)
  2. Northridge Insulated Jacket: 2 returns ($263.94 refunded)
  3. Harbor Rain Shell: 1 return ($94.00 refunded)
  4. Organic Cotton Tee: 1 return ($28.00 refunded)
  5. Utility Chino: 1 return ($74.00 refunded)
- **Return Reasons Breakdown:**
  - Too small: 2 returns (25.0%, $354.15)
  - Too large: 2 returns (25.0%, $247.00)
  - Changed mind: 2 returns (25.0%, $202.79)
  - Defective: 1 return (12.5%, $219.00)
  - Not as pictured: 1 return (12.5%, $94.00)

### 4. Repeat Customer Performance (`src/metrics/customers.ts`)
- **Unique Customers:** 18
- **Repeat Customers:** 7 customers flagged as repeat buyers (`C-10087`, `C-10233`, `C-10318`, `C-10391`, `C-10442`, `C-10642`, `C-10771`)
- **Repeat Customer Percentage:** $\frac{7}{18} \times 100 = 38.89\%$
- **Repeat Customer Sales:** $1,129.65 (36.46% of total revenue)
- **First-Time Customer Sales:** $1,968.70 (63.54% of total revenue)

### 5. Sales Channel Performance (`src/metrics/channels.ts`)
- **Online Store:** $1,882.20 (60.75% share, 11 orders, 18 units, AOV $171.11)
- **Shop app:** $501.15 (16.17% share, 3 orders, 6 units, AOV $167.05)
- **Point of Sale:** $408.00 (13.17% share, 4 orders, 7 units, AOV $102.00)
- **Instagram:** $307.00 (9.91% share, 2 orders, 2 units, AOV $153.50)
- **Best-Performing Channel:** Online Store (by both revenue and order volume)

---

## 5. Assumptions & Calculation Details

1. **Revenue Recognition:**
   - `Total Sales` is defined as the sum of `line_total` ($\text{quantity} \times \text{unit\_price} - \text{discount\_amount}$).
   - `Net Sales` subtracts issued refunds ($\text{Total Sales} - \text{Total Refunds}$).
2. **Order vs Line Item Differentiation:**
   - Multi-line orders are grouped by `order_id` so that an order with 2 line items counts as **1 order**, not 2.
   - Denominator for Average Order Value (AOV) is always unique order count, preventing skew.
3. **Zero Denominator Protection:**
   - All ratio and percentage functions wrap calculations in `safeDivide` to return `0` rather than `NaN` or `Infinity`.
4. **Repeat Customer Representation:**
   - Follows Shopify's transaction-level model: repeat customer sales reflect revenue from lines where `is_repeat_customer === true`.

---

## 6. Getting Started & Commands

### Prerequisites
- Node.js 18+ (tested on Node v26)
- npm 9+

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit and integration tests (Vitest)
npm test

# 3. Run tests in watch mode
npm run test:watch

# 4. Build production bundle (Next.js)
npm run build

# 5. Start development server
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).
The API endpoint is available at [http://localhost:3000/api/metrics](http://localhost:3000/api/metrics).
