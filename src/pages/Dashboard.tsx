import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Banknote, TrendingUp, Calendar, FileText, PlusCircle, ShieldCheck, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Offering } from '@/types';
import { generateMonthlyPDF } from '@/lib/pdfExport';
import { mockChurch, mockOfferings } from '@/lib/mockData';
import { getLocalOfferings, getLocalDenominations } from '@/lib/localStorage';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Pastel card colors cycling through offerings (like eSIM plan cards)
const CARD_COLORS = [
  'bg-[#E8E0F0]', // lavender
  'bg-[#D4E8F0]', // sky
  'bg-[#F5D5D5]', // rose/pink
  'bg-[#D6EDE8]', // mint
];

const STAT_ICONS = [
  { key: 'total', icon: Banknote },
  { key: 'count', icon: Calendar },
  { key: 'avg', icon: TrendingUp },
  { key: 'highest', icon: TrendingUp },
];

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
      <div className="space-y-5 pb-20">
        {/* Header — big bold title like reference */}
        <div className="pt-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[32px] font-extrabold tracking-tight leading-tight text-slate-900">
                Monthly<br />Overview
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-[#F0EBF5] border-0 rounded-full font-semibold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-8 px-2.5 text-xs bg-[#F0EBF5] border-0 rounded-full font-semibold text-slate-700">
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

        {/* Stat summary — 2x2 pastel grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#E8E0F0] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
              <div className="bg-white/50 rounded-lg p-1"><Banknote className="h-3.5 w-3.5 text-slate-600" /></div>
            </div>
            <p className="text-xl font-extrabold text-slate-900">₹{stats.total.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stats.count} verified services</p>
          </div>
          <div className="bg-[#D6EDE8] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Services</span>
              <div className="bg-white/50 rounded-lg p-1"><Calendar className="h-3.5 w-3.5 text-slate-600" /></div>
            </div>
            <p className="text-xl font-extrabold text-slate-900">{stats.count}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">This month</p>
          </div>
          <div className="bg-[#D4E8F0] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Average</span>
              <div className="bg-white/50 rounded-lg p-1"><TrendingUp className="h-3.5 w-3.5 text-slate-600" /></div>
            </div>
            <p className="text-xl font-extrabold text-slate-900">₹{Math.round(stats.avg).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Per service</p>
          </div>
          <div className="bg-[#F5D5D5] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Highest</span>
              <div className="bg-white/50 rounded-lg p-1"><TrendingUp className="h-3.5 w-3.5 text-slate-600" /></div>
            </div>
            <p className="text-xl font-extrabold text-slate-900">₹{stats.highest.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Single service</p>
          </div>
        </div>

        {/* Offering cards — each offering is a full-width pastel card like eSIM plans */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-[#F0EBF5] rounded-3xl p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : offerings.length === 0 ? (
            <div className="bg-[#F0EBF5] rounded-3xl p-8 text-center text-sm text-slate-400">
              No offerings recorded for {months[month]} {year}.
            </div>
          ) : (
            offerings.map((offering, i) => {
              const bgColor = CARD_COLORS[i % CARD_COLORS.length];
              const isVerified = offering.status === 'verified';
              const isPending = offering.status === 'pending';

              return (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`${bgColor} rounded-3xl p-4`}
                >
                  {/* Top row: status icon + date on left, amount on right */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <div className="bg-white/50 rounded-full p-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="bg-white/50 rounded-full p-1">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-slate-700">
                        {format(new Date(offering.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white/40 px-2 py-0.5 rounded-full">
                      {isVerified ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
                    </span>
                  </div>

                  {/* Notes / description */}
                  <p className="text-xs text-slate-500 mt-2">
                    {offering.notes || 'General Offering'}
                  </p>

                  {/* Amount — big and bold */}
                  <p className="text-2xl font-extrabold text-slate-900 mt-1 text-right">
                    ₹{Number(offering.total_amount).toLocaleString('en-IN')}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Action buttons — dark pill like reference "PLAN DETAILS" / "TOP UP" */}
        <div className="flex gap-2.5">
          <Link to="/new-offering" className="flex-1">
            <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm active:scale-[0.98] transition-transform">
              <PlusCircle className="h-4 w-4 mr-2" />
              NEW OFFERING
            </Button>
          </Link>
          <Button
            className="h-12 rounded-2xl bg-white/60 hover:bg-white/80 text-slate-700 font-bold text-sm border-0 px-5 active:scale-[0.98] transition-transform"
            onClick={handleExportPDF}
            disabled={offerings.filter(o => o.status === 'verified').length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
