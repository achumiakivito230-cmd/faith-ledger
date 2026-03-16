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
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-card-foreground">Analytics</h1>

        {isEmpty && (
          <div className="rounded-lg bg-accent/50 border border-border p-6 text-center">
            <p className="text-muted-foreground">No offering data yet. Create offerings in "New Offering" to see analytics.</p>
          </div>
        )}

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

        {/* Charts section - temporarily removed to debug */}
        <div className="rounded-lg bg-accent/50 border border-border p-6 text-center">
          <p className="text-muted-foreground">Charts loading...</p>
        </div>
      </div>
    </AppLayout>
  );
}

