import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { motion } from 'framer-motion';
import { CalendarIcon, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DENOMINATIONS } from '@/types';

export default function NewOfferingPage() {
  const { user, churchId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [counts, setCounts] = useState<Record<string, number>>({
    note_500: 0, note_200: 0, note_100: 0, note_50: 0, note_20: 0, note_10: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => {
    return DENOMINATIONS.reduce((sum, d) => sum + d.value * (counts[d.field] || 0), 0);
  }, [counts]);

  const totalNotes = useMemo(() => {
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  }, [counts]);

  const handleCountChange = (field: string, value: string) => {
    const num = parseInt(value) || 0;
    if (num < 0 || num > 999) return;
    setCounts((prev) => ({ ...prev, [field]: num }));
  };

  const handleSubmit = async () => {
    if (!user || !churchId) return;
    if (total === 0) {
      toast({ title: 'Error', description: 'Please enter at least one denomination.', variant: 'destructive' });
      return;
    }
    if (date > new Date()) {
      toast({ title: 'Error', description: 'Date cannot be in the future.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Create offering
      const { data: offering, error: offeringErr } = await supabase
        .from('offerings')
        .insert({
          church_id: churchId,
          date: format(date, 'yyyy-MM-dd'),
          total_amount: total,
          counted_by_user_id: user.id,
          status: 'pending' as const,
        })
        .select()
        .single();
      if (offeringErr) throw offeringErr;

      // Create denominations
      const { error: denomErr } = await supabase
        .from('denominations')
        .insert({
          offering_id: offering.id,
          note_500: counts.note_500,
          note_200: counts.note_200,
          note_100: counts.note_100,
          note_50: counts.note_50,
          note_20: counts.note_20,
          note_10: counts.note_10,
          total_notes: totalNotes,
        });
      if (denomErr) throw denomErr;

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'create_offering' as const,
        resource_type: 'Offering',
        resource_id: offering.id,
        performed_by_user_id: user.id,
        church_id: churchId,
        offering_id: offering.id,
        details: { total_amount: total },
      });

      toast({ title: 'Offering Submitted', description: `₹${total.toLocaleString('en-IN')} submitted for verification.` });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit offering';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">New Offering Entry</h1>
          <p className="text-sm text-muted-foreground">Enter denomination counts from the service</p>
        </div>

        {/* Date picker */}
        <div className="rounded-xl bg-card p-4 shadow-card space-y-3">
          <Label>Service Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Denomination grid */}
        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-card-foreground">Denomination Counts</h2>
          </div>

          <div className="divide-y divide-border">
            {DENOMINATIONS.map((denom) => {
              const increments = [1, 5, 10, 20, 50];
              const currentCount = counts[denom.field] || 0;
              return (
                <motion.div
                  key={denom.field}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-card-foreground">{denom.label}</span>
                      <span className="text-xs text-muted-foreground">{currentCount} notes</span>
                    </div>
                    <span className="font-tabular text-sm font-semibold text-card-foreground">
                      ₹{(denom.value * currentCount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {increments.map((inc) => (
                      <div key={inc} className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentCount - inc;
                            if (next >= 0) setCounts((prev) => ({ ...prev, [denom.field]: next }));
                          }}
                          disabled={currentCount < inc}
                          className="h-8 px-2 rounded-l-md text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          −{inc}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentCount + inc;
                            if (next <= 999) setCounts((prev) => ({ ...prev, [denom.field]: next }));
                          }}
                          disabled={currentCount + inc > 999}
                          className="h-8 px-2 rounded-r-md text-xs font-semibold bg-success text-success-foreground hover:bg-success/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          +{inc}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-4 rounded-xl bg-card p-4 shadow-elevated">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-semibold font-tabular text-card-foreground">
                ₹{total.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">{totalNotes} notes total</p>
            </div>
          </div>
          <Button
            className="w-full active:scale-[0.98] transition-transform"
            onClick={handleSubmit}
            disabled={submitting || total === 0}
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
