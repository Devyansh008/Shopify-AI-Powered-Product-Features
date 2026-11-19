/**
 * Unified Metric Engine for Shopify Merchant Analytics.
 * Re-exports all 5 metric categories and provides a single computation pipeline.
 */

export * from './sales';
export * from './products';
export * from './returns';
export * from './customers';
export * from './channels';

import { DashboardMetrics, DateRange } from '../types/metrics';
import { OrderLineItem } from '../types/order';
import { DEFAULT_REFERENCE_DATE, filterOrdersByDateRange } from '../utils/date';
import { calculateSalesPerformance } from './sales';
import { calculateBestSellingProducts } from './products';
import { calculateReturnMetrics } from './returns';
import { calculateRepeatCustomerMetrics } from './customers';
import { calculateSalesChannelMetrics } from './channels';

/**
 * Computes all five core metric categories.
 * Optionally filters by date range before computing.
 */
export function computeDashboardMetrics(
  items: OrderLineItem[],
  options?: {
    dateRange?: DateRange;
    referenceDate?: string;
    topNProducts?: number;
  }
): DashboardMetrics {
  const referenceDate = options?.referenceDate || DEFAULT_REFERENCE_DATE;
  const filteredItems = options?.dateRange
    ? filterOrdersByDateRange(items, options.dateRange, 'orderDate', referenceDate)
    : items;

  return {
    referenceDate,
    dateRangeApplied: options?.dateRange,
    sales: calculateSalesPerformance(filteredItems),
    products: calculateBestSellingProducts(filteredItems, options?.topNProducts ?? 5),
    returns: calculateReturnMetrics(filteredItems),
    repeatCustomers: calculateRepeatCustomerMetrics(filteredItems),
    salesChannels: calculateSalesChannelMetrics(filteredItems),
  };
}
