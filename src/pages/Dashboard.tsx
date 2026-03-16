import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Banknote, TrendingUp, Calendar, FileText, PlusCircle, ShieldCheck, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Offering } from '@/types';
import { generateMonthlyPDF } from '@/lib/pdfExport';
import { mockChurch, mockOfferings } from '@/lib/mockData';
import { getLocalOfferings, getLocalDenominations } from '@/lib/localStorage';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Neumorphic shadow helpers
const NEU = {
  raised: 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]',
  raisedLg: 'shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]',
  inset: 'shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]',
  insetLg: 'shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]',
  subtle: 'shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff]',
  base: 'bg-[#e0e0e0]',
};

export default function DashboardPage() {
  const { churchId, profile } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchName, setChurchName] = useState('Church');

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
      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="pt-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight leading-tight text-gray-700">
                Monthly<br />Overview
              </h1>
              <p className="text-xs text-gray-400 mt-1">{churchName}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className={cn("h-8 px-2.5 text-xs border-0 rounded-xl font-semibold text-gray-600", NEU.base, NEU.raised)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className={cn("h-8 px-2.5 text-xs border-0 rounded-xl font-semibold text-gray-600", NEU.base, NEU.raised)}>
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

        {/* Stat Cards — neumorphic raised */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Collected', value: `₹${stats.total.toLocaleString('en-IN')}`, sub: `${stats.count} verified`, Icon: Banknote },
            { label: 'Services', value: String(stats.count), sub: 'This month', Icon: Calendar },
            { label: 'Average', value: `₹${Math.round(stats.avg).toLocaleString('en-IN')}`, sub: 'Per service', Icon: TrendingUp },
            { label: 'Highest', value: `₹${stats.highest.toLocaleString('en-IN')}`, sub: 'Single service', Icon: TrendingUp },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn("rounded-2xl p-4", NEU.base, NEU.raised)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{stat.label}</span>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", NEU.base, NEU.subtle)}>
                  <stat.Icon className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-700">{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Offering Cards — neumorphic raised, each is its own card */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-600 px-1">
            {months[month]} {year} Offerings
          </h2>

          {loading ? (
            <div className={cn("rounded-2xl p-8 text-center text-sm text-gray-400", NEU.base, NEU.insetLg)}>
              Loading...
            </div>
          ) : offerings.length === 0 ? (
            <div className={cn("rounded-2xl p-8 text-center text-sm text-gray-400", NEU.base, NEU.insetLg)}>
              No offerings recorded for {months[month]} {year}.
            </div>
          ) : (
            offerings.map((offering, i) => {
              const isVerified = offering.status === 'verified';
              const isPending = offering.status === 'pending';

              return (
                <motion.div
                  key={offering.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn("rounded-2xl p-4", NEU.base, NEU.raised)}
                >
                  {/* Top: status + date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center",
                        NEU.base,
                        isVerified ? NEU.inset : NEU.subtle
                      )}>
                        {isVerified
                          ? <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                          : <Clock className="h-3.5 w-3.5 text-amber-500" />
                        }
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {format(new Date(offering.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg",
                      NEU.base,
                      NEU.inset,
                      isVerified ? "text-green-500" : isPending ? "text-amber-500" : "text-red-400"
                    )}>
                      {isVerified ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
                    </span>
                  </div>

                  {/* Notes */}
                  <p className="text-xs text-gray-400 mt-2">
                    {offering.notes || 'General Offering'}
                  </p>

                  {/* Amount */}
                  <p className="text-2xl font-extrabold text-gray-700 mt-1 text-right">
                    ₹{Number(offering.total_amount).toLocaleString('en-IN')}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Action buttons — neumorphic */}
        <div className="flex gap-3">
          <Link to="/new-offering" className="flex-1">
            <button className={cn(
              "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
              "bg-gray-700 text-gray-100",
              "shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]",
              "hover:shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]",
              "active:shadow-[inset_4px_4px_8px_#4a4a4a,inset_-4px_-4px_8px_#8a8a8a]"
            )}>
              <PlusCircle className="h-4 w-4" />
              NEW OFFERING
            </button>
          </Link>
          <button
            onClick={handleExportPDF}
            disabled={offerings.filter(o => o.status === 'verified').length === 0}
            className={cn(
              "h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 px-5 transition-all duration-200",
              NEU.base,
              NEU.raised,
              "text-gray-500 hover:text-gray-700",
              "active:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]",
              "disabled:opacity-40"
            )}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
