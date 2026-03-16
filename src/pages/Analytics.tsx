import { useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import BarChartMedium from '@/components/ui/bar-chart-medium';
import { LiveOfferingDashboard } from '@/components/ui/live-offering-dashboard';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';
import { Banknote, TrendingUp, CheckCircle, Clock } from 'lucide-react';

// Pastel palette inspired by reference
const PASTEL = {
  lavender: 'bg-[#E8E0F0]',
  mint: 'bg-[#D6EDE8]',
  rose: 'bg-[#F5D5D5]',
  sky: 'bg-[#D4E8F0]',
};

export default function AnalyticsPage() {
  const allOfferings = useMemo(() => {
    return [...mockOfferings, ...getLocalOfferings()];
  }, []);

  const stats = useMemo(() => {
    const total = allOfferings.reduce((s, o) => s + o.total_amount, 0);
    const verified = allOfferings.filter((o) => o.status === 'verified').reduce((s, o) => s + o.total_amount, 0);
    const pending = allOfferings.filter((o) => o.status === 'pending').length;
    return { total, verified, pending, count: allOfferings.length };
  }, [allOfferings]);

  const chartData = useMemo(() => {
    return allOfferings.map((o) => {
      const full = o.notes || `Offering ${o.id.slice(-2)}`;
      const words = full.split(/[\s\-–]+/);
      const short = words.length > 2 ? words.slice(0, 2).join(' ') : full;
      return { key: short, data: o.total_amount };
    });
  }, [allOfferings]);

  return (
    <AppLayout>
      <div className="space-y-5 pb-16">
        {/* Header */}
        <div className="pt-1">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">
            Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Offering insights & trends</p>
        </div>

        {/* Pastel Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Collected"
            value={`₹${stats.total.toLocaleString('en-IN')}`}
            icon={Banknote}
            trend={`${stats.count} offerings`}
            bgColor={PASTEL.lavender}
          />
          <StatCard
            title="Verified"
            value={`₹${stats.verified.toLocaleString('en-IN')}`}
            icon={CheckCircle}
            trend="Verified amount"
            bgColor={PASTEL.mint}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            trend="Awaiting review"
            bgColor={PASTEL.rose}
          />
          <StatCard
            title="Average"
            value={`₹${stats.count > 0 ? Math.round(stats.total / stats.count).toLocaleString('en-IN') : '0'}`}
            icon={TrendingUp}
            trend="Per offering"
            bgColor={PASTEL.sky}
          />
        </div>

        {/* Offering Report Bar Chart */}
        <BarChartMedium chartData={chartData} />

        {/* Live Offering Dashboard */}
        <LiveOfferingDashboard />
      </div>
    </AppLayout>
  );
}
