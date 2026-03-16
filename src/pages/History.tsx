import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { Offering, Denomination } from '@/types';
import { DENOMINATIONS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function HistoryPage() {
  const { churchId, role } = useAuth();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Offering | null>(null);
  const [denom, setDenom] = useState<Denomination | null>(null);
  const [counterName, setCounterName] = useState('');
  const [verifierName, setVerifierName] = useState('');

  useEffect(() => {
    if (!churchId) return;
    supabase
      .from('offerings')
      .select('*')
      .eq('church_id', churchId)
      .order('date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setOfferings((data ?? []) as Offering[]);
        setLoading(false);
      });
  }, [churchId]);

  const openDetail = async (offering: Offering) => {
    setSelected(offering);
    // Fetch denomination
    const { data: denomData } = await supabase
      .from('denominations')
      .select('*')
      .eq('offering_id', offering.id)
      .single();
    setDenom(denomData as Denomination | null);

    // Fetch counter name
    const { data: counter } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', offering.counted_by_user_id)
      .single();
    setCounterName(counter?.name ?? 'Unknown');

    // Fetch verifier name
    if (offering.verified_by_user_id) {
      const { data: verifier } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', offering.verified_by_user_id)
        .single();
      setVerifierName(verifier?.name ?? '');
    } else {
      setVerifierName('');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Offering History</h1>
          <p className="text-sm text-muted-foreground">All recorded offerings</p>
        </div>

        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : offerings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No offerings recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {offerings.map((offering, i) => (
                <motion.button
                  key={offering.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openDetail(offering)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
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
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Offering Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-card-foreground">{format(new Date(selected.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Counted by</span>
                <span className="text-card-foreground">{counterName}</span>
              </div>
              {verifierName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verified by</span>
                  <span className="text-card-foreground">{verifierName}</span>
                </div>
              )}
              {selected.verified_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verified at</span>
                  <span className="text-card-foreground">{format(new Date(selected.verified_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}

              {/* Denomination breakdown */}
              {denom && role !== 'pastor' && (
                <div className="rounded-lg bg-accent/50 p-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Denomination Breakdown</p>
                  {DENOMINATIONS.map((d) => {
                    const count = denom[d.field];
                    if (count === 0) return null;
                    return (
                      <div key={d.field} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{d.label} × {count}</span>
                        <span className="font-tabular font-medium text-card-foreground">
                          ₹{(d.value * count).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-medium text-card-foreground">Total</span>
                <span className="text-lg font-semibold font-tabular text-card-foreground">
                  ₹{Number(selected.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
