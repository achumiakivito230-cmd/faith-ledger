import { addMonths, startOfDay, format, isBefore, isEqual } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Loan, LoanPayment } from '@/types';

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

/** Check all active loans and generate any due EMI expenses + payments in Supabase */
export async function generateDueEMIs(churchId: string, userId: string): Promise<void> {
  const { data: loansData } = await supabase
    .from('loans')
    .select('*')
    .eq('church_id', churchId)
    .eq('status', 'active');

  if (!loansData || loansData.length === 0) return;

  const loans = loansData as Loan[];
  const today = startOfDay(new Date());

  for (const loan of loans) {
    const { data: existingPaymentsData } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_number', { ascending: true });

    const existingPayments = (existingPaymentsData ?? []) as LoanPayment[];
    const paidCount = existingPayments.length;

    for (let n = paidCount + 1; n <= loan.tenure_months; n++) {
      const dueDate = startOfDay(addMonths(new Date(loan.start_date), n - 1));

      if (!(isBefore(dueDate, today) || isEqual(dueDate, today))) break;

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
      const dueDateStr = format(dueDate, 'yyyy-MM-dd');

      // Insert expense record first to get its ID
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          church_id: churchId,
          date: dueDateStr,
          category: 'Loan Repayment',
          description: `EMI #${n} - ${loan.bank_name} (${loan.purpose})`,
          amount: loan.monthly_emi,
          payment_method: 'Bank Transfer',
          notes: `Auto-generated | Principal: ₹${principalComp.toLocaleString('en-IN')} | Interest: ₹${interestComp.toLocaleString('en-IN')}`,
          loan_id: loan.id,
          created_by_user_id: userId,
        })
        .select('id')
        .single();

      if (expenseError || !expenseData) continue;

      await supabase.from('loan_payments').insert({
        loan_id: loan.id,
        expense_id: expenseData.id,
        payment_date: dueDateStr,
        emi_amount: loan.monthly_emi,
        principal_component: principalComp,
        interest_component: interestComp,
        outstanding_balance: newBalance,
        payment_number: n,
      });

      // Track locally to avoid double-inserting within the same run
      existingPayments.push({ payment_number: n } as LoanPayment);
    }

    // Mark loan as completed if all EMIs are paid
    const { data: finalPayments } = await supabase
      .from('loan_payments')
      .select('id', { count: 'exact' })
      .eq('loan_id', loan.id);

    if ((finalPayments?.length ?? 0) >= loan.tenure_months) {
      await supabase
        .from('loans')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', loan.id);
    }
  }
}

/** Apply a manual payment to a loan — inserts a loan_payment record in Supabase */
export async function applyManualLoanPayment(
  loan: Loan,
  amount: number,
  expenseId: string,
  paidCount: number,
): Promise<void> {
  if (loan.status !== 'active') return;

  const outstanding = calculateRemainingBalance(
    loan.principal_amount,
    loan.interest_rate,
    loan.monthly_emi,
    paidCount,
  );
  if (outstanding <= 0) return;

  const effectiveAmount = Math.min(amount, outstanding);
  const newBalance = Math.max(0, outstanding - effectiveAmount);

  await supabase.from('loan_payments').insert({
    loan_id: loan.id,
    expense_id: expenseId,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    emi_amount: effectiveAmount,
    principal_component: effectiveAmount,
    interest_component: 0,
    outstanding_balance: newBalance,
    payment_number: paidCount + 1,
  });

  if (newBalance <= 0) {
    await supabase
      .from('loans')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', loan.id);
  }
}
