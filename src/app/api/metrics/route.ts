import { NextRequest, NextResponse } from 'next/server';
import { getOrderItems } from '@/data/loader';
import { computeDashboardMetrics } from '@/metrics';
import { getPredefinedDateRange, normalizeDateRange } from '@/utils/date';
import { PredefinedDateRangeKey } from '@/types/metrics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') as PredefinedDateRangeKey | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateRange = undefined;

    if (rangeParam && ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'].includes(rangeParam)) {
      dateRange = getPredefinedDateRange(rangeParam);
    } else if (startDate && endDate) {
      dateRange = normalizeDateRange({ startDate, endDate, label: 'Custom Range' });
    }

    const items = getOrderItems();
    const metrics = computeDashboardMetrics(items, { dateRange });

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
