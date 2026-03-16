import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Banknote, TrendingUp, Calendar, FileText, PlusCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Offering } from '@/types';
import { generateMonthlyPDF } from '@/lib/pdfExport';
import { mockChurch, mockOfferings } from '@/lib/mockData';
import { getLocalOfferings, getLocalDenominations } from '@/lib/localStorage';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PASTEL = {
  lavender: 'bg-[#E8E0F0]',
  mint: 'bg-[#D6EDE8]',
  rose: 'bg-[#F5D5D5]',
  sky: 'bg-[#D4E8F0]',
};

export default function DashboardPage() {
  const { churchId, profile } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [offerings, setOfferings] = useState<Offering[]>([]);
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
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));

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
      setLoading(false);
      return;
    }

    supabase
      .from('offerings')
      .select('*')
      .eq('church_id', churchId)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .then(({ data }) => {
        setOfferings((data ?? []) as Offering[]);
        setLoading(false);
      });
  }, [churchId, month, year]);

  const stats = useMemo(() => {
    const verified = offerings.filter((o) => o.status === 'verified');
    const total = verified.reduce((s, o) => s + Number(o.total_amount), 0);
    const count = verified.length;
    const avg = count > 0 ? total / count : 0;
    const highest = verified.length > 0 ? Math.max(...verified.map((o) => Number(o.total_amount))) : 0;
    return { total, count, avg, highest };
  }, [offerings]);

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
              <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-0.5">Monthly offering overview</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-white/60 border-0 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
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
          <StatCard title="Total Offerings" value={`₹${stats.total.toLocaleString('en-IN')}`} icon={Banknote} trend={`${stats.count} services`} bgColor={PASTEL.lavender} />
          <StatCard title="Services Recorded" value={String(stats.count)} icon={Calendar} trend="This month" bgColor={PASTEL.mint} />
          <StatCard title="Average / Service" value={`₹${Math.round(stats.avg).toLocaleString('en-IN')}`} icon={TrendingUp} trend="Per offering" bgColor={PASTEL.sky} />
          <StatCard title="Highest" value={`₹${stats.highest.toLocaleString('en-IN')}`} icon={TrendingUp} trend="Single service" bgColor={PASTEL.rose} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to="/new-offering">
            <Button size="sm" className="rounded-xl bg-slate-900 text-white active:scale-[0.98] transition-transform">
              <PlusCircle className="h-4 w-4 mr-1" />
              New Offering
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-xl border-0 bg-white/60" onClick={handleExportPDF} disabled={offerings.filter(o => o.status === 'verified').length === 0}>
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>

        {/* Offerings list — pastel container */}
        <div className="bg-[#F5F0FA] rounded-3xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {months[month]} {year} Offerings
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Recorded services this month</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : offerings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No offerings recorded for {months[month]} {year}.
            </div>
          ) : (
            <div className="divide-y divide-white/50 px-4 pb-3">
              {offerings.map((offering, i) => (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-500 w-20">
                      {format(new Date(offering.date), 'MMM d, yyyy')}
                    </span>
                    <StatusBadge status={offering.status} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{Number(offering.total_amount).toLocaleString('en-IN')}
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
