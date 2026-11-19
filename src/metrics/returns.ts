/**
 * Metric Module 3: Returns & Refunds
 *
 * Computes:
 * - Total returns (returned line items and returned orders)
 * - Return rate (order return rate and line item return rate)
 * - Total refund amount
 * - Most frequently returned products (ranked by return frequency)
 * - Return reasons breakdown (counts, percentages, and dollar amounts)
 */

import { ReturnMetrics, ReturnReasonBreakdown, ReturnedProductSummary } from '../types/metrics';
import { OrderLineItem } from '../types/order';
import { round, safePercentage } from '../utils/math';
import { calculateTotalOrders } from './sales';

/**
 * Returns all line items that were marked as returned.
 */
export function getReturnedLineItems(items: OrderLineItem[]): OrderLineItem[] {
  return items.filter((item) => item.returned);
}

/**
 * Calculates total count of returned line items.
 */
export function calculateTotalReturnedItems(items: OrderLineItem[]): number {
  return getReturnedLineItems(items).length;
}

/**
 * Calculates total count of distinct orders that had at least one returned item.
 */
export function calculateReturnedOrdersCount(items: OrderLineItem[]): number {
  const returnedOrders = new Set<string>();
  for (const item of items) {
    if (item.returned) {
      returnedOrders.add(item.orderId);
    }
  }
  return returnedOrders.size;
}

/**
 * Calculates the order return rate as a percentage: (returnedOrders / totalOrders) * 100.
 */
export function calculateOrderReturnRate(items: OrderLineItem[]): number {
  const totalOrders = calculateTotalOrders(items);
  const returnedOrders = calculateReturnedOrdersCount(items);
  return safePercentage(returnedOrders, totalOrders, 2);
}

/**
 * Calculates the line item return rate as a percentage: (returnedLineItems / totalLineItems) * 100.
 */
export function calculateItemReturnRate(items: OrderLineItem[]): number {
  const totalItems = items.length;
  const returnedItems = calculateTotalReturnedItems(items);
  return safePercentage(returnedItems, totalItems, 2);
}

/**
 * Calculates the total monetary amount refunded across returned items.
 */
export function calculateTotalRefundAmount(items: OrderLineItem[]): number {
  const total = items.reduce((acc, item) => {
    return item.returned && item.refundAmount !== null ? acc + item.refundAmount : acc;
  }, 0);
  return round(total, 2);
}

/**
 * Ranks products by how often they were returned.
 */
export function getMostFrequentlyReturnedProducts(items: OrderLineItem[]): ReturnedProductSummary[] {
  const returnMap = new Map<
    string,
    { productTitle: string; returnCount: number; refundAmount: number }
  >();

  for (const item of items) {
    if (!item.returned) continue;

    if (!returnMap.has(item.productId)) {
      returnMap.set(item.productId, {
        productTitle: item.productTitle,
        returnCount: 0,
        refundAmount: 0,
      });
    }

    const entry = returnMap.get(item.productId)!;
    entry.returnCount += 1;
    if (item.refundAmount !== null) {
      entry.refundAmount += item.refundAmount;
    }
  }

  const results: ReturnedProductSummary[] = Array.from(returnMap.entries()).map(
    ([productId, data]) => ({
      productId,
      productTitle: data.productTitle,
      returnCount: data.returnCount,
      refundAmount: round(data.refundAmount, 2),
    })
  );

  // Sort by return count descending, then refund amount descending
  results.sort((a, b) => b.returnCount - a.returnCount || b.refundAmount - a.refundAmount);

  return results;
}

/**
 * Breaks down returns by stated reason.
 */
export function getReturnReasonsBreakdown(items: OrderLineItem[]): ReturnReasonBreakdown[] {
  const returnedItems = getReturnedLineItems(items);
  const totalReturned = returnedItems.length;

  const reasonMap = new Map<string, { count: number; totalRefund: number }>();

  for (const item of returnedItems) {
    const reason = item.returnReason || 'Unspecified';
    if (!reasonMap.has(reason)) {
      reasonMap.set(reason, { count: 0, totalRefund: 0 });
    }
    const entry = reasonMap.get(reason)!;
    entry.count += 1;
    if (item.refundAmount !== null) {
      entry.totalRefund += item.refundAmount;
    }
  }

  const results: ReturnReasonBreakdown[] = Array.from(reasonMap.entries()).map(
    ([reason, data]) => ({
      reason,
      count: data.count,
      percentage: safePercentage(data.count, totalReturned, 2),
      totalRefund: round(data.totalRefund, 2),
    })
  );

  // Sort by count descending
  results.sort((a, b) => b.count - a.count || b.totalRefund - a.totalRefund);

  return results;
}

/**
 * Aggregates all Returns & Refunds metrics.
 */
export function calculateReturnMetrics(items: OrderLineItem[]): ReturnMetrics {
  const totalReturns = calculateTotalReturnedItems(items);
  const returnedOrdersCount = calculateReturnedOrdersCount(items);
  const orderReturnRate = calculateOrderReturnRate(items);
  const itemReturnRate = calculateItemReturnRate(items);
  const totalRefundAmount = calculateTotalRefundAmount(items);
  const mostFrequentlyReturnedProducts = getMostFrequentlyReturnedProducts(items);
  const returnReasonsBreakdown = getReturnReasonsBreakdown(items);

  return {
    totalReturns,
    returnedOrdersCount,
    orderReturnRate,
    itemReturnRate,
    totalRefundAmount,
    mostFrequentlyReturnedProducts,
    returnReasonsBreakdown,
  };
}
