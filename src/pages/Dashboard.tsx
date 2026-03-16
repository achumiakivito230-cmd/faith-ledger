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
      // Combine mock data with localStorage data
      const localOfferings = getLocalOfferings();
      const allOfferings = [...mockOfferings, ...localOfferings];

      const filtered = allOfferings.filter((o) => {
        const offeringDate = new Date(o.date);
        return offeringDate >= start && offeringDate <= end;
      });

      // Add denominations to offerings
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monthly offering overview</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[90px] h-9 text-sm">
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Offerings" value={`₹${stats.total.toLocaleString('en-IN')}`} icon={Banknote} />
          <StatCard title="Services Recorded" value={String(stats.count)} icon={Calendar} />
          <StatCard title="Average per Service" value={`₹${Math.round(stats.avg).toLocaleString('en-IN')}`} icon={TrendingUp} />
          <StatCard title="Highest" value={`₹${stats.highest.toLocaleString('en-IN')}`} icon={TrendingUp} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to="/new-offering">
            <Button size="sm" className="active:scale-[0.98] transition-transform">
              <PlusCircle className="h-4 w-4 mr-1" />
              New Offering
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={offerings.filter(o => o.status === 'verified').length === 0}>
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>

        {/* Offerings list */}
        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-card-foreground">
              {months[month]} {year} Offerings
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : offerings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No offerings recorded for {months[month]} {year}.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {offerings.map((offering, i) => (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">
                      {format(new Date(offering.date), 'MMM d, yyyy')}
                    </span>
                    <StatusBadge status={offering.status} />
                  </div>
                  <span className="text-sm font-semibold font-tabular text-card-foreground">
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
