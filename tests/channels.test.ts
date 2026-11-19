import { describe, it, expect } from 'vitest';
import {
  calculateSalesChannelMetrics,
  getChannelBreakdown,
  getBestPerformingChannelByRevenue,
  getBestPerformingChannelByOrders,
} from '../src/metrics/channels';
import { loadOrderHistory } from '../src/data/loader';

describe('Metric Module 5: Sales Channel Performance', () => {
  const items = loadOrderHistory().data;

  it('calculates performance across all 4 sales channels correctly', () => {
    const channels = getChannelBreakdown(items);

    expect(channels.map((c) => c.channel)).toEqual([
      'Online Store',
      'Shop app',
      'Point of Sale',
      'Instagram',
    ]);

    const channelMap = new Map(channels.map((c) => [c.channel, c]));

    // Online Store: $1,882.20 revenue, 11 orders, 18 units, AOV $171.11, 60.75% share
    const online = channelMap.get('Online Store')!;
    expect(online.revenue).toBe(1882.2);
    expect(online.orders).toBe(11);
    expect(online.units).toBe(18);
    expect(online.aov).toBe(171.11);
    expect(online.revenueSharePercentage).toBe(60.75);

    // Shop app: $501.15 revenue, 3 orders, 6 units, AOV $167.05, 16.17% share
    const shopApp = channelMap.get('Shop app')!;
    expect(shopApp.revenue).toBe(501.15);
    expect(shopApp.orders).toBe(3);
    expect(shopApp.units).toBe(6);
    expect(shopApp.aov).toBe(167.05);
    expect(shopApp.revenueSharePercentage).toBe(16.17);

    // Point of Sale: $408.00 revenue, 4 orders, 7 units, AOV $102.00, 13.17% share
    const pos = channelMap.get('Point of Sale')!;
    expect(pos.revenue).toBe(408.0);
    expect(pos.orders).toBe(4);
    expect(pos.units).toBe(7);
    expect(pos.aov).toBe(102.0);
    expect(pos.revenueSharePercentage).toBe(13.17);

    // Instagram: $307.00 revenue, 2 orders, 2 units, AOV $153.50, 9.91% share
    const insta = channelMap.get('Instagram')!;
    expect(insta.revenue).toBe(307.0);
    expect(insta.orders).toBe(2);
    expect(insta.units).toBe(2);
    expect(insta.aov).toBe(153.5);
    expect(insta.revenueSharePercentage).toBe(9.91);

    // Sum of channel revenues equals total sales $3,098.35
    const totalRev = channels.reduce((acc, c) => acc + c.revenue, 0);
    expect(Number(totalRev.toFixed(2))).toBe(3098.35);

    // Sum of channel orders equals 20 orders
    const totalOrders = channels.reduce((acc, c) => acc + c.orders, 0);
    expect(totalOrders).toBe(20);
  });

  it('identifies Online Store as best-performing channel by revenue and orders', () => {
    const bestByRevenue = getBestPerformingChannelByRevenue(items);
    const bestByOrders = getBestPerformingChannelByOrders(items);

    expect(bestByRevenue).toBe('Online Store');
    expect(bestByOrders).toBe('Online Store');
  });

  it('safely handles empty datasets without errors', () => {
    const metrics = calculateSalesChannelMetrics([]);
    expect(metrics.channels).toEqual([]);
    expect(metrics.bestPerformingChannelByRevenue).toBeNull();
    expect(metrics.bestPerformingChannelByOrders).toBeNull();
  });
});
