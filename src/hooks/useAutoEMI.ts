import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { generateDueEMIs } from '@/lib/loanUtils';
import { getLocalLoans, saveLocalLoan } from '@/lib/localStorage';
import { mockLoans } from '@/lib/mockData';

/** Seed mock loans into localStorage if not present, then generate any due EMIs */
export function useAutoEMI() {
  const { user, churchId } = useAuth();

  useEffect(() => {
    if (!user || !churchId) return;

    // Seed mock loans once
    const existing = getLocalLoans();
    if (existing.length === 0) {
      for (const loan of mockLoans) {
        saveLocalLoan(loan);
      }
    }

    generateDueEMIs(churchId, user.id);
  }, [user, churchId]);
}
