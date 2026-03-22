import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { generateDueEMIs } from '@/lib/loanUtils';

/** Generate any due EMIs for the user's church */
export function useAutoEMI() {
  const { user, churchId } = useAuth();

  useEffect(() => {
    if (!user || !churchId) return;
    generateDueEMIs(churchId, user.id).catch(console.error);
  }, [user, churchId]);
}
