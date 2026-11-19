import { describe, it, expect } from 'vitest';
import {
  calculateReturnMetrics,
  calculateTotalReturnedItems,
  calculateReturnedOrdersCount,
  calculateOrderReturnRate,
  calculateItemReturnRate,
  calculateTotalRefundAmount,
  getMostFrequentlyReturnedProducts,
  getReturnReasonsBreakdown,
} from '../src/metrics/returns';
import { loadOrderHistory } from '../src/data/loader';

describe('Metric Module 3: Returns & Refunds', () => {
  const items = loadOrderHistory().data;

  it('calculates total returns as 8 line items and 8 distinct orders', () => {
    const returnedItems = calculateTotalReturnedItems(items);
    const returnedOrders = calculateReturnedOrdersCount(items);

    expect(returnedItems).toBe(8);
    expect(returnedOrders).toBe(8);
  });

  it('calculates order return rate as 40.00% and item return rate as 28.57%', () => {
    // 8 returned orders out of 20 total orders = 40.00%
    const orderRate = calculateOrderReturnRate(items);
    expect(orderRate).toBe(40.0);

    // 8 returned items out of 28 total line items = 28.57%
    const itemRate = calculateItemReturnRate(items);
    expect(itemRate).toBe(28.57);
  });

  it('calculates total refund amount accurately as $1,116.94', () => {
    const refundTotal = calculateTotalRefundAmount(items);
    // 94.00 + 28.00 + 128.79 + 219.00 + 135.15 + 219.00 + 219.00 + 74.00 = 1116.94
    expect(refundTotal).toBe(1116.94);
  });

  it('identifies most frequently returned products accurately', () => {
    const returnedProducts = getMostFrequentlyReturnedProducts(items);

    // Most returned product is Alpine Down Parka with 3 returns ($657.00 refunded)
    expect(returnedProducts[0].productTitle).toBe('Alpine Down Parka');
    expect(returnedProducts[0].returnCount).toBe(3);
    expect(returnedProducts[0].refundAmount).toBe(657.0);

    // Second is Northridge Insulated Jacket with 2 returns ($263.94 refunded)
    expect(returnedProducts[1].productTitle).toBe('Northridge Insulated Jacket');
    expect(returnedProducts[1].returnCount).toBe(2);
    expect(returnedProducts[1].refundAmount).toBe(263.94);
  });

  it('breaks down return reasons with accurate counts, percentages, and dollar amounts', () => {
    const reasons = getReturnReasonsBreakdown(items);

    // Reasons present: Too large (2), Too small (2), Changed mind (2), Defective (1), Not as pictured (1)
    const reasonMap = new Map(reasons.map((r) => [r.reason, r]));

    expect(reasonMap.get('Too large')?.count).toBe(2);
    expect(reasonMap.get('Too large')?.percentage).toBe(25.0);

    expect(reasonMap.get('Too small')?.count).toBe(2);
    expect(reasonMap.get('Too small')?.percentage).toBe(25.0);

    expect(reasonMap.get('Changed mind')?.count).toBe(2);
    expect(reasonMap.get('Changed mind')?.percentage).toBe(25.0);

    expect(reasonMap.get('Defective')?.count).toBe(1);
    expect(reasonMap.get('Defective')?.percentage).toBe(12.5);

    expect(reasonMap.get('Not as pictured')?.count).toBe(1);
    expect(reasonMap.get('Not as pictured')?.percentage).toBe(12.5);

    // Total percentage of reasons sums to 100%
    const totalPercentage = reasons.reduce((acc, r) => acc + r.percentage, 0);
    expect(totalPercentage).toBe(100.0);

    // Total refund across reasons sums to 1116.94
    const totalRefundAcrossReasons = reasons.reduce((acc, r) => acc + r.totalRefund, 0);
    expect(Number(totalRefundAcrossReasons.toFixed(2))).toBe(1116.94);
  });

  it('handles empty datasets safely with zero return rate and no NaN', () => {
    const metrics = calculateReturnMetrics([]);
    expect(metrics.totalReturns).toBe(0);
    expect(metrics.returnedOrdersCount).toBe(0);
    expect(metrics.orderReturnRate).toBe(0);
    expect(metrics.itemReturnRate).toBe(0);
    expect(metrics.totalRefundAmount).toBe(0);
    expect(metrics.mostFrequentlyReturnedProducts).toEqual([]);
    expect(metrics.returnReasonsBreakdown).toEqual([]);
  });
});

