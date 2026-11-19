/**
 * Metric Module 5: Sales Channel Performance
 *
 * Computes:
 * - Revenue by sales channel
 * - Unique orders by sales channel (preventing duplicate counting of multi-line orders)
 * - Units sold by sales channel
 * - Average Order Value (AOV) per channel
 * - Revenue share percentage
 * - Identification of best-performing channel (by revenue and by order volume)
 */

import { ChannelMetric, SalesChannelMetrics } from '../types/metrics';
import { OrderLineItem, SalesChannel } from '../types/order';
import { round, safeDivide, safePercentage } from '../utils/math';
import { calculateTotalSales } from './sales';

/**
 * Aggregates performance by sales channel.
 */
export function getChannelBreakdown(items: OrderLineItem[]): ChannelMetric[] {
  const totalRevenue = calculateTotalSales(items);
  const channelMap = new Map<
    SalesChannel,
    { revenue: number; orderIds: Set<string>; units: number }
  >();

  for (const item of items) {
    if (!channelMap.has(item.salesChannel)) {
      channelMap.set(item.salesChannel, {
        revenue: 0,
        orderIds: new Set<string>(),
        units: 0,
      });
    }
    const entry = channelMap.get(item.salesChannel)!;
    entry.revenue += item.lineTotal;
    entry.orderIds.add(item.orderId);
    entry.units += item.quantity;
  }

  const results: ChannelMetric[] = Array.from(channelMap.entries()).map(([channel, data]) => {
    const revenue = round(data.revenue, 2);
    const orders = data.orderIds.size;
    const aov = round(safeDivide(revenue, orders, 0), 2);
    const revenueSharePercentage = safePercentage(revenue, totalRevenue, 2);

    return {
      channel,
      revenue,
      orders,
      units: data.units,
      aov,
      revenueSharePercentage,
    };
  });

  // Sort descending by revenue
  results.sort((a, b) => b.revenue - a.revenue);

  return results;
}

/**
 * Identifies the channel with the highest total revenue.
 */
export function getBestPerformingChannelByRevenue(items: OrderLineItem[]): SalesChannel | null {
  const channels = getChannelBreakdown(items);
  return channels.length > 0 ? channels[0].channel : null;
}

/**
 * Identifies the channel with the highest unique order count.
 */
export function getBestPerformingChannelByOrders(items: OrderLineItem[]): SalesChannel | null {
  const channels = getChannelBreakdown(items);
  if (channels.length === 0) return null;
  const sorted = [...channels].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);
  return sorted[0].channel;
}

/**
 * Aggregates all Sales Channel Performance metrics.
 */
export function calculateSalesChannelMetrics(items: OrderLineItem[]): SalesChannelMetrics {
  const channels = getChannelBreakdown(items);
  const bestPerformingChannelByRevenue = channels.length > 0 ? channels[0].channel : null;

  let bestPerformingChannelByOrders: SalesChannel | null = null;
  if (channels.length > 0) {
    const byOrders = [...channels].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);
    bestPerformingChannelByOrders = byOrders[0].channel;
  }

  return {
    channels,
    bestPerformingChannelByRevenue,
    bestPerformingChannelByOrders,
  };
}
