import { describe, it, expect } from 'vitest';
import {
  calculateRepeatCustomerMetrics,
  calculateUniqueCustomers,
  calculateRepeatCustomerCount,
  calculateRepeatCustomerPercentage,
  calculateRepeatCustomerSales,
  calculateFirstTimeSales,
  getCustomerSummaries,
} from '../src/metrics/customers';
import { loadOrderHistory } from '../src/data/loader';

describe('Metric Module 4: Repeat Customer Performance', () => {
  const items = loadOrderHistory().data;

  it('calculates 18 unique customers in the dataset', () => {
    const unique = calculateUniqueCustomers(items);
    expect(unique).toBe(18);
  });

  it('identifies 7 repeat customers (38.89% repeat customer rate)', () => {
    const repeatCount = calculateRepeatCustomerCount(items);
    const repeatPercentage = calculateRepeatCustomerPercentage(items);

    expect(repeatCount).toBe(7);
    // (7 / 18) * 100 = 38.888... -> 38.89%
    expect(repeatPercentage).toBe(38.89);
  });

  it('calculates sales contribution from repeat vs first-time customers', () => {
    const repeatSales = calculateRepeatCustomerSales(items);
    const firstTimeSales = calculateFirstTimeSales(items);

    expect(repeatSales).toBe(1129.65);
    expect(firstTimeSales).toBe(1968.7);

    // Sum equals total sales 3098.35
    expect(Number((repeatSales + firstTimeSales).toFixed(2))).toBe(3098.35);

    const metrics = calculateRepeatCustomerMetrics(items);
    // 1129.65 / 3098.35 = 36.46%
    expect(metrics.repeatCustomerSalesPercentage).toBe(36.46);
    // 1968.70 / 3098.35 = 63.54%
    expect(metrics.firstTimeSalesPercentage).toBe(63.54);
  });

  it('tracks individual customer spend and order history correctly', () => {
    const summaries = getCustomerSummaries(items);
    expect(summaries).toHaveLength(18);

    // Customer C-10642 made 2 orders:
    // Order #2455 ($135.15) and Order #2917 ($159.00) = $294.15
    const cust10642 = summaries.find((c) => c.customerId === 'C-10642');
    expect(cust10642).toBeDefined();
    expect(cust10642?.orderCount).toBe(2);
    expect(cust10642?.totalSpend).toBe(294.15);
    expect(cust10642?.isRepeatCustomer).toBe(true);
  });

  it('safely handles empty datasets without division by zero errors', () => {
    const metrics = calculateRepeatCustomerMetrics([]);
    expect(metrics.uniqueCustomers).toBe(0);
    expect(metrics.repeatCustomerCount).toBe(0);
    expect(metrics.repeatCustomerPercentage).toBe(0);
    expect(metrics.repeatCustomerSales).toBe(0);
    expect(metrics.repeatCustomerSalesPercentage).toBe(0);
    expect(metrics.firstTimeSales).toBe(0);
    expect(metrics.firstTimeSalesPercentage).toBe(0);
    expect(metrics.customerBreakdown).toEqual([]);
  });
});
