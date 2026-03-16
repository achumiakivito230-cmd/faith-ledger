import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';
import { Banknote, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
      { name: 'Verified', amount: verified },
      { name: 'Pending', amount: pending },
    ];
  }, [allOfferings]);

  // Total stats
  const stats = useMemo(() => {
    const total = allOfferings.reduce((s, o) => s + o.total_amount, 0);
    const verified = allOfferings.filter((o) => o.status === 'verified').reduce((s, o) => s + o.total_amount, 0);
    const pending = allOfferings.filter((o) => o.status === 'pending').length;
    return { total, verified, pending, count: allOfferings.length };
  }, [allOfferings]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-card-foreground">Analytics</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue over time */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Revenue Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* By denomination */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">By Denomination</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byDenomination} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {byDenomination.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status summary */}
          <div className="rounded-xl bg-card p-4 shadow-card lg:col-span-2">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Verified vs Pending</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
