import type { Offering, Denomination, Expense, Loan, LoanPayment } from '@/types';

const OFFERINGS_KEY = 'mock_offerings';
const DENOMINATIONS_KEY = 'mock_denominations';
const EXPENSES_KEY = 'mock_expenses';

export function getLocalOfferings(): Offering[] {
  try {
    const data = localStorage.getItem(OFFERINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getLocalDenominations(offeringId: string): Denomination | null {
  try {
    const data = localStorage.getItem(DENOMINATIONS_KEY);
    if (!data) return null;
    const denoms = JSON.parse(data) as Record<string, Denomination>;
    return denoms[offeringId] || null;
  } catch {
    return null;
  }
}

export function saveLocalOffering(offering: Offering, denom: Denomination): void {
  try {
    // Save offering
    const offerings = getLocalOfferings();
    offerings.push(offering);
    localStorage.setItem(OFFERINGS_KEY, JSON.stringify(offerings));

    // Save denomination
    const data = localStorage.getItem(DENOMINATIONS_KEY);
    const denoms = data ? JSON.parse(data) : {};
    denoms[offering.id] = denom;
    localStorage.setItem(DENOMINATIONS_KEY, JSON.stringify(denoms));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getLocalExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalExpense(expense: Expense): void {
  try {
    const expenses = getLocalExpenses();
    expenses.push(expense);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save expense to localStorage:', err);
  }
}

// Loan storage
const LOANS_KEY = 'mock_loans';
const LOAN_PAYMENTS_KEY = 'mock_loan_payments';

export function getLocalLoans(): Loan[] {
  try {
    const data = localStorage.getItem(LOANS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalLoan(loan: Loan): void {
  try {
    const loans = getLocalLoans();
    loans.push(loan);
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to save loan to localStorage:', err);
  }
}

export function updateLocalLoan(loanId: string, updates: Partial<Loan>): void {
  try {
    const loans = getLocalLoans();
    const index = loans.findIndex(l => l.id === loanId);
    if (index !== -1) {
      loans[index] = { ...loans[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    }
  } catch (err) {
    console.error('Failed to update loan:', err);
  }
}

export function getLocalLoanPayments(loanId?: string): LoanPayment[] {
  try {
    const data = localStorage.getItem(LOAN_PAYMENTS_KEY);
    const all: LoanPayment[] = data ? JSON.parse(data) : [];
    return loanId ? all.filter(p => p.loan_id === loanId) : all;
  } catch {
    return [];
  }
}

export function saveLocalLoanPayment(payment: LoanPayment): void {
  try {
    const payments = getLocalLoanPayments();
    payments.push(payment);
    localStorage.setItem(LOAN_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save loan payment:', err);
  }
}

export function clearLocalData(): void {
  localStorage.removeItem(OFFERINGS_KEY);
  localStorage.removeItem(DENOMINATIONS_KEY);
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(LOANS_KEY);
  localStorage.removeItem(LOAN_PAYMENTS_KEY);
}
