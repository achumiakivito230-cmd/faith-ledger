import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import NumberFlow from '@number-flow/react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Banknote, TrendingUp, Calendar, FileText, PlusCircle, Wallet, MinusCircle } from 'lucide-react';
import { AnimatedText } from '@/components/ui/animated-text';
import { useDateFilter } from '@/hooks/useDateFilter';
import { format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import type { Offering, Expense } from '@/types';
import { generateMonthlyPDF } from '@/lib/pdfExport';
import { mockChurch, mockOfferings, mockExpenses } from '@/lib/mockData';
import { getLocalOfferings, getLocalDenominations, getLocalExpenses } from '@/lib/localStorage';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const WARM = {
  cream: 'bg-[#fef3c7]',
  blush: 'bg-[#fde8e8]',
  sand: 'bg-[#fdf2d6]',
  linen: 'bg-[#f5e8d2]',
};

// Cycling colors for individual offering rows
const OFFERING_COLORS = [
  'bg-[#fef3c7]', // warm yellow
  'bg-[#fde8e8]', // soft red/blush
  'bg-[#fdf2d6]', // sand
  'bg-[#f5e8d2]', // linen
];

export default function DashboardPage() {
  const { churchId, profile } = useAuth();
  const { month, year, day, setMonth, setYear, setDay } = useDateFilter();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchName, setChurchName] = useState('Church');

  // Fetch church name
  useEffect(() => {
    if (!churchId) {
      setChurchName(mockChurch.name);
      return;
    }
    supabase
      .from('churches')
      .select('name')
      .eq('id', churchId)
      .single()
      .then(({ data }) => {
        if (data?.name) setChurchName(data.name);
      });
  }, [churchId]);

  // Fetch offerings
  useEffect(() => {
    setLoading(true);
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

    if (!churchId) {
      const localOfferings = getLocalOfferings();
      const allOfferings = [...mockOfferings, ...localOfferings];

      const filtered = allOfferings.filter((o) => {
        const offeringDate = new Date(o.date);
        return offeringDate >= start && offeringDate <= end;
      });

      const withDenoms = filtered.map((o) => ({
        ...o,
        denominations: getLocalDenominations(o.id) || undefined,
      }));

      setOfferings(withDenoms.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Fetch expenses for the same period
      const allExpenses = [...mockExpenses, ...getLocalExpenses()];
      const filteredExpenses = allExpenses.filter((e) => {
        const expDate = new Date(e.date);
        return expDate >= start && expDate <= end;
      });
      setExpenses(filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      setLoading(false);
      return;
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    supabase
      .from('offerings')
      .select('*')
      .eq('church_id', churchId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setOfferings((data ?? []) as Offering[]);
        setLoading(false);
      });
  }, [churchId, month, year, day]);

  const stats = useMemo(() => {
    const verified = offerings.filter((o) => o.status === 'verified');
    const total = verified.reduce((s, o) => s + Number(o.total_amount), 0);
    const count = verified.length;
    const avg = count > 0 ? total / count : 0;
    const highest = verified.length > 0 ? Math.max(...verified.map((o) => Number(o.total_amount))) : 0;
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const netBalance = total - expenseTotal;
    return { total, count, avg, highest, expenseTotal, netBalance };
  }, [offerings, expenses]);

  const handleExportPDF = () => {
    generateMonthlyPDF(offerings, months[month], year, profile?.name ?? 'Treasurer', churchName);
  };

  return (
    <AppLayout>
      <div className="space-y-5 pb-16">
        {/* Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedText text="Dashboard" textClassName="text-[28px] font-extrabold tracking-tight text-foreground" underlineHeight="h-0.5" underlineOffset="-bottom-1" duration={0.04} delay={0.03} />
              <p className="text-sm text-muted-foreground mt-2">{month === null ? 'Yearly' : 'Monthly'} offering overview</p>
            </div>
            <div className="flex items-center gap-1.5">
              {month !== null && (
                <Select value={day === null ? 'all' : String(day)} onValueChange={(v) => setDay(v === 'all' ? null : Number(v))}>
                  <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Array.from({ length: getDaysInMonth(new Date(year, month)) }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={month === null ? 'all' : String(month)} onValueChange={(v) => { setMonth(v === 'all' ? null : Number(v)); setDay(null); }}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setDay(null); }}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pastel Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Total Offerings" value={`₹${stats.total.toLocaleString('en-IN')}`} icon={Banknote} trend={`${stats.count} services`} bgColor={WARM.cream} />
          <StatCard title="Services Recorded" value={String(stats.count)} icon={Calendar} trend="This month" bgColor={WARM.sand} />
          <StatCard title="Average / Service" value={`₹${Math.round(stats.avg).toLocaleString('en-IN')}`} icon={TrendingUp} trend="Per offering" bgColor={WARM.linen} />
          <StatCard title="Highest" value={`₹${stats.highest.toLocaleString('en-IN')}`} icon={TrendingUp} trend="Single service" bgColor={WARM.blush} />
          <StatCard title="Total Expenses" value={`₹${stats.expenseTotal.toLocaleString('en-IN')}`} icon={MinusCircle} trend={`${expenses.length} this month`} bgColor={WARM.blush} />
          <StatCard title="Net Balance" value={`₹${stats.netBalance.toLocaleString('en-IN')}`} icon={Wallet} trend="Offerings − Expenses" bgColor={WARM.cream} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to="/new-offering">
            <Button size="sm" className="rounded-xl bg-primary text-primary-foreground active:scale-[0.98] transition-transform">
              <PlusCircle className="h-4 w-4 mr-1" />
              New Offering
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-xl border-0 bg-white/60" onClick={handleExportPDF} disabled={offerings.filter(o => o.status === 'verified').length === 0}>
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>

        {/* Offerings — individually colored cards */}
        <div>
          <div className="mb-2">
            <h2 className="text-sm font-bold text-foreground">
              {month === null ? year : `${months[month]} ${year}`} Offerings
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Recorded services this month</p>
          </div>

          {loading ? (
            <div className="bg-[#fdf2d6] rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : offerings.length === 0 ? (
            <div className="bg-[#fdf2d6] rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No offerings recorded for {month === null ? year : `${months[month]} ${year}`}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {offerings.map((offering, i) => (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`${OFFERING_COLORS[i % OFFERING_COLORS.length]} rounded-2xl p-3.5 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(offering.date), 'MMM d')}
                    </span>
                    <StatusBadge status={offering.status} />
                  </div>
                  <span className="text-base font-extrabold text-foreground shrink-0 ml-2">
                    <NumberFlow value={Number(offering.total_amount)} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} />
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="mb-2">
            <h2 className="text-sm font-bold text-foreground">
              {month === null ? year : `${months[month]} ${year}`} Expenses
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Recorded expenses this month</p>
          </div>

          {expenses.length === 0 ? (
            <div className="bg-[#fdf2d6] rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No expenses recorded for {month === null ? year : `${months[month]} ${year}`}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`${OFFERING_COLORS[i % OFFERING_COLORS.length]} rounded-2xl p-3.5 flex items-center justify-between`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{expense.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(expense.date), 'MMM d')}</span>
                      <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded-sm text-muted-foreground">{expense.category}</span>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-foreground shrink-0 ml-2">
                    −<NumberFlow value={expense.amount} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} />
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
