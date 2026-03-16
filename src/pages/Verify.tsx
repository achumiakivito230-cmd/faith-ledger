import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Offering, Denomination } from '@/types';
import { DENOMINATIONS } from '@/types';

export default function VerifyPage() {
  const { user, churchId, profile } = useAuth();
  const { toast } = useToast();
  const [pendingOfferings, setPendingOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [denom, setDenom] = useState<Denomination | null>(null);
  const [counterName, setCounterName] = useState('');
  const [processing, setProcessing] = useState(false);

  if (profile?.role === 'pastor') {
    return (
      <AppLayout>
        <div className="text-sm text-muted-foreground p-8 text-center">
          Only treasurers and counters can verify offerings.
        </div>
      </AppLayout>
    );
  }

  const fetchPending = async () => {
    if (!churchId) return;
    const { data } = await supabase
      .from('offerings')
      .select('*')
      .eq('church_id', churchId)
      .eq('status', 'pending')
      .order('date', { ascending: false });
    setPendingOfferings((data ?? []) as Offering[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, [churchId]);

  const selectOffering = async (offering: Offering) => {
    setSelectedId(offering.id);
    const { data: denomData } = await supabase
      .from('denominations')
      .select('*')
      .eq('offering_id', offering.id)
      .single();
    setDenom(denomData as Denomination | null);

    const { data: counter } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', offering.counted_by_user_id)
      .single();
    setCounterName(counter?.name ?? 'Unknown');
  };

  const handleVerify = async (offering: Offering) => {
    if (!user) return;
    if (offering.counted_by_user_id === user.id) {
      toast({ title: 'Error', description: 'Counter and verifier must be different people.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('offerings')
        .update({
          status: 'verified' as const,
          verified_by_user_id: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', offering.id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'verify_offering' as const,
        resource_type: 'Offering',
        resource_id: offering.id,
        performed_by_user_id: user.id,
        church_id: churchId!,
        offering_id: offering.id,
        details: { total_amount: offering.total_amount },
      });

      toast({ title: 'Verified & Locked', description: `Offering of ₹${Number(offering.total_amount).toLocaleString('en-IN')} has been verified.` });
      setSelectedId(null);
      fetchPending();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (offering: Offering) => {
    if (!user) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('offerings')
        .update({ status: 'rejected' as const, verified_by_user_id: user.id })
        .eq('id', offering.id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'reject_offering' as const,
        resource_type: 'Offering',
        resource_id: offering.id,
        performed_by_user_id: user.id,
        church_id: churchId!,
        offering_id: offering.id,
      });

      toast({ title: 'Offering Rejected', description: 'The offering has been rejected.' });
      setSelectedId(null);
      fetchPending();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rejection failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const selected = pendingOfferings.find((o) => o.id === selectedId);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Pending Verification</h1>
          <p className="text-sm text-muted-foreground">Review and verify offerings counted by others</p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-card shadow-card p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : pendingOfferings.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-8 text-center text-sm text-muted-foreground">
            No offerings pending verification.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* List */}
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium text-card-foreground">
                  Pending ({pendingOfferings.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {pendingOfferings.map((offering) => (
                  <motion.button
                    key={offering.id}
                    layout
                    onClick={() => selectOffering(offering)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                      selectedId === offering.id ? 'bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                  >
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(offering.date), 'MMM d, yyyy')}
                      </span>
                      <StatusBadge status={offering.status} />
                    </div>
                    <span className="text-sm font-semibold font-tabular text-card-foreground">
                      ₹{Number(offering.total_amount).toLocaleString('en-IN')}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Detail */}
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card shadow-card p-4 space-y-4"
              >
                <div>
                  <h2 className="text-sm font-medium text-card-foreground">Review Offering</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(selected.date), 'MMMM d, yyyy')} • Counted by {counterName}
                  </p>
                </div>

                {/* Denomination breakdown */}
                {denom && (
                  <div className="space-y-2">
                    {DENOMINATIONS.map((d) => {
                      const count = denom[d.field];
                      return (
                        <div key={d.field} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="text-muted-foreground">{d.label} × {count}</span>
                          <span className="font-tabular font-medium text-card-foreground">
                            ₹{(d.value * count).toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-2xl font-semibold font-tabular text-card-foreground">
                    ₹{Number(selected.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 active:scale-[0.98] transition-transform"
                    onClick={() => handleVerify(selected)}
                    disabled={processing}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    {processing ? 'Verifying...' : 'Verify & Lock'}
                  </Button>
                  <Button
                    variant="outline"
                    className="active:scale-[0.98] transition-transform text-destructive hover:text-destructive"
                    onClick={() => handleReject(selected)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
