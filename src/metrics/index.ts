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
import { calculateSalesPerformance, getSalesMetrics } from './sales';
import { calculateBestSellingProducts, getProductMetrics } from './products';
import { calculateReturnMetrics, getReturnMetrics } from './returns';
import { calculateRepeatCustomerMetrics, getCustomerMetrics } from './customers';
import { calculateSalesChannelMetrics, getChannelMetrics } from './channels';

/**
 * Computes all five core metric categories.
 * If dateRange is supplied, delegates through exact startDate & endDate boundaries.
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

  if (options?.dateRange) {
    const { startDate, endDate } = options.dateRange;
    return {
      referenceDate,
      dateRangeApplied: options.dateRange,
      sales: getSalesMetrics(startDate, endDate, items),
      products: getProductMetrics(startDate, endDate, items, options?.topNProducts ?? 5),
      returns: getReturnMetrics(startDate, endDate, items),
      repeatCustomers: getCustomerMetrics(startDate, endDate, items),
      salesChannels: getChannelMetrics(startDate, endDate, items),
    };
  }

  return {
    referenceDate,
    dateRangeApplied: options?.dateRange,
    sales: calculateSalesPerformance(items),
    products: calculateBestSellingProducts(items, options?.topNProducts ?? 5),
    returns: calculateReturnMetrics(items),
    repeatCustomers: calculateRepeatCustomerMetrics(items),
    salesChannels: calculateSalesChannelMetrics(items),
  };
}

