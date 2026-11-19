import React from 'react';
import { getOrderItems } from '@/data/loader';
import { computeDashboardMetrics } from '@/metrics';
import { MetricCard } from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/utils/format';

export default function DashboardPage() {
  const items = getOrderItems();
  const metrics = computeDashboardMetrics(items);

  const { sales, products, returns, repeatCustomers, salesChannels, referenceDate } = metrics;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Shopify Merchant Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Metric Engine & Analytics Foundation Dashboard
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Reference Date: {referenceDate}
            </span>
          </div>
        </div>
      </div>

      {/* Top Level KPIs */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Sales"
            value={formatCurrency(sales.totalSales)}
            subtitle="Gross minus item discounts"
          />
          <MetricCard
            title="Total Orders"
            value={sales.totalOrders}
            subtitle={`${sales.totalLineItems} line items sold`}
          />
          <MetricCard
            title="Average Order Value"
            value={formatCurrency(sales.averageOrderValue)}
            subtitle="Per unique order"
          />
          <MetricCard
            title="Order Return Rate"
            value={formatPercentage(returns.orderReturnRate)}
            subtitle={`${returns.returnedOrdersCount} of ${sales.totalOrders} orders returned`}
          />
          <MetricCard
            title="Repeat Customers"
            value={formatPercentage(repeatCustomers.repeatCustomerPercentage)}
            subtitle={`${repeatCustomers.repeatCustomerCount} of ${repeatCustomers.uniqueCustomers} customers`}
          />
        </div>
      </section>

      {/* Two-Column Layout for Categories */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Category 1: Sales Performance Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">1. Sales Performance</h2>
          <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50 p-3 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">Gross Sales</p>
              <p className="font-semibold text-slate-900">{formatCurrency(sales.grossSales)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Discounts</p>
              <p className="font-semibold text-rose-600">-{formatCurrency(sales.totalDiscounts)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Net Sales</p>
              <p className="font-semibold text-emerald-600">{formatCurrency(sales.netSales)}</p>
            </div>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Monthly Sales Trend</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Month</th>
                  <th className="py-2 text-right">Orders</th>
                  <th className="py-2 text-right">Sales</th>
                  <th className="py-2 text-right">AOV</th>
                  <th className="py-2 text-right">MoM Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.monthlySales.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 font-medium text-slate-900">{m.month}</td>
                    <td className="py-2 text-right text-slate-600">{m.orders}</td>
                    <td className="py-2 text-right text-slate-900">{formatCurrency(m.sales)}</td>
                    <td className="py-2 text-right text-slate-600">{formatCurrency(m.aov)}</td>
                    <td className="py-2 text-right">
                      {m.monthOverMonthGrowth === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={
                            m.monthOverMonthGrowth >= 0
                              ? 'text-emerald-600 font-medium'
                              : 'text-rose-600 font-medium'
                          }
                        >
                          {m.monthOverMonthGrowth > 0 ? '+' : ''}
                          {m.monthOverMonthGrowth.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category 2: Best-Selling Products */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">2. Best-Selling Products</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Top Products by Revenue</h3>
              <ul className="divide-y divide-slate-100">
                {products.topProductsByRevenue.slice(0, 4).map((p, idx) => (
                  <li key={p.productId} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="mr-2 font-mono text-xs text-slate-400">#{idx + 1}</span>
                      <span className="font-medium text-slate-900">{p.productTitle}</span>
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {p.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(p.revenue)}</p>
                      <p className="text-xs text-slate-500">{p.unitsSold} units</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Product Categories</h3>
              <div className="space-y-2">
                {products.categoryPerformance.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{c.category}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500">{c.unitsSold} units</span>
                      <span className="font-medium text-slate-900">{formatCurrency(c.revenue)}</span>
                      <span className="text-xs font-semibold text-indigo-600 w-12 text-right">
                        {c.revenueSharePercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category 3: Returns & Refunds */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">3. Returns & Refunds</h2>
          <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">Total Returned Items</p>
              <p className="text-xl font-bold text-slate-900">{returns.totalReturns}</p>
              <p className="text-xs text-slate-500">Item return rate: {returns.itemReturnRate}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Refunds Issued</p>
              <p className="text-xl font-bold text-rose-600">
                {formatCurrency(returns.totalRefundAmount)}
              </p>
              <p className="text-xs text-slate-500">Order return rate: {returns.orderReturnRate}%</p>
            </div>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Return Reasons Breakdown</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {returns.returnReasonsBreakdown.map((r) => (
              <li key={r.reason} className="flex items-center justify-between py-2">
                <span className="text-slate-700">{r.reason}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500">{r.count} return(s)</span>
                  <span className="text-xs font-semibold text-slate-600">{r.percentage}%</span>
                  <span className="font-medium text-slate-900">{formatCurrency(r.totalRefund)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Category 4 & 5 Combined Side Column */}
        <div className="space-y-8">
          {/* Category 4: Repeat Customer Performance */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">4. Repeat Customers</h2>
            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg">
              <div>
                <p className="text-xs text-slate-500">Repeat Revenue</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(repeatCustomers.repeatCustomerSales)}
                </p>
                <p className="text-xs text-indigo-600 font-medium">
                  {repeatCustomers.repeatCustomerSalesPercentage}% of total
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">First-Time Revenue</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(repeatCustomers.firstTimeSales)}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {repeatCustomers.firstTimeSalesPercentage}% of total
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {repeatCustomers.repeatCustomerCount} out of {repeatCustomers.uniqueCustomers} unique
              shoppers have made repeat purchases ({repeatCustomers.repeatCustomerPercentage}%).
            </p>
          </div>

          {/* Category 5: Sales Channel Performance */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">5. Sales Channels</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {salesChannels.channels.map((ch) => (
                <li key={ch.channel} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-slate-900">{ch.channel}</p>
                    <p className="text-xs text-slate-500">
                      {ch.orders} orders · {ch.units} units · AOV {formatCurrency(ch.aov)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(ch.revenue)}</p>
                    <p className="text-xs font-semibold text-indigo-600">
                      {ch.revenueSharePercentage}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

