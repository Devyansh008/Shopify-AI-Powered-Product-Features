import { ProductCategory, SalesChannel } from './order';

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  label?: string;
}

export type PredefinedDateRangeKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth';

// 1. Sales Performance Types
export interface DailySalesPoint {
  date: string;
  sales: number;
  orders: number;
  units: number;
}

export interface MonthlySalesPoint {
  month: string; // 'YYYY-MM'
  sales: number;
  orders: number;
  units: number;
  aov: number;
  monthOverMonthGrowth: number | null; // percentage growth or null for first month
}

export interface SalesPerformanceMetrics {
  totalSales: number;           // Net of discounts, before refunds (sum of line_total)
  grossSales: number;           // sum of unit_price * quantity
  totalDiscounts: number;       // sum of discount_amount
  netSales: number;             // totalSales minus totalRefunds
  totalOrders: number;          // Unique order count
  totalLineItems: number;       // Total line item rows
  totalUnitsSold: number;       // Total quantity sold
  averageOrderValue: number;    // totalSales / totalOrders (safely handled if 0 orders)
  salesOverTime: DailySalesPoint[];
  monthlySales: MonthlySalesPoint[];
}

// 2. Best-Selling Products Types
export interface ProductRevenueMetric {
  productId: string;
  productTitle: string;
  category: ProductCategory;
  revenue: number;
  unitsSold: number;
}

export interface ProductUnitsMetric {
  productId: string;
  productTitle: string;
  category: ProductCategory;
  unitsSold: number;
  revenue: number;
}

export interface ProductCategoryMetric {
  category: ProductCategory;
  revenue: number;
  unitsSold: number;
  orderCount: number;
  revenueSharePercentage: number;
}

export interface BestSellingProductsMetrics {
  topProductsByRevenue: ProductRevenueMetric[];
  topProductsByUnits: ProductUnitsMetric[];
  categoryPerformance: ProductCategoryMetric[];
}

// 3. Returns & Refunds Types
export interface ReturnReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
  totalRefund: number;
}

export interface ReturnedProductSummary {
  productId: string;
  productTitle: string;
  returnCount: number;
  refundAmount: number;
}

export interface ReturnMetrics {
  totalReturns: number;                 // Count of returned line items
  returnedOrdersCount: number;          // Distinct orders with at least one return
  orderReturnRate: number;              // (returnedOrders / totalOrders) * 100
  itemReturnRate: number;               // (returnedLineItems / totalLineItems) * 100
  totalRefundAmount: number;            // Sum of refund_amount
  mostFrequentlyReturnedProducts: ReturnedProductSummary[];
  returnReasonsBreakdown: ReturnReasonBreakdown[];
}

// 4. Repeat Customer Performance Types
export interface CustomerSummary {
  customerId: string;
  orderCount: number;
  totalSpend: number;
  isRepeatCustomer: boolean;
}

export interface RepeatCustomerMetrics {
  uniqueCustomers: number;
  repeatCustomerCount: number;          // Unique customers flagged as repeat
  repeatCustomerPercentage: number;     // (repeatCustomerCount / uniqueCustomers) * 100
  repeatCustomerSales: number;          // Total revenue from transactions flagged as repeat
  repeatCustomerSalesPercentage: number;// (repeatCustomerSales / totalSales) * 100
  firstTimeSales: number;               // Revenue from first-time transactions
  firstTimeSalesPercentage: number;     // (firstTimeSales / totalSales) * 100
  customerBreakdown: CustomerSummary[];
}

// 5. Sales Channel Performance Types
export interface ChannelMetric {
  channel: SalesChannel;
  revenue: number;
  orders: number;
  units: number;
  aov: number;
  revenueSharePercentage: number;
}

export interface SalesChannelMetrics {
  channels: ChannelMetric[];
  bestPerformingChannelByRevenue: SalesChannel | null;
  bestPerformingChannelByOrders: SalesChannel | null;
}

// Aggregate Dashboard Metrics
export interface DashboardMetrics {
  referenceDate: string;
  dateRangeApplied?: DateRange;
  sales: SalesPerformanceMetrics;
  products: BestSellingProductsMetrics;
  returns: ReturnMetrics;
  repeatCustomers: RepeatCustomerMetrics;
  salesChannels: SalesChannelMetrics;
}
