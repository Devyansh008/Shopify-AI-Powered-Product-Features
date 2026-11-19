/**
 * Metric Module 2: Best-Selling Products
 *
 * Computes:
 * - Top products ranked by total revenue generated
 * - Top products ranked by total units sold
 * - Product category performance (revenue, units, order counts, revenue share)
 */

import {
  BestSellingProductsMetrics,
  ProductCategoryMetric,
  ProductRevenueMetric,
  ProductUnitsMetric,
} from '../types/metrics';
import { OrderLineItem, ProductCategory } from '../types/order';
import { round, safePercentage } from '../utils/math';
import { calculateTotalSales } from './sales';
import { filterOrdersByDateRange } from '../utils/date';
import { getOrderItems } from '../data/loader';

/**
 * Returns products sorted by total revenue in descending order.
 */
export function getTopProductsByRevenue(
  items: OrderLineItem[],
  limit?: number
): ProductRevenueMetric[] {
  const map = new Map<
    string,
    { productTitle: string; category: ProductCategory; revenue: number; unitsSold: number }
  >();

  for (const item of items) {
    if (!map.has(item.productId)) {
      map.set(item.productId, {
        productTitle: item.productTitle,
        category: item.productCategory,
        revenue: 0,
        unitsSold: 0,
      });
    }
    const entry = map.get(item.productId)!;
    entry.revenue += item.lineTotal;
    entry.unitsSold += item.quantity;
  }

  const list: ProductRevenueMetric[] = Array.from(map.entries()).map(([productId, data]) => ({
    productId,
    productTitle: data.productTitle,
    category: data.category,
    revenue: round(data.revenue, 2),
    unitsSold: data.unitsSold,
  }));

  // Sort descending by revenue, break ties by units sold
  list.sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold);

  return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}

/**
 * Returns products sorted by total units sold in descending order.
 */
export function getTopProductsByUnits(
  items: OrderLineItem[],
  limit?: number
): ProductUnitsMetric[] {
  const map = new Map<
    string,
    { productTitle: string; category: ProductCategory; unitsSold: number; revenue: number }
  >();

  for (const item of items) {
    if (!map.has(item.productId)) {
      map.set(item.productId, {
        productTitle: item.productTitle,
        category: item.productCategory,
        unitsSold: 0,
        revenue: 0,
      });
    }
    const entry = map.get(item.productId)!;
    entry.unitsSold += item.quantity;
    entry.revenue += item.lineTotal;
  }

  const list: ProductUnitsMetric[] = Array.from(map.entries()).map(([productId, data]) => ({
    productId,
    productTitle: data.productTitle,
    category: data.category,
    unitsSold: data.unitsSold,
    revenue: round(data.revenue, 2),
  }));

  // Sort descending by units sold, break ties by revenue
  list.sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

  return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}

/**
 * Aggregates performance by product category.
 * Computes revenue, units sold, distinct orders containing category items, and share of total revenue.
 */
export function getCategoryPerformance(items: OrderLineItem[]): ProductCategoryMetric[] {
  const totalRevenue = calculateTotalSales(items);
  const catMap = new Map<
    ProductCategory,
    { revenue: number; unitsSold: number; orderIds: Set<string> }
  >();

  for (const item of items) {
    if (!catMap.has(item.productCategory)) {
      catMap.set(item.productCategory, {
        revenue: 0,
        unitsSold: 0,
        orderIds: new Set<string>(),
      });
    }
    const entry = catMap.get(item.productCategory)!;
    entry.revenue += item.lineTotal;
    entry.unitsSold += item.quantity;
    entry.orderIds.add(item.orderId);
  }

  const results: ProductCategoryMetric[] = Array.from(catMap.entries()).map(
    ([category, data]) => ({
      category,
      revenue: round(data.revenue, 2),
      unitsSold: data.unitsSold,
      orderCount: data.orderIds.size,
      revenueSharePercentage: safePercentage(data.revenue, totalRevenue, 2),
    })
  );

  // Sort by revenue descending
  results.sort((a, b) => b.revenue - a.revenue);

  return results;
}

/**
 * Aggregates all Best-Selling Product metrics.
 */
export function calculateBestSellingProducts(
  items: OrderLineItem[],
  topN: number = 5
): BestSellingProductsMetrics {
  return {
    topProductsByRevenue: getTopProductsByRevenue(items, topN),
    topProductsByUnits: getTopProductsByUnits(items, topN),
    categoryPerformance: getCategoryPerformance(items),
  };
}

/**
 * Mandatory top-level metric function.
 * Evaluates best-selling products within an exact, inclusive [startDate, endDate] window.
 * Filters on `orderDate`.
 */
export function getProductMetrics(
  startDate: string,
  endDate: string,
  items: OrderLineItem[] = getOrderItems(),
  topN: number = 5
): BestSellingProductsMetrics {
  if (!startDate || !endDate) {
    throw new Error('getProductMetrics requires both startDate and endDate to be explicitly supplied.');
  }

  const filtered = filterOrdersByDateRange(items, { startDate, endDate }, 'orderDate');
  return calculateBestSellingProducts(filtered, topN);
}

