import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import BarChartMedium from '@/components/ui/bar-chart-medium';
import { LiveOfferingDashboard } from '@/components/ui/live-offering-dashboard';
import { Banknote, TrendingUp, CheckCircle, Clock, MinusCircle, Wallet } from 'lucide-react';
import { AnimatedText } from '@/components/ui/animated-text';
import DateFilterBar from '@/components/DateFilterBar';
import { useDateFilter } from '@/hooks/useDateFilter';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Offering, Expense } from '@/types';

const WARM = {
  cream: 'bg-[#fef3c7]',
  blush: 'bg-[#fde8e8]',
  sand: 'bg-[#fdf2d6]',
  linen: 'bg-[#f5e8d2]',
};

export default function AnalyticsPage() {
  const { churchId } = useAuth();
  const { month, year, day, setMonth, setYear, setDay } = useDateFilter();
  const [allOfferings, setAllOfferings] = useState<Offering[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!churchId) return;
    let start: Date, end: Date;
    if (month === null) {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
    } else if (day !== null) {
      start = new Date(year, month, day);
      end = new Date(year, month, day, 23, 59, 59);
    } else {
      start = startOfMonth(new Date(year, month));
      end = endOfMonth(new Date(year, month));
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    Promise.all([
      supabase
        .from('offerings')
        .select('*')
        .eq('church_id', churchId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false }),
      supabase
        .from('expenses')
        .select('*')
        .eq('church_id', churchId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false }),
    ]).then(([offeringsRes, expensesRes]) => {
      setAllOfferings((offeringsRes.data ?? []) as Offering[]);
      setAllExpenses((expensesRes.data ?? []) as Expense[]);
    });
  }, [churchId, month, year, day]);

  const stats = useMemo(() => {
    const total = allOfferings.reduce((s, o) => s + Number(o.total_amount), 0);
    const verified = allOfferings.filter((o) => o.status === 'verified').reduce((s, o) => s + Number(o.total_amount), 0);
    const pending = allOfferings.filter((o) => o.status === 'pending').length;
    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
    const netBalance = total - totalExpenses;
    return { total, verified, pending, count: allOfferings.length, totalExpenses, expenseCount: allExpenses.length, netBalance };
  }, [allOfferings, allExpenses]);

  const chartData = useMemo(() => {
    return allOfferings.map((o) => {
      const full = o.notes || `Offering ${o.id.slice(-2)}`;
      const words = full.split(/[\s\-–]+/);
      const short = words.length > 2 ? words.slice(0, 2).join(' ') : full;
      return { key: short, data: Number(o.total_amount) };
    });
  }, [allOfferings]);

  return (
    <AppLayout>
      <div className="space-y-5 pb-16">
        {/* Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedText text="Analytics" textClassName="text-[28px] font-extrabold tracking-tight text-foreground" underlineHeight="h-0.5" underlineOffset="-bottom-1" duration={0.04} delay={0.03} />
              <p className="text-sm text-muted-foreground mt-2">Offering insights & trends</p>
            </div>
            <DateFilterBar month={month} year={year} day={day} setMonth={setMonth} setYear={setYear} setDay={setDay} />
          </div>
        </div>

        {/* Pastel Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Collected"
            value={`₹${stats.total.toLocaleString('en-IN')}`}
            icon={Banknote}
            trend={`${stats.count} offerings`}
            bgColor={WARM.cream}
          />
          <StatCard
            title="Verified"
            value={`₹${stats.verified.toLocaleString('en-IN')}`}
            icon={CheckCircle}
            trend="Verified amount"
            bgColor={WARM.sand}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            trend="Awaiting review"
            bgColor={WARM.blush}
          />
          <StatCard
            title="Average"
            value={`₹${stats.count > 0 ? Math.round(stats.total / stats.count).toLocaleString('en-IN') : '0'}`}
            icon={TrendingUp}
            trend="Per offering"
            bgColor={WARM.linen}
          />
          <StatCard
            title="Total Expenses"
            value={`₹${stats.totalExpenses.toLocaleString('en-IN')}`}
            icon={MinusCircle}
            trend={`${stats.expenseCount} expenses`}
            bgColor={WARM.blush}
          />
          <StatCard
            title="Net Balance"
            value={`₹${stats.netBalance.toLocaleString('en-IN')}`}
            icon={Wallet}
            trend="Offerings − Expenses"
            bgColor={WARM.cream}
          />
        </div>

        {/* Offering Report Bar Chart */}
        <BarChartMedium chartData={chartData.length > 0 ? chartData : undefined} />

        {/* Live Offering Dashboard */}
        <LiveOfferingDashboard />
      </div>
    </AppLayout>
  );
}
