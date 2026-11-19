import { describe, it, expect } from 'vitest';
import { computeDashboardMetrics } from '../src/metrics';
import { loadOrderHistory } from '../src/data/loader';
import { getPredefinedDateRange } from '../src/utils/date';

describe('Dashboard Metrics Engine Integration', () => {
  const items = loadOrderHistory().data;

  it('computes full unconstrained dashboard metrics accurately', () => {
    const dashboard = computeDashboardMetrics(items);

    expect(dashboard.referenceDate).toBe('2025-10-27');
    expect(dashboard.sales.totalSales).toBe(3098.35);
    expect(dashboard.sales.totalOrders).toBe(20);
    expect(dashboard.sales.averageOrderValue).toBe(154.92);

    expect(dashboard.products.topProductsByRevenue[0].productTitle).toBe('Alpine Down Parka');
    expect(dashboard.returns.totalReturns).toBe(8);
    expect(dashboard.repeatCustomers.repeatCustomerCount).toBe(7);
    expect(dashboard.salesChannels.bestPerformingChannelByRevenue).toBe('Online Store');
  });

  it('filters dashboard metrics for "lastWeek" (2025-10-20 to 2025-10-26)', () => {
    const lastWeekRange = getPredefinedDateRange('lastWeek');
    const dashboard = computeDashboardMetrics(items, { dateRange: lastWeekRange });

    expect(dashboard.sales.totalOrders).toBe(4);
    // Last week orders:
    // #2917 (159.00), #2988 (197.10 + 41.40 = 238.50), #3054 (72.00), #3102 (74.00) = 543.50
    expect(dashboard.sales.totalSales).toBe(543.5);
    expect(dashboard.sales.averageOrderValue).toBe(135.88);
  });

  it('filters dashboard metrics for "today" (2025-10-27)', () => {
    const todayRange = getPredefinedDateRange('today');
    const dashboard = computeDashboardMetrics(items, { dateRange: todayRange });

    // Order #3149 on 2025-10-27: 2 line items, total $182.20
    expect(dashboard.sales.totalOrders).toBe(1);
    expect(dashboard.sales.totalSales).toBe(182.2);
    expect(dashboard.sales.averageOrderValue).toBe(182.2);
  });
});

