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
        <h1 className="text-lg font-semibold text-card-foreground">Analytics Test</h1>
        <div className="p-4 bg-blue-100 rounded">
          <p>Data count: {allOfferings.length}</p>
          <p>Total: ₹{stats.total}</p>
          <p>Verified: ₹{stats.verified}</p>
        </div>
      </div>
    </AppLayout>
  );
}

