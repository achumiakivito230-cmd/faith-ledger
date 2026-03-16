import { useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { mockOfferings } from '@/lib/mockData';
import { getLocalOfferings } from '@/lib/localStorage';
import { Banknote, TrendingUp, CheckCircle, Clock } from 'lucide-react';

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

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Offering insights</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Collected"
            value={`₹${stats.total.toLocaleString('en-IN')}`}
            icon={Banknote}
            trend={`${stats.count} offerings`}
          />
          <StatCard
            title="Verified"
            value={`₹${stats.verified.toLocaleString('en-IN')}`}
            icon={CheckCircle}
            trend="Verified"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            trend="Awaiting"
          />
          <StatCard
            title="Average"
            value={`₹${stats.count > 0 ? Math.round(stats.total / stats.count).toLocaleString('en-IN') : '0'}`}
            icon={TrendingUp}
            trend="Per offering"
          />
        </div>
      </div>
    </AppLayout>
  );
}

