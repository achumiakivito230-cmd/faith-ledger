import { addMonths, startOfDay, format, isBefore, isEqual } from 'date-fns';
import {
  getLocalLoans,
  getLocalLoanPayments,
  saveLocalLoanPayment,
  saveLocalExpense,
  updateLocalLoan,
} from './localStorage';
import type { Loan, LoanPayment, Expense } from '@/types';

/** Standard EMI formula: P × r × (1+r)^n / ((1+r)^n - 1) */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

/** Calculate remaining balance after N payments */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  emi: number,
  paymentsMade: number,
): number {
  const r = annualRate / 12 / 100;
  let balance = principal;
  for (let i = 0; i < paymentsMade; i++) {
    const interest = balance * r;
    const principalPart = emi - interest;
    balance -= principalPart;
  }
  return Math.max(0, Math.round(balance));
}

/** Generate full amortization schedule for a loan */
export function getAmortizationSchedule(loan: Loan): Array<{
  paymentNumber: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const r = loan.interest_rate / 12 / 100;
  let balance = loan.principal_amount;
  const schedule = [];

  for (let i = 1; i <= loan.tenure_months; i++) {
    const interest = Math.round(balance * r);
    const principal = Math.min(loan.monthly_emi - interest, balance);
    balance = Math.max(0, balance - principal);
    schedule.push({
      paymentNumber: i,
      date: format(addMonths(new Date(loan.start_date), i - 1), 'yyyy-MM-dd'),
      emi: loan.monthly_emi,
      principal,
      interest,
      balance,
    });
  }
  return schedule;
}

/** Apply a manual / lump-sum payment to a loan. Reduces tenure (same EMI, fewer months). */
export function applyManualLoanPayment(
  loanId: string,
  amount: number,
  expenseId: string,
): void {
  const loans = getLocalLoans();
  const loan = loans.find(l => l.id === loanId);
  if (!loan || loan.status !== 'active') return;

  const existingPayments = getLocalLoanPayments(loanId);
  const paidCount = existingPayments.length;

  // Current outstanding balance
  const outstanding = calculateRemainingBalance(
    loan.principal_amount,
    loan.interest_rate,
    loan.monthly_emi,
    paidCount,
  );

  if (outstanding <= 0) return;

  const effectiveAmount = Math.min(amount, outstanding);
  const newBalance = Math.max(0, outstanding - effectiveAmount);

  // Create a LoanPayment record for this manual payment
  const payment: LoanPayment = {
    id: `payment-manual-${expenseId}`,
    loan_id: loanId,
    expense_id: expenseId,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    emi_amount: effectiveAmount,
    principal_component: effectiveAmount, // lump sum goes entirely to principal
    interest_component: 0,
    outstanding_balance: newBalance,
    payment_number: paidCount + 1,
    created_at: new Date().toISOString(),
  };

  saveLocalLoanPayment(payment);

  if (newBalance <= 0) {
    // Fully paid off
    updateLocalLoan(loanId, { status: 'completed' });
  } else {
    // Reduce tenure: how many months at current EMI to pay off newBalance
    const r = loan.interest_rate / 12 / 100;
    let newTenure: number;
    if (r === 0) {
      newTenure = Math.ceil(newBalance / loan.monthly_emi);
    } else {
      // n = log(EMI / (EMI - B*r)) / log(1+r)
      const ratio = loan.monthly_emi / (loan.monthly_emi - newBalance * r);
      if (ratio <= 0) {
        newTenure = 1; // fallback
      } else {
        newTenure = Math.ceil(Math.log(ratio) / Math.log(1 + r));
      }
    }
    // Total tenure = payments already made + 1 (this payment) + remaining months
    updateLocalLoan(loanId, { tenure_months: paidCount + 1 + newTenure });
  }
}

/** Check all active loans and generate any due EMI expenses + payments */
export function generateDueEMIs(churchId: string, userId: string): void {
  const loans = getLocalLoans().filter(l => l.status === 'active' && l.church_id === churchId);
  const today = startOfDay(new Date());

  for (const loan of loans) {
    const existingPayments = getLocalLoanPayments(loan.id);
    const paidCount = existingPayments.length;

    // Generate all due EMIs (not just the next one)
    for (let n = paidCount + 1; n <= loan.tenure_months; n++) {
      const dueDate = startOfDay(addMonths(new Date(loan.start_date), n - 1));

      if (isBefore(dueDate, today) || isEqual(dueDate, today)) {
        // Check not already generated
        const alreadyExists = existingPayments.some(p => p.payment_number === n);
        if (alreadyExists) continue;

        const balance = calculateRemainingBalance(
          loan.principal_amount,
          loan.interest_rate,
          loan.monthly_emi,
          n - 1,
        );
        const r = loan.interest_rate / 12 / 100;
        const interestComp = Math.round(balance * r);
        const principalComp = Math.min(loan.monthly_emi - interestComp, balance);
        const newBalance = Math.max(0, balance - principalComp);

        const expenseId = `emi-${loan.id}-${n}`;

        const expense: Expense = {
          id: expenseId,
          church_id: churchId,
          date: format(dueDate, 'yyyy-MM-dd'),
          category: 'Loan Repayment',
          description: `EMI #${n} - ${loan.bank_name} (${loan.purpose})`,
          amount: loan.monthly_emi,
          payment_method: 'Bank Transfer',
          notes: `Auto-generated | Principal: ₹${principalComp.toLocaleString('en-IN')} | Interest: ₹${interestComp.toLocaleString('en-IN')}`,
          loan_id: loan.id,
          created_by_user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const payment: LoanPayment = {
          id: `payment-${expenseId}`,
          loan_id: loan.id,
          expense_id: expenseId,
          payment_date: format(dueDate, 'yyyy-MM-dd'),
          emi_amount: loan.monthly_emi,
          principal_component: principalComp,
          interest_component: interestComp,
          outstanding_balance: newBalance,
          payment_number: n,
          created_at: new Date().toISOString(),
        };

        saveLocalExpense(expense);
        saveLocalLoanPayment(payment);
        existingPayments.push(payment); // track within this run
      } else {
        break; // future EMIs, stop
      }
    }

    // Check if loan is fully paid
    const totalPayments = getLocalLoanPayments(loan.id).length;
    if (totalPayments >= loan.tenure_months) {
      updateLocalLoan(loan.id, { status: 'completed' });
    }
  }
}
