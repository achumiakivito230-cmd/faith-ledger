import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChurchSetupPage() {
  const [churchName, setChurchName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedChurchName = churchName.trim();
    const trimmedAddress = address.trim();

    if (!trimmedChurchName) {
      toast({ title: 'Error', description: 'Church name is required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_church_and_assign', {
        _name: trimmedChurchName,
        _address: trimmedAddress || null,
      });

      if (error) throw error;

      toast({ title: 'Church Created', description: `${trimmedChurchName} is ready to use.` });
      window.location.href = '/';
    } catch (err: unknown) {
      console.error('Church setup error:', err);
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as Record<string, unknown>).message) : 'Failed to create church';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-card-foreground">Set Up Your Church</h1>
          <p className="mt-1 text-sm text-muted-foreground">One last step before you begin</p>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="churchName">Church Name</Label>
              <Input
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="Grace Community Church"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <Button type="submit" className="w-full active:scale-[0.98] transition-transform" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Church'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
