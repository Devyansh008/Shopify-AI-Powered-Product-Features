/**
 * Metric Module 1: Sales Performance
 *
 * Computes:
 * - Total sales (sum of line_total)
 * - Gross sales (sum of unit_price * quantity)
 * - Total discounts (sum of discount_amount)
 * - Net sales (totalSales - totalRefunds)
 * - Total orders (unique order_id count, preventing duplicate counting across line items)
 * - Average order value (AOV = totalSales / totalOrders, with safe 0 handling)
 * - Sales over time (daily aggregate)
 * - Monthly sales comparisons (monthly totals and MoM growth rate)
 */

import { DailySalesPoint, MonthlySalesPoint, SalesPerformanceMetrics } from '../types/metrics';
import { OrderLineItem } from '../types/order';
import { round, safeDivide, safePercentage } from '../utils/math';

/**
 * Calculates total sales (net of item discounts, before refunds).
 */
export function calculateTotalSales(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.lineTotal, 0);
  return round(sum, 2);
}

/**
 * Calculates gross sales before discounts (quantity * unitPrice).
 */
export function calculateGrossSales(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  return round(sum, 2);
}

/**
 * Calculates total discounts applied.
 */
export function calculateTotalDiscounts(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.discountAmount, 0);
  return round(sum, 2);
}

/**
 * Calculates total refunds issued from returned items.
 */
export function calculateTotalRefunds(items: OrderLineItem[]): number {
  const sum = items.reduce((acc, item) => {
    return item.returned && item.refundAmount !== null ? acc + item.refundAmount : acc;
  }, 0);
  return round(sum, 2);
}

/**
 * Calculates net sales (total sales minus total refunds).
 */
export function calculateNetSales(items: OrderLineItem[]): number {
  const totalSales = calculateTotalSales(items);
  const totalRefunds = calculateTotalRefunds(items);
  return round(totalSales - totalRefunds, 2);
}

/**
 * Calculates the number of unique orders.
 * Prevents double-counting when multiple line items share the same order_id.
 */
export function calculateTotalOrders(items: OrderLineItem[]): number {
  const uniqueOrderIds = new Set<string>();
  for (const item of items) {
    uniqueOrderIds.add(item.orderId);
  }
  return uniqueOrderIds.size;
}

/**
 * Calculates the total units of products sold across all line items.
 */
export function calculateTotalUnitsSold(items: OrderLineItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

/**
 * Calculates Average Order Value (AOV).
 * Uses unique order count as the denominator.
 * Returns 0 if total orders is 0.
 */
export function calculateAverageOrderValue(items: OrderLineItem[]): number {
  const totalSales = calculateTotalSales(items);
  const totalOrders = calculateTotalOrders(items);
  return round(safeDivide(totalSales, totalOrders, 0), 2);
}

/**
 * Groups sales by day for time-series charts.
 * Returns an array sorted chronologically by date.
 */
export function calculateSalesOverTime(items: OrderLineItem[]): DailySalesPoint[] {
  const dayMap = new Map<string, { sales: number; orderIds: Set<string>; units: number }>();

  for (const item of items) {
    const date = item.orderDate;
    if (!dayMap.has(date)) {
      dayMap.set(date, { sales: 0, orderIds: new Set<string>(), units: 0 });
    }
    const entry = dayMap.get(date)!;
    entry.sales += item.lineTotal;
    entry.orderIds.add(item.orderId);
    entry.units += item.quantity;
  }

  const sortedDates = Array.from(dayMap.keys()).sort();

  return sortedDates.map((date) => {
    const entry = dayMap.get(date)!;
    return {
      date,
      sales: round(entry.sales, 2),
      orders: entry.orderIds.size,
      units: entry.units,
    };
  });
}

/**
 * Groups sales by month (YYYY-MM) and computes month-over-month comparisons.
 */
export function calculateMonthlySales(items: OrderLineItem[]): MonthlySalesPoint[] {
  const monthMap = new Map<string, { sales: number; orderIds: Set<string>; units: number }>();

  for (const item of items) {
    const month = item.orderDate.slice(0, 7); // 'YYYY-MM'
    if (!monthMap.has(month)) {
      monthMap.set(month, { sales: 0, orderIds: new Set<string>(), units: 0 });
    }
    const entry = monthMap.get(month)!;
    entry.sales += item.lineTotal;
    entry.orderIds.add(item.orderId);
    entry.units += item.quantity;
  }

  const sortedMonths = Array.from(monthMap.keys()).sort();

  let previousMonthSales: number | null = null;

  return sortedMonths.map((month) => {
    const entry = monthMap.get(month)!;
    const sales = round(entry.sales, 2);
    const orders = entry.orderIds.size;
    const aov = round(safeDivide(sales, orders, 0), 2);

    let monthOverMonthGrowth: number | null = null;
    if (previousMonthSales !== null) {
      if (previousMonthSales === 0) {
        monthOverMonthGrowth = sales > 0 ? 100 : 0;
      } else {
        monthOverMonthGrowth = safePercentage(sales - previousMonthSales, previousMonthSales, 2);
      }
    }

    previousMonthSales = sales;

    return {
      month,
      sales,
      orders,
      units: entry.units,
      aov,
      monthOverMonthGrowth,
    };
  });
}

/**
 * Aggregates all Sales Performance metrics into a single cohesive result.
 */
export function calculateSalesPerformance(items: OrderLineItem[]): SalesPerformanceMetrics {
  const totalSales = calculateTotalSales(items);
  const grossSales = calculateGrossSales(items);
  const totalDiscounts = calculateTotalDiscounts(items);
  const netSales = calculateNetSales(items);
  const totalOrders = calculateTotalOrders(items);
  const totalLineItems = items.length;
  const totalUnitsSold = calculateTotalUnitsSold(items);
  const averageOrderValue = calculateAverageOrderValue(items);
  const salesOverTime = calculateSalesOverTime(items);
  const monthlySales = calculateMonthlySales(items);

  return {
    totalSales,
    grossSales,
    totalDiscounts,
    netSales,
    totalOrders,
    totalLineItems,
    totalUnitsSold,
    averageOrderValue,
    salesOverTime,
    monthlySales,
  };
}
