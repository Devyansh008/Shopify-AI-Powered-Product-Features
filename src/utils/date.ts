/**
 * Reusable date utilities for Shopify analytics.
 *
 * Rules:
 * - Reference Date: October 27, 2025.
 * - Weeks start Monday and end Sunday.
 * - Ranges are inclusive.
 * - Dates beyond the reference date are never included (capped at reference date).
 * - Distinguishes between querying by `order_date` (orders placed in period)
 *   and `return_date` (return activity occurring in period).
 */

import { DateRange, PredefinedDateRangeKey } from '../types/metrics';
import { OrderLineItem } from '../types/order';

export const DEFAULT_REFERENCE_DATE = '2025-10-27';

/**
 * Parses a 'YYYY-MM-DD' string into a UTC Date object to avoid timezone skew.
 */
export function parseISODateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date string: "${dateStr}". Expected format YYYY-MM-DD.`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a UTC Date to 'YYYY-MM-DD'.
 */
export function formatISODateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes predefined date ranges based on a given reference date (defaults to 2025-10-27).
 */
export function getPredefinedDateRanges(
  referenceDateStr: string = DEFAULT_REFERENCE_DATE
): Record<PredefinedDateRangeKey, DateRange> {
  const ref = parseISODateUTC(referenceDateStr);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth(); // 0-indexed

  // Today
  const todayRange: DateRange = {
    startDate: referenceDateStr,
    endDate: referenceDateStr,
    label: 'Today',
  };

  // Yesterday
  const yesterday = new Date(ref);
  yesterday.setUTCDate(ref.getUTCDate() - 1);
  const yesterdayStr = formatISODateUTC(yesterday);
  const yesterdayRange: DateRange = {
    startDate: yesterdayStr,
    endDate: yesterdayStr,
    label: 'Yesterday',
  };

  // Weeks start Monday (1) and end Sunday (0)
  // Distance from Monday: if Sun (0), distance is 6. Otherwise day - 1.
  const dayOfWeek = ref.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  // This Week Monday
  const thisWeekMonday = new Date(ref);
  thisWeekMonday.setUTCDate(ref.getUTCDate() - daysSinceMonday);
  const thisWeekMondayStr = formatISODateUTC(thisWeekMonday);

  // This Week: Monday through reference date (capped at reference date)
  const thisWeekRange: DateRange = {
    startDate: thisWeekMondayStr,
    endDate: referenceDateStr,
    label: 'This Week',
  };

  // Last Week: Monday through Sunday of previous week
  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setUTCDate(thisWeekMonday.getUTCDate() - 7);
  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setUTCDate(lastWeekMonday.getUTCDate() + 6);

  const lastWeekRange: DateRange = {
    startDate: formatISODateUTC(lastWeekMonday),
    endDate: formatISODateUTC(lastWeekSunday),
    label: 'Last Week',
  };

  // This Month: 1st of current month capped at reference date
  const thisMonthStart = new Date(Date.UTC(year, month, 1));
  const thisMonthRange: DateRange = {
    startDate: formatISODateUTC(thisMonthStart),
    endDate: referenceDateStr,
    label: 'This Month',
  };

  // Last Month: 1st of previous month to last day of previous month
  const lastMonthStart = new Date(Date.UTC(year, month - 1, 1));
  // Day 0 of current month = last day of previous month
  const lastMonthEnd = new Date(Date.UTC(year, month, 0));
  const lastMonthRange: DateRange = {
    startDate: formatISODateUTC(lastMonthStart),
    endDate: formatISODateUTC(lastMonthEnd),
    label: 'Last Month',
  };

  return {
    today: todayRange,
    yesterday: yesterdayRange,
    thisWeek: thisWeekRange,
    lastWeek: lastWeekRange,
    thisMonth: thisMonthRange,
    lastMonth: lastMonthRange,
  };
}

/**
 * Returns a specific predefined date range.
 */
export function getPredefinedDateRange(
  key: PredefinedDateRangeKey,
  referenceDateStr: string = DEFAULT_REFERENCE_DATE
): DateRange {
  const ranges = getPredefinedDateRanges(referenceDateStr);
  return ranges[key];
}

/**
 * Validates and normalizes any date range, ensuring:
 * 1. startDate <= endDate
 * 2. endDate is capped at the reference date
 */
export function normalizeDateRange(
  range: DateRange,
  referenceDateStr: string = DEFAULT_REFERENCE_DATE
): DateRange {
  let { startDate, endDate, label } = range;

  // Never include dates beyond reference date
  if (endDate > referenceDateStr) {
    endDate = referenceDateStr;
  }
  if (startDate > referenceDateStr) {
    startDate = referenceDateStr;
  }
  if (startDate > endDate) {
    startDate = endDate;
  }

  return { startDate, endDate, label };
}

/**
 * Checks if a given date string ('YYYY-MM-DD') falls inclusively within a DateRange.
 */
export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (!dateStr) return false;
  return dateStr >= range.startDate && dateStr <= range.endDate;
}

/**
 * Filters order line items by a date range.
 * Supports choosing whether to filter on `orderDate` or `returnDate`.
 *
 * - Use 'orderDate' for order placement metrics (e.g. sales in period, orders placed in period).
 * - Use 'returnDate' for general return activity metrics (e.g. returns processed in period).
 */
export function filterOrdersByDateRange(
  items: OrderLineItem[],
  range: DateRange,
  dateField: 'orderDate' | 'returnDate' = 'orderDate',
  referenceDateStr: string = DEFAULT_REFERENCE_DATE
): OrderLineItem[] {
  const normalizedRange = normalizeDateRange(range, referenceDateStr);

  return items.filter((item) => {
    const targetDate = item[dateField];
    if (!targetDate) return false;
    return isDateInRange(targetDate, normalizedRange);
  });
}

