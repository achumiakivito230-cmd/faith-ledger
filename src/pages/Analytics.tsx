import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';
import { Banknote, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const allOfferings = useMemo(() => {
    const local = getLocalOfferings();
    return [...mockOfferings, ...local];
  }, []);

  // Revenue over time (line chart)
  const revenueByDate = useMemo(() => {
    const grouped = allOfferings.reduce((acc, o) => {
      const existing = acc.find((item) => item.date === o.date);
      if (existing) {
        existing.amount += o.total_amount;
      } else {
        acc.push({ date: o.date, amount: o.total_amount });
      }
      return acc;
    }, [] as { date: string; amount: number }[]);
    return grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allOfferings]);

  // By denomination (pie chart)
  const byDenomination = useMemo(() => {
    const denoms: Record<string, number> = {};
    allOfferings.forEach((o) => {
      denoms['₹500'] = (denoms['₹500'] || 0) + 500 * (o.denominations?.note_500 || 0);
      denoms['₹200'] = (denoms['₹200'] || 0) + 200 * (o.denominations?.note_200 || 0);
      denoms['₹100'] = (denoms['₹100'] || 0) + 100 * (o.denominations?.note_100 || 0);
      denoms['₹50'] = (denoms['₹50'] || 0) + 50 * (o.denominations?.note_50 || 0);
      denoms['₹20'] = (denoms['₹20'] || 0) + 20 * (o.denominations?.note_20 || 0);
      denoms['₹10'] = (denoms['₹10'] || 0) + 10 * (o.denominations?.note_10 || 0);
    });
    return Object.entries(denoms).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [allOfferings]);

  // Pending vs Verified (bar chart)
  const statusSummary = useMemo(() => {
    const verified = allOfferings.filter((o) => o.status === 'verified').reduce((s, o) => s + o.total_amount, 0);
    const pending = allOfferings.filter((o) => o.status === 'pending').reduce((s, o) => s + o.total_amount, 0);
    return [
      { name: 'Verified', amount: verified, fill: '#10b981' },
      { name: 'Pending', amount: pending, fill: '#f59e0b' },
    ];
  }, [allOfferings]);

  // Total stats
  const stats = useMemo(() => {
    const total = allOfferings.reduce((s, o) => s + o.total_amount, 0);
    const verified = allOfferings.filter((o) => o.status === 'verified').reduce((s, o) => s + o.total_amount, 0);
    const pending = allOfferings.filter((o) => o.status === 'pending').length;
    return { total, verified, pending, count: allOfferings.length };
  }, [allOfferings]);

  const isEmpty = allOfferings.length === 0;

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Offering collection overview and insights</p>
        </div>

        {isEmpty && (
          <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-8 text-center backdrop-blur-sm">
            <p className="text-muted-foreground">No offering data yet. Create offerings in "New Offering" to see analytics.</p>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Collected"
            value={`₹${stats.total.toLocaleString('en-IN')}`}
            icon={Banknote}
            trend={stats.count > 0 ? `${stats.count} offerings` : 'No data'}
          />
          <StatCard
            title="Verified"
            value={`₹${stats.verified.toLocaleString('en-IN')}`}
            icon={CheckCircle}
            trend={`${allOfferings.filter((o) => o.status === 'verified').length} verified`}
          />
          <StatCard
            title="Pending Verification"
            value={stats.pending}
            icon={Clock}
            trend={`${stats.pending} offerings waiting`}
          />
          <StatCard
            title="Average Offering"
            value={`₹${stats.count > 0 ? Math.round(stats.total / stats.count).toLocaleString('en-IN') : '0'}`}
            icon={TrendingUp}
            trend={`Per offering`}
          />
        </div>

        {/* Charts Grid - Testing */}
        <div className="grid grid-cols-1 gap-6">
          {/* Data Debug */}
          <div className="rounded-xl bg-card border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Data Summary</h2>
            <div className="space-y-2 text-sm">
              <p>Total Offerings: {allOfferings.length}</p>
              <p>Revenue Data Points: {revenueByDate.length}</p>
              <p>Denominations: {byDenomination.length}</p>
              <p>Status Summary: {statusSummary.length}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

