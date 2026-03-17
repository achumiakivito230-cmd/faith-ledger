import type { Offering, Denomination, Expense } from '@/types';

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

export function clearLocalData(): void {
  localStorage.removeItem(OFFERINGS_KEY);
  localStorage.removeItem(DENOMINATIONS_KEY);
  localStorage.removeItem(EXPENSES_KEY);
}
