import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REFERENCE_DATE,
  getPredefinedDateRanges,
  getPredefinedDateRange,
  normalizeDateRange,
  isDateInRange,
  filterOrdersByDateRange,
} from '../src/utils/date';
import { loadOrderHistory } from '../src/data/loader';

describe('Date Interpretation Utilities (Reference Date: Oct 27, 2025)', () => {
  const ranges = getPredefinedDateRanges(DEFAULT_REFERENCE_DATE);

  it('defines Today as October 27, 2025', () => {
    expect(ranges.today).toEqual({
      startDate: '2025-10-27',
      endDate: '2025-10-27',
      label: 'Today',
    });
  });

  it('defines Yesterday as October 26, 2025', () => {
    expect(ranges.yesterday).toEqual({
      startDate: '2025-10-26',
      endDate: '2025-10-26',
      label: 'Yesterday',
    });
  });

  it('defines Last Week as Monday October 20 to Sunday October 26, 2025', () => {
    expect(ranges.lastWeek).toEqual({
      startDate: '2025-10-20',
      endDate: '2025-10-26',
      label: 'Last Week',
    });
  });

  it('defines This Week starting Monday October 27, 2025, capped at the reference date', () => {
    expect(ranges.thisWeek).toEqual({
      startDate: '2025-10-27',
      endDate: '2025-10-27',
      label: 'This Week',
    });
  });

  it('defines This Month as October 1 to October 27, 2025 (capped at reference date)', () => {
    expect(ranges.thisMonth).toEqual({
      startDate: '2025-10-01',
      endDate: '2025-10-27',
      label: 'This Month',
    });
  });

  it('defines Last Month as September 1 to September 30, 2025', () => {
    expect(ranges.lastMonth).toEqual({
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      label: 'Last Month',
    });
  });

  it('caps custom ranges so dates beyond the reference date are never included', () => {
    const range = normalizeDateRange({
      startDate: '2025-10-25',
      endDate: '2025-11-15',
    });

    expect(range.startDate).toBe('2025-10-25');
    expect(range.endDate).toBe('2025-10-27');
  });

  it('correctly checks inclusive date ranges', () => {
    const range = ranges.lastWeek; // 2025-10-20 to 2025-10-26
    expect(isDateInRange('2025-10-19', range)).toBe(false);
    expect(isDateInRange('2025-10-20', range)).toBe(true);
    expect(isDateInRange('2025-10-23', range)).toBe(true);
    expect(isDateInRange('2025-10-26', range)).toBe(true);
    expect(isDateInRange('2025-10-27', range)).toBe(false);
  });

  it('filters dataset by orderDate for order-placement queries', () => {
    const items = loadOrderHistory().data;
    const lastWeekItems = filterOrdersByDateRange(items, ranges.lastWeek, 'orderDate');

    // Orders placed between 2025-10-20 and 2025-10-26:
    // #2917 (Oct 21), #2988 (Oct 23, 2 items), #3054 (Oct 25), #3102 (Oct 26) = 5 line items
    expect(lastWeekItems).toHaveLength(5);
    const orderIds = new Set(lastWeekItems.map((i) => i.orderId));
    expect(Array.from(orderIds).sort()).toEqual(['#2917', '#2988', '#3054', '#3102']);
  });

  it('filters dataset by returnDate for return-activity queries', () => {
    const items = loadOrderHistory().data;

    // Returns processed in October 2025
    const octReturns = filterOrdersByDateRange(items, ranges.thisMonth, 'returnDate');
    // Order #2214 was ordered in Sep (2025-09-24) but returned in Oct (2025-10-06)
    const order2214 = octReturns.find((i) => i.orderId === '#2214');
    expect(order2214).toBeDefined();
    expect(order2214?.returnDate).toBe('2025-10-06');

    // Total returns with return_date in October = 6 items
    expect(octReturns).toHaveLength(6);
  });
});

