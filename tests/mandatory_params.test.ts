import { describe, it, expect } from 'vitest';
import {
  getSalesMetrics,
  getProductMetrics,
  getReturnMetrics,
  getCustomerMetrics,
  getChannelMetrics,
} from '../src/metrics';
import { getPredefinedDateRange } from '../src/utils/date';
import { loadOrderHistory } from '../src/data/loader';

describe('Mandatory Function Parameters: startDate & endDate', () => {
  const items = loadOrderHistory().data;

  describe('Error handling when parameters are missing', () => {
    it('throws error if startDate or endDate is missing in getSalesMetrics', () => {
      // @ts-expect-error testing missing arguments
      expect(() => getSalesMetrics()).toThrow(/requires both startDate and endDate/);
      // @ts-expect-error testing missing arguments
      expect(() => getSalesMetrics('2025-10-01')).toThrow(/requires both startDate and endDate/);
    });

    it('throws error if startDate or endDate is missing in getProductMetrics', () => {
      // @ts-expect-error testing missing arguments
      expect(() => getProductMetrics()).toThrow(/requires both startDate and endDate/);
    });

    it('throws error if startDate or endDate is missing in getReturnMetrics', () => {
      // @ts-expect-error testing missing arguments
      expect(() => getReturnMetrics()).toThrow(/requires both startDate and endDate/);
    });

    it('throws error if startDate or endDate is missing in getCustomerMetrics', () => {
      // @ts-expect-error testing missing arguments
      expect(() => getCustomerMetrics()).toThrow(/requires both startDate and endDate/);
    });

    it('throws error if startDate or endDate is missing in getChannelMetrics', () => {
      // @ts-expect-error testing missing arguments
      expect(() => getChannelMetrics()).toThrow(/requires both startDate and endDate/);
    });
  });

  describe('Resolving relative date queries through date utility first', () => {
    it('evaluates Last Week (2025-10-20 to 2025-10-26) with explicit dates', () => {
      const { startDate, endDate } = getPredefinedDateRange('lastWeek');
      expect(startDate).toBe('2025-10-20');
      expect(endDate).toBe('2025-10-26');

      // 1. Sales
      const sales = getSalesMetrics(startDate, endDate, items);
      expect(sales.totalOrders).toBe(4);
      expect(sales.totalSales).toBe(543.5);

      // 2. Products
      const products = getProductMetrics(startDate, endDate, items);
      expect(products.topProductsByRevenue.length).toBeGreaterThan(0);

      // 3. Returns (general return activity occurring last week)
      // Returned in last week (2025-10-20 to 2025-10-26):
      // #2402 (2025-10-21), #2455 (2025-10-23), #2518 (2025-10-24), #2706 (2025-10-26) = 4 returns
      const returnsActivity = getReturnMetrics(startDate, endDate, items, 'returnDate');
      expect(returnsActivity.totalReturns).toBe(4);
      expect(returnsActivity.totalRefundAmount).toBe(792.15); // 219 + 135.15 + 219 + 219

      // Returns (orders placed last week that were subsequently returned)
      // Placed last week and returned: #3102 (ordered 2025-10-26, returned 2025-10-27) = 1 return
      const returnsPlaced = getReturnMetrics(startDate, endDate, items, 'orderDate');
      expect(returnsPlaced.totalReturns).toBe(1);
      expect(returnsPlaced.totalRefundAmount).toBe(74.0);

      // 4. Customers
      const customers = getCustomerMetrics(startDate, endDate, items);
      expect(customers.uniqueCustomers).toBe(4);

      // 5. Channels
      const channels = getChannelMetrics(startDate, endDate, items);
      expect(channels.channels.length).toBeGreaterThan(0);
      expect(channels.bestPerformingChannelByRevenue).toBe('Online Store');
    });

    it('evaluates Today (2025-10-27) with explicit dates', () => {
      const { startDate, endDate } = getPredefinedDateRange('today');
      expect(startDate).toBe('2025-10-27');
      expect(endDate).toBe('2025-10-27');

      const sales = getSalesMetrics(startDate, endDate, items);
      expect(sales.totalOrders).toBe(1);
      expect(sales.totalSales).toBe(182.2);
    });
  });
});
