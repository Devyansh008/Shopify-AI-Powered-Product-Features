import { describe, it, expect } from 'vitest';
import {
  calculateBestSellingProducts,
  getTopProductsByRevenue,
  getTopProductsByUnits,
  getCategoryPerformance,
} from '../src/metrics/products';
import { loadOrderHistory } from '../src/data/loader';

describe('Metric Module 2: Best-Selling Products', () => {
  const items = loadOrderHistory().data;

  it('ranks top products by revenue correctly', () => {
    const topRevenue = getTopProductsByRevenue(items);

    // Number 1 product by revenue is Alpine Down Parka (P-1001) with $854.10
    expect(topRevenue[0].productId).toBe('P-1001');
    expect(topRevenue[0].productTitle).toBe('Alpine Down Parka');
    expect(topRevenue[0].revenue).toBe(854.1);
    expect(topRevenue[0].unitsSold).toBe(4);

    // Number 2 is Northridge Insulated Jacket (P-1002) with $596.25
    expect(topRevenue[1].productId).toBe('P-1002');
    expect(topRevenue[1].productTitle).toBe('Northridge Insulated Jacket');
    expect(topRevenue[1].revenue).toBe(596.25);
    expect(topRevenue[1].unitsSold).toBe(4);

    // Number 3 is Selvedge Slim Jeans (P-1008) with $436.60
    expect(topRevenue[2].productId).toBe('P-1008');
    expect(topRevenue[2].productTitle).toBe('Selvedge Slim Jeans');
    expect(topRevenue[2].revenue).toBe(436.6);

    // Total revenue across all products matches total sales
    const sumRevenue = topRevenue.reduce((acc, p) => acc + p.revenue, 0);
    expect(Number(sumRevenue.toFixed(2))).toBe(3098.35);
  });

  it('ranks top products by units sold correctly with tie-breaking', () => {
    const topUnits = getTopProductsByUnits(items);

    // Multiple products have 4 units sold (P-1001, P-1002, P-1008, P-1006, P-1010)
    const topFourUnitProducts = topUnits.slice(0, 5);
    for (const p of topFourUnitProducts) {
      expect(p.unitsSold).toBe(4);
    }

    // Tie-breaker by revenue places Alpine Down Parka first among the 4-unit items
    expect(topFourUnitProducts[0].productId).toBe('P-1001');
    expect(topFourUnitProducts[0].revenue).toBe(854.1);

    // Total units across all products equals 33
    const totalUnits = topUnits.reduce((acc, p) => acc + p.unitsSold, 0);
    expect(totalUnits).toBe(33);
  });

  it('calculates category performance and revenue share percentages correctly', () => {
    const categories = getCategoryPerformance(items);

    expect(categories.map((c) => c.category)).toEqual([
      'Outerwear',
      'Bottoms',
      'Knitwear',
      'Accessories',
      'Tops',
    ]);

    // Outerwear is top category with $1,638.35 (52.88% share)
    const outerwear = categories[0];
    expect(outerwear.revenue).toBe(1638.35);
    expect(outerwear.unitsSold).toBe(10);
    expect(outerwear.revenueSharePercentage).toBe(52.88);

    // Bottoms is second with $658.60 (21.26% share)
    const bottoms = categories[1];
    expect(bottoms.revenue).toBe(658.6);
    expect(bottoms.unitsSold).toBe(7);
    expect(bottoms.revenueSharePercentage).toBe(21.26);

    // Sum of shares is approx 100%
    const totalShare = categories.reduce((acc, c) => acc + c.revenueSharePercentage, 0);
    expect(Math.round(totalShare)).toBe(100);
  });

  it('handles empty input gracefully', () => {
    const result = calculateBestSellingProducts([]);
    expect(result.topProductsByRevenue).toEqual([]);
    expect(result.topProductsByUnits).toEqual([]);
    expect(result.categoryPerformance).toEqual([]);
  });
});

