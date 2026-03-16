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

        {/* Charts Grid - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue over time - spans 2 columns */}
          <div className="lg:col-span-2 rounded-xl bg-card border border-border/40 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">Revenue Over Time</h2>
              <p className="text-xs text-muted-foreground mt-1">Daily offering amounts</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={revenueByDate} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.2} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* By Denomination - Pie Chart */}
          <div className="rounded-xl bg-card border border-border/40 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">By Denomination</h2>
              <p className="text-xs text-muted-foreground mt-1">Currency breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={byDenomination}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {byDenomination.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Verified vs Pending - Bar Chart - spans full width */}
          <div className="lg:col-span-3 rounded-xl bg-card border border-border/40 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">Verification Status</h2>
              <p className="text-xs text-muted-foreground mt-1">Verified vs pending offerings</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusSummary} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

