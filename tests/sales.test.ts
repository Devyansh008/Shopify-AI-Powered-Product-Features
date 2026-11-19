import { describe, it, expect } from 'vitest';
import {
  calculateSalesPerformance,
  calculateTotalSales,
  calculateGrossSales,
  calculateTotalDiscounts,
  calculateNetSales,
  calculateTotalOrders,
  calculateAverageOrderValue,
  calculateSalesOverTime,
  calculateMonthlySales,
} from '../src/metrics/sales';
import { loadOrderHistory } from '../src/data/loader';
import { OrderLineItem } from '../src/types/order';

describe('Metric Module 1: Sales Performance', () => {
  const items = loadOrderHistory().data;

  it('calculates total sales accurately as $3,098.35', () => {
    const totalSales = calculateTotalSales(items);
    expect(totalSales).toBe(3098.35);
  });

  it('calculates gross sales as $3,216.00 and discounts as $117.65', () => {
    const grossSales = calculateGrossSales(items);
    const discounts = calculateTotalDiscounts(items);

    expect(grossSales).toBe(3216.0);
    expect(discounts).toBe(117.65);
    expect(Number((grossSales - discounts).toFixed(2))).toBe(3098.35);
  });

  it('calculates net sales (total sales - refunds) as $1,981.41', () => {
    const netSales = calculateNetSales(items);
    // Total sales 3098.35 - Total refunds 1116.94 = 1981.41
    expect(netSales).toBe(1981.41);
  });

  it('distinguishes between order count (20) and line-item count (28)', () => {
    const totalOrders = calculateTotalOrders(items);
    expect(totalOrders).toBe(20);
    expect(items.length).toBe(28);

    // Multi-line orders such as #1047, #1342, #2402, #2571, #2846, #2988, #3149
    // must be counted as single orders
    const order1047Lines = items.filter((i) => i.orderId === '#1047');
    expect(order1047Lines.length).toBe(2);
    expect(calculateTotalOrders(order1047Lines)).toBe(1);
  });

  it('calculates Average Order Value (AOV) as $154.92', () => {
    const aov = calculateAverageOrderValue(items);
    // 3098.35 / 20 = 154.9175 -> 154.92
    expect(aov).toBe(154.92);
  });

  it('safely handles empty datasets without throwing or returning NaN', () => {
    const emptyItems: OrderLineItem[] = [];
    const aov = calculateAverageOrderValue(emptyItems);
    const total = calculateTotalSales(emptyItems);
    const orders = calculateTotalOrders(emptyItems);

    expect(aov).toBe(0);
    expect(total).toBe(0);
    expect(orders).toBe(0);

    const perf = calculateSalesPerformance(emptyItems);
    expect(perf.totalSales).toBe(0);
    expect(perf.averageOrderValue).toBe(0);
    expect(perf.salesOverTime).toEqual([]);
    expect(perf.monthlySales).toEqual([]);
  });

  it('calculates chronological monthly sales and month-over-month comparisons', () => {
    const monthly = calculateMonthlySales(items);

    expect(monthly).toHaveLength(6);
    expect(monthly.map((m) => m.month)).toEqual([
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
    ]);

    // May 2025: 2 orders, $224.00 sales
    expect(monthly[0].sales).toBe(224.0);
    expect(monthly[0].orders).toBe(2);
    expect(monthly[0].aov).toBe(112.0);
    expect(monthly[0].monthOverMonthGrowth).toBeNull(); // baseline month

    // June 2025: 1 order, $162.00 sales
    expect(monthly[1].sales).toBe(162.0);
    expect(monthly[1].orders).toBe(1);
    expect(monthly[1].aov).toBe(162.0);
    // Growth from May (224) to June (162): (162 - 224) / 224 = -27.68%
    expect(monthly[1].monthOverMonthGrowth).toBe(-27.68);

    // October 2025: 13 orders, $2,261.25 sales
    const oct = monthly[5];
    expect(oct.sales).toBe(2261.25);
    expect(oct.orders).toBe(13);
    expect(oct.aov).toBe(173.94);
  });

  it('aggregates daily sales points for sales over time charts', () => {
    const daily = calculateSalesOverTime(items);
    // Total sales across all daily points must sum to total sales
    const sumDaily = daily.reduce((acc, d) => acc + d.sales, 0);
    expect(Number(sumDaily.toFixed(2))).toBe(3098.35);

    // Order #3149 on 2025-10-27 has 2 lines: $94.00 + $88.20 = $182.20
    const todayData = daily.find((d) => d.date === '2025-10-27');
    expect(todayData).toBeDefined();
    expect(todayData?.sales).toBe(182.2);
    expect(todayData?.orders).toBe(1);
    expect(todayData?.units).toBe(2);
  });
});
