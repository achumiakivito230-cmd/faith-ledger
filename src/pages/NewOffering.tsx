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
import { AnimatedText } from '@/components/ui/animated-text';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DENOMINATIONS } from '@/types';
import { mockChurch } from '@/lib/mockData';
import { saveLocalOffering } from '@/lib/localStorage';

// Simple ID generator
const generateId = () => `offering-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DENOM_COLORS = [
  'bg-[#fef3c7]', // warm yellow
  'bg-[#fde8e8]', // soft blush
  'bg-[#fdf2d6]', // sand
  'bg-[#f5e8d2]', // linen
  'bg-[#fef3c7]', // warm yellow
  'bg-[#fde8e8]', // soft blush
];

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
    if (!user) return;
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
      const effectiveChurchId = churchId || mockChurch.id;
      const offeringId = generateId();

      // Create offering object
      const offering = {
        id: offeringId,
        church_id: effectiveChurchId,
        date: format(date, 'yyyy-MM-dd'),
        total_amount: total,
        counted_by_user_id: user.id,
        verified_by_user_id: null,
        verified_at: null,
        status: 'pending' as const,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create denomination object
      const denomination = {
        offering_id: offeringId,
        note_500: counts.note_500,
        note_200: counts.note_200,
        note_100: counts.note_100,
        note_50: counts.note_50,
        note_20: counts.note_20,
        note_10: counts.note_10,
        total_notes: totalNotes,
      };

      // Save to localStorage
      saveLocalOffering(offering, denomination);

      toast({ title: 'Offering Submitted', description: `₹${total.toLocaleString('en-IN')} submitted successfully.` });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit offering';
      console.error('Submit error:', err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 pb-16">
        <div className="pt-1">
          <AnimatedText text="New Offering" textClassName="text-[28px] font-extrabold tracking-tight text-foreground" underlineHeight="h-0.5" underlineOffset="-bottom-1" duration={0.04} delay={0.03} />
          <p className="text-sm text-muted-foreground mt-2">Enter denomination counts from the service</p>
        </div>

        {/* Date picker */}
        <div className="rounded-2xl bg-[#fef3c7] p-4 space-y-3">
          <Label className="text-sm font-bold text-foreground">Service Date</Label>
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
        <div>
          <div className="mb-2">
            <h2 className="text-sm font-bold text-foreground">Denomination Counts</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tap buttons to count notes</p>
          </div>

          <div className="space-y-2.5">
            {DENOMINATIONS.map((denom, i) => {
              const increments = [1, 5, 10];
              const currentCount = counts[denom.field] || 0;
              return (
                <motion.div
                  key={denom.field}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`${DENOM_COLORS[i]} rounded-2xl p-3.5 space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{denom.label}</span>
                      <span className="text-[10px] text-muted-foreground">{currentCount} notes</span>
                    </div>
                    <span className="font-tabular text-base font-extrabold text-foreground">
                      ₹{(denom.value * currentCount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {increments.map((inc) => (
                      <div key={inc} className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentCount - inc;
                            if (next >= 0) setCounts((prev) => ({ ...prev, [denom.field]: next }));
                          }}
                          disabled={currentCount < inc}
                          className="glow-btn glow-btn-red"
                        >
                          <span className="glow-btn-inner">−{inc}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentCount + inc;
                            if (next <= 999) setCounts((prev) => ({ ...prev, [denom.field]: next }));
                          }}
                          disabled={currentCount + inc > 999}
                          className="glow-btn glow-btn-green"
                        >
                          <span className="glow-btn-inner">+{inc}</span>
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
        <div className="sticky bottom-4 rounded-2xl bg-[#fde8e8] p-4 shadow-elevated">
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
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
