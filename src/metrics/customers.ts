/**
 * Metric Module 4: Repeat Customer Performance
 *
 * Computes:
 * - Unique customer count
 * - Repeat customer count (customers flagged as repeat buyers)
 * - Repeat customer percentage (repeat customers / unique customers)
 * - Sales contribution from repeat customers (dollar amount and percentage share)
 * - Sales contribution from first-time customers
 * - Per-customer summary breakdown
 */

import { CustomerSummary, RepeatCustomerMetrics } from '../types/metrics';
import { OrderLineItem } from '../types/order';
import { round, safePercentage } from '../utils/math';
import { calculateTotalSales } from './sales';
import { filterOrdersByDateRange } from '../utils/date';
import { getOrderItems } from '../data/loader';

/**
 * Returns the count of distinct customer IDs.
 */
export function calculateUniqueCustomers(items: OrderLineItem[]): number {
  const customerIds = new Set<string>();
  for (const item of items) {
    customerIds.add(item.customerId);
  }
  return customerIds.size;
}

/**
 * Returns the count of unique customers who are marked as repeat customers.
 */
export function calculateRepeatCustomerCount(items: OrderLineItem[]): number {
  const repeatCustomerIds = new Set<string>();
  for (const item of items) {
    if (item.isRepeatCustomer) {
      repeatCustomerIds.add(item.customerId);
    }
  }
  return repeatCustomerIds.size;
}

/**
 * Returns the percentage of unique customers who are repeat customers.
 */
export function calculateRepeatCustomerPercentage(items: OrderLineItem[]): number {
  const uniqueCount = calculateUniqueCustomers(items);
  const repeatCount = calculateRepeatCustomerCount(items);
  return safePercentage(repeatCount, uniqueCount, 2);
}

/**
 * Calculates sales from line items where `isRepeatCustomer === true`.
 */
export function calculateRepeatCustomerSales(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => {
    return item.isRepeatCustomer ? acc + item.lineTotal : acc;
  }, 0);
  return round(sum, 2);
}

/**
 * Calculates sales from line items where `isRepeatCustomer === false`.
 */
export function calculateFirstTimeSales(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => {
    return !item.isRepeatCustomer ? acc + item.lineTotal : acc;
  }, 0);
  return round(sum, 2);
}

/**
 * Compiles a breakdown for each unique customer.
 */
export function getCustomerSummaries(items: OrderLineItem[]): CustomerSummary[] {
  const map = new Map<
    string,
    { orderIds: Set<string>; totalSpend: number; isRepeatCustomer: boolean }
  >();

  for (const item of items) {
    if (!map.has(item.customerId)) {
      map.set(item.customerId, {
        orderIds: new Set<string>(),
        totalSpend: 0,
        isRepeatCustomer: false,
      });
    }
    const entry = map.get(item.customerId)!;
    entry.orderIds.add(item.orderId);
    entry.totalSpend += item.lineTotal;
    if (item.isRepeatCustomer) {
      entry.isRepeatCustomer = true;
    }
  }

  const summaries: CustomerSummary[] = Array.from(map.entries()).map(([customerId, data]) => ({
    customerId,
    orderCount: data.orderIds.size,
    totalSpend: round(data.totalSpend, 2),
    isRepeatCustomer: data.isRepeatCustomer,
  }));

  // Sort descending by total spend
  summaries.sort((a, b) => b.totalSpend - a.totalSpend);

  return summaries;
}

/**
 * Aggregates all Repeat Customer Performance metrics.
 */
export function calculateRepeatCustomerMetrics(items: OrderLineItem[]): RepeatCustomerMetrics {
  const totalSales = calculateTotalSales(items);
  const uniqueCustomers = calculateUniqueCustomers(items);
  const repeatCustomerCount = calculateRepeatCustomerCount(items);
  const repeatCustomerPercentage = calculateRepeatCustomerPercentage(items);
  const repeatCustomerSales = calculateRepeatCustomerSales(items);
  const repeatCustomerSalesPercentage = safePercentage(repeatCustomerSales, totalSales, 2);
  const firstTimeSales = calculateFirstTimeSales(items);
  const firstTimeSalesPercentage = safePercentage(firstTimeSales, totalSales, 2);
  const customerBreakdown = getCustomerSummaries(items);

  return {
    uniqueCustomers,
    repeatCustomerCount,
    repeatCustomerPercentage,
    repeatCustomerSales,
    repeatCustomerSalesPercentage,
    firstTimeSales,
    firstTimeSalesPercentage,
    customerBreakdown,
  };
}

/**
 * Mandatory top-level metric function.
 * Evaluates repeat customer performance within an exact, inclusive [startDate, endDate] window.
 * Filters on `orderDate`.
 */
export function getCustomerMetrics(
  startDate: string,
  endDate: string,
  items: OrderLineItem[] = getOrderItems()
): RepeatCustomerMetrics {
  if (!startDate || !endDate) {
    throw new Error('getCustomerMetrics requires both startDate and endDate to be explicitly supplied.');
  }

  const filtered = filterOrdersByDateRange(items, { startDate, endDate }, 'orderDate');
  return calculateRepeatCustomerMetrics(filtered);
}

