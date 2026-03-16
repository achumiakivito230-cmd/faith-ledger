import React, { FC, useMemo } from 'react';
import { useOfferingDashboardData, type SaleDataPoint } from '@/hooks/useOfferingDashboardData';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart, Line, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Banknote, Repeat2, TrendingUp, Clock, BarChart3, CalendarDays } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// Pastel backgrounds for the metric cards
const METRIC_COLORS = ['bg-[#fef3c7]', 'bg-[#fde8e8]', 'bg-[#fdf2d6]', 'bg-[#f5e8d2]'];

interface OfferingChartProps {
  data: SaleDataPoint[];
  title: string;
  lineColor: string;
  legendName: string;
  bgColor: string;
}

const OfferingChart: FC<OfferingChartProps> = React.memo(({ data, title, lineColor, legendName, bgColor }) => {
  const chartData = useMemo(() => data || [], [data]);

  return (
    <div className={`${bgColor} rounded-3xl p-4`}>
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
      </div>
      <div className="bg-white/50 rounded-2xl p-2" style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="time" fontSize={9} stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <YAxis fontSize={9} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={36} />
            <RechartsTooltip
              contentStyle={{ borderRadius: '12px', fontSize: '11px', padding: '6px 10px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              formatter={(value: number) => [formatCurrency(value), legendName]}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: lineColor, stroke: '#fff', strokeWidth: 1.5 }}
              name={legendName}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const DailyBarChart: FC<{ data: SaleDataPoint[] }> = React.memo(({ data }) => {
  const chartData = useMemo(() => data || [], [data]);

  return (
    <div className="bg-[#fdf2d6] rounded-3xl p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-bold text-foreground">Daily Collection</h4>
      </div>
      <p className="text-[10px] text-muted-foreground/70 mb-2">Amount collected per day</p>
      <div className="bg-white/50 rounded-2xl p-2" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="time" fontSize={9} stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <YAxis fontSize={9} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={36} />
            <RechartsTooltip
              contentStyle={{ borderRadius: '12px', fontSize: '11px', padding: '6px 10px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              formatter={(value: number) => [formatCurrency(value), 'Daily Total']}
            />
            <Bar
              dataKey="sales"
              fill="#9b2c2c"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const LiveOfferingDashboard: FC = () => {
  const {
    totalRevenue,
    cumulativeRevenueData,
    salesCount,
    averageSale,
    salesChartData,
    dailyCollectionData,
    latestPayments,
  } = useOfferingDashboardData();

  const metrics = [
    { title: 'Total Collected', value: formatCurrency(totalRevenue || 0), icon: Banknote, sub: 'All offerings combined' },
    { title: 'Total Offerings', value: String(salesCount || 0), icon: Repeat2, sub: 'Services recorded' },
    { title: 'Average / Service', value: formatCurrency(averageSale || 0), icon: TrendingUp, sub: 'Per offering average' },
    { title: 'Status', value: 'Live', icon: Clock, sub: 'Real-time data', isLive: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Pastel Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={m.title} className={`${METRIC_COLORS[i]} rounded-2xl p-3.5`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.title}</span>
              <div className="bg-white/60 rounded-lg p-1">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
              {m.isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              {m.value}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily Collection Bar Chart */}
      <DailyBarChart data={dailyCollectionData} />

      {/* Charts */}
      <OfferingChart
        data={salesChartData}
        title="Offering per Service"
        lineColor="#9b2c2c"
        legendName="Amount"
        bgColor="bg-[#fde8e8]"
      />
      <OfferingChart
        data={cumulativeRevenueData}
        title="Cumulative Total"
        lineColor="#b45309"
        legendName="Cumulative"
        bgColor="bg-[#f5e8d2]"
      />

      {/* Recent Offerings */}
      <div className="bg-[#fef3c7] rounded-3xl overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-bold text-foreground">Recent Offerings</h4>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Latest recorded offerings</p>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="divide-y divide-white/50 px-4">
            {latestPayments.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground/70 text-sm">No offerings yet...</p>
            ) : (
              latestPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2.5">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-foreground">{formatCurrency(payment.amount)}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {payment.product} — {payment.customer}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap ml-2 bg-white/60 px-2 py-0.5 rounded-full">
                    {payment.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="px-4 py-2 text-[10px] text-muted-foreground/70">
          Showing up to 10 recent offerings.
        </div>
      </div>
    </div>
  );
};

export default LiveOfferingDashboard;
