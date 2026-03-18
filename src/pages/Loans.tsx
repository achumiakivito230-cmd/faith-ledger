import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Landmark, ChevronDown, ChevronUp, Delete, CreditCard, CheckCircle2 } from 'lucide-react';
import { AnimatedText } from '@/components/ui/animated-text';
import AnimatedNumber from '@/components/AnimatedNumber';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getLocalLoans, saveLocalLoan, getLocalLoanPayments, updateLocalLoan } from '@/lib/localStorage';
import { calculateEMI, calculateRemainingBalance, getAmortizationSchedule } from '@/lib/loanUtils';
import type { Loan, LoanPayment } from '@/types';

const WARM = {
  cream: 'bg-[#fef3c7]',
  blush: 'bg-[#fde8e8]',
  sand: 'bg-[#fdf2d6]',
  linen: 'bg-[#f5e8d2]',
  yellow: 'bg-[#fef9c3]',
};
const CARD_COLORS = [WARM.cream, WARM.blush, WARM.sand, WARM.linen];

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'] as const;

const generateId = () => `loan-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const currencyFormat = { style: 'currency' as const, currency: 'INR', maximumFractionDigits: 0 };

export default function LoansPage() {
  const { user, churchId } = useAuth();
  const { toast } = useToast();

  // Loan list state
  const [loans, setLoans] = useState<Loan[]>(() => getLocalLoans());
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add loan form state
  const [addOpen, setAddOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [principalStr, setPrincipalStr] = useState('');
  const [rateStr, setRateStr] = useState('');
  const [tenureStr, setTenureStr] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [purpose, setPurpose] = useState('');
  const [useCustomEMI, setUseCustomEMI] = useState(false);
  const [customEMIStr, setCustomEMIStr] = useState('');
  const [activeNumpad, setActiveNumpad] = useState<'principal' | 'rate' | 'emi' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const principal = parseFloat(principalStr) || 0;
  const rate = parseFloat(rateStr) || 0;
  const tenure = parseInt(tenureStr) || 0;
  const calculatedEMI = principal > 0 && rate > 0 && tenure > 0 ? calculateEMI(principal, rate, tenure) : 0;
  const actualEMI = useCustomEMI ? (parseFloat(customEMIStr) || 0) : calculatedEMI;

  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const completedLoans = useMemo(() => loans.filter(l => l.status === 'completed'), [loans]);

  const totalOutstanding = useMemo(() => {
    return activeLoans.reduce((sum, loan) => {
      const payments = getLocalLoanPayments(loan.id);
      return sum + calculateRemainingBalance(loan.principal_amount, loan.interest_rate, loan.monthly_emi, payments.length);
    }, 0);
  }, [activeLoans]);

  const totalMonthlyEMI = useMemo(() => activeLoans.reduce((s, l) => s + l.monthly_emi, 0), [activeLoans]);

  const handleNumpadPress = useCallback((key: string, setter: (fn: (prev: string) => string) => void, allowDecimal = true) => {
    if (key === 'backspace') {
      setter(prev => prev.slice(0, -1));
      return;
    }
    setter(prev => {
      if (key === '.' && (!allowDecimal || prev.includes('.'))) return prev;
      const parts = prev.split('.');
      if (parts[1] && parts[1].length >= 2) return prev;
      if (prev.length >= 12) return prev;
      return prev + key;
    });
  }, []);

  const resetForm = () => {
    setBankName('');
    setPrincipalStr('');
    setRateStr('');
    setTenureStr('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setPurpose('');
    setUseCustomEMI(false);
    setCustomEMIStr('');
    setActiveNumpad(null);
  };

  const handleAddLoan = () => {
    if (!user) return;
    if (!bankName.trim()) { toast({ title: 'Bank name is required', variant: 'destructive' }); return; }
    if (principal <= 0) { toast({ title: 'Enter a valid loan amount', variant: 'destructive' }); return; }
    if (rate <= 0) { toast({ title: 'Enter a valid interest rate', variant: 'destructive' }); return; }
    if (tenure <= 0) { toast({ title: 'Enter valid tenure in months', variant: 'destructive' }); return; }
    if (actualEMI <= 0) { toast({ title: 'EMI amount is invalid', variant: 'destructive' }); return; }

    setSubmitting(true);
    const loan: Loan = {
      id: generateId(),
      church_id: churchId!,
      bank_name: bankName.trim(),
      principal_amount: principal,
      interest_rate: rate,
      tenure_months: tenure,
      start_date: startDate,
      monthly_emi: actualEMI,
      purpose: purpose.trim() || 'General',
      status: 'active',
      created_by_user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalLoan(loan);
    setLoans(getLocalLoans());
    resetForm();
    setAddOpen(false);
    setSubmitting(false);
    toast({ title: 'Loan added successfully' });
  };

  const handleMarkCompleted = (loanId: string) => {
    updateLocalLoan(loanId, { status: 'completed' });
    setLoans(getLocalLoans());
    setDetailOpen(false);
    toast({ title: 'Loan marked as completed' });
  };

  const openDetail = (loan: Loan) => {
    setSelectedLoan(loan);
    setDetailOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-28 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <AnimatedText text="Bank Loans" className="text-lg font-bold tracking-tight text-foreground" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className={`${WARM.cream} rounded-2xl p-3 text-center`}>
            <p className="text-[10px] text-muted-foreground mb-1">Outstanding</p>
            <AnimatedNumber value={totalOutstanding} format={currencyFormat} className="text-sm font-extrabold text-foreground" />
          </div>
          <div className={`${WARM.blush} rounded-2xl p-3 text-center`}>
            <p className="text-[10px] text-muted-foreground mb-1">Monthly EMI</p>
            <AnimatedNumber value={totalMonthlyEMI} format={currencyFormat} className="text-sm font-extrabold text-foreground" />
          </div>
          <div className={`${WARM.sand} rounded-2xl p-3 text-center`}>
            <p className="text-[10px] text-muted-foreground mb-1">Active</p>
            <AnimatedNumber value={activeLoans.length} className="text-sm font-extrabold text-foreground" />
          </div>
        </div>

        {/* Add Loan Button */}
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 rounded-2xl h-12 text-sm font-semibold gap-2" variant="default">
              <Plus className="h-4 w-4" /> Add New Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" /> New Loan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Bank Name */}
              <div className={`${WARM.cream} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="mt-1.5 bg-white/60 border-0"
                />
              </div>

              {/* Loan Amount */}
              <div className={`${WARM.blush} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Loan Amount</Label>
                <div
                  className="mt-1.5 bg-white/60 rounded-md px-3 py-2 text-sm font-bold cursor-pointer min-h-[36px] flex items-center"
                  onClick={() => setActiveNumpad(activeNumpad === 'principal' ? null : 'principal')}
                >
                  {principalStr ? `₹${Number(principalStr).toLocaleString('en-IN')}` : <span className="text-muted-foreground">Tap to enter amount</span>}
                </div>
                <AnimatePresence>
                  {activeNumpad === 'principal' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {NUMPAD_KEYS.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleNumpadPress(key, setPrincipalStr, false)}
                            className="h-10 rounded-xl bg-white/80 text-sm font-semibold active:scale-95 transition-transform flex items-center justify-center"
                          >
                            {key === 'backspace' ? <Delete className="h-4 w-4" /> : key}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Interest Rate */}
              <div className={`${WARM.sand} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Annual Interest Rate (%)</Label>
                <div
                  className="mt-1.5 bg-white/60 rounded-md px-3 py-2 text-sm font-bold cursor-pointer min-h-[36px] flex items-center"
                  onClick={() => setActiveNumpad(activeNumpad === 'rate' ? null : 'rate')}
                >
                  {rateStr ? `${rateStr}%` : <span className="text-muted-foreground">Tap to enter rate</span>}
                </div>
                <AnimatePresence>
                  {activeNumpad === 'rate' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {NUMPAD_KEYS.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleNumpadPress(key, setRateStr, true)}
                            className="h-10 rounded-xl bg-white/80 text-sm font-semibold active:scale-95 transition-transform flex items-center justify-center"
                          >
                            {key === 'backspace' ? <Delete className="h-4 w-4" /> : key}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tenure */}
              <div className={`${WARM.linen} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Tenure (Months)</Label>
                <Input
                  type="number"
                  value={tenureStr}
                  onChange={(e) => setTenureStr(e.target.value)}
                  placeholder="e.g. 60"
                  className="mt-1.5 bg-white/60 border-0"
                  min="1"
                />
              </div>

              {/* Start Date */}
              <div className={`${WARM.yellow} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Loan Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 bg-white/60 border-0"
                />
              </div>

              {/* Purpose */}
              <div className={`${WARM.cream} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Purpose</Label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Church building renovation"
                  className="mt-1.5 bg-white/60 border-0 resize-none"
                  rows={2}
                />
              </div>

              {/* EMI Section */}
              <div className={`${WARM.blush} rounded-2xl p-4`}>
                <Label className="text-xs font-semibold text-foreground/70">Monthly EMI</Label>
                {calculatedEMI > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated: <span className="font-semibold text-foreground">₹{calculatedEMI.toLocaleString('en-IN')}</span>/month
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setUseCustomEMI(false)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${!useCustomEMI ? 'bg-primary text-primary-foreground' : 'bg-white/60 text-foreground/70'}`}
                  >
                    Use Calculated
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomEMI(true)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${useCustomEMI ? 'bg-primary text-primary-foreground' : 'bg-white/60 text-foreground/70'}`}
                  >
                    Enter Bank&apos;s EMI
                  </button>
                </div>
                {useCustomEMI && (
                  <>
                    <div
                      className="mt-2 bg-white/60 rounded-md px-3 py-2 text-sm font-bold cursor-pointer min-h-[36px] flex items-center"
                      onClick={() => setActiveNumpad(activeNumpad === 'emi' ? null : 'emi')}
                    >
                      {customEMIStr ? `₹${Number(customEMIStr).toLocaleString('en-IN')}` : <span className="text-muted-foreground">Tap to enter EMI</span>}
                    </div>
                    <AnimatePresence>
                      {activeNumpad === 'emi' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-3 gap-1.5 mt-2">
                            {NUMPAD_KEYS.map((key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleNumpadPress(key, setCustomEMIStr, false)}
                                className="h-10 rounded-xl bg-white/80 text-sm font-semibold active:scale-95 transition-transform flex items-center justify-center"
                              >
                                {key === 'backspace' ? <Delete className="h-4 w-4" /> : key}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
                {actualEMI > 0 && (
                  <p className="text-xs font-bold text-foreground mt-2">
                    EMI to use: ₹{actualEMI.toLocaleString('en-IN')}/month
                  </p>
                )}
              </div>

              <Button
                className="w-full rounded-2xl h-12 text-sm font-semibold"
                onClick={handleAddLoan}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Loan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Loans */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground mb-2">Active Loans ({activeLoans.length})</h2>
          {activeLoans.length === 0 ? (
            <div className={`${WARM.cream} rounded-2xl p-8 text-center text-sm text-muted-foreground`}>
              No active loans. Add one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {activeLoans.map((loan, i) => (
                <LoanCard key={loan.id} loan={loan} index={i} onClick={() => openDetail(loan)} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Loans */}
        {completedLoans.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground/60 mb-2 hover:text-foreground transition-colors"
            >
              Completed ({completedLoans.length})
              {showCompleted ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {completedLoans.map((loan, i) => (
                    <LoanCard key={loan.id} loan={loan} index={i} completed onClick={() => openDetail(loan)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Loan Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            {selectedLoan && (
              <LoanDetail
                loan={selectedLoan}
                onMarkCompleted={() => handleMarkCompleted(selectedLoan.id)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function LoanCard({ loan, index, completed, onClick }: { loan: Loan; index: number; completed?: boolean; onClick: () => void }) {
  const payments = getLocalLoanPayments(loan.id);
  const paid = payments.length;
  const progress = loan.tenure_months > 0 ? (paid / loan.tenure_months) * 100 : 0;
  const outstanding = completed ? 0 : calculateRemainingBalance(loan.principal_amount, loan.interest_rate, loan.monthly_emi, paid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`${CARD_COLORS[index % 4]} rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform ${completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-foreground/50 shrink-0" />
            <span className="text-sm font-bold text-foreground truncate">{loan.bank_name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{loan.purpose}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          {completed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> PAID OFF
            </span>
          ) : (
            <AnimatedNumber value={loan.monthly_emi} format={currencyFormat} className="text-sm font-extrabold text-foreground" />
          )}
          {!completed && <p className="text-[10px] text-muted-foreground">/month</p>}
        </div>
      </div>
      <Progress value={progress} className="h-1.5 mb-1.5" />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{paid} / {loan.tenure_months} paid</span>
        {!completed && <span>₹{outstanding.toLocaleString('en-IN')} left</span>}
      </div>
    </motion.div>
  );
}

function LoanDetail({ loan, onMarkCompleted }: { loan: Loan; onMarkCompleted: () => void }) {
  const payments = getLocalLoanPayments(loan.id);
  const schedule = getAmortizationSchedule(loan);
  const paid = payments.length;
  const outstanding = calculateRemainingBalance(loan.principal_amount, loan.interest_rate, loan.monthly_emi, paid);
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-5 w-5 text-primary" /> {loan.bank_name}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${WARM.cream} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Principal</p>
            <p className="text-sm font-bold">₹{loan.principal_amount.toLocaleString('en-IN')}</p>
          </div>
          <div className={`${WARM.blush} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Interest Rate</p>
            <p className="text-sm font-bold">{loan.interest_rate}% p.a.</p>
          </div>
          <div className={`${WARM.sand} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Monthly EMI</p>
            <p className="text-sm font-bold">₹{loan.monthly_emi.toLocaleString('en-IN')}</p>
          </div>
          <div className={`${WARM.linen} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Tenure</p>
            <p className="text-sm font-bold">{loan.tenure_months} months</p>
          </div>
          <div className={`${WARM.yellow} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Total Interest</p>
            <p className="text-sm font-bold">₹{totalInterest.toLocaleString('en-IN')}</p>
          </div>
          <div className={`${WARM.cream} rounded-xl p-3`}>
            <p className="text-[10px] text-muted-foreground">Outstanding</p>
            <p className="text-sm font-bold">₹{outstanding.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground">Purpose</p>
          <p className="text-sm font-semibold">{loan.purpose}</p>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground">Started</p>
          <p className="text-sm font-semibold">{format(new Date(loan.start_date), 'MMM d, yyyy')}</p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{paid} / {loan.tenure_months}</span>
          </div>
          <Progress value={(paid / loan.tenure_months) * 100} className="h-2" />
        </div>

        {/* Amortization Schedule */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2">Amortization Schedule</p>
          <div className="max-h-48 overflow-y-auto rounded-xl border">
            <table className="w-full text-[10px]">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="py-1.5 px-2 text-left font-semibold">#</th>
                  <th className="py-1.5 px-2 text-left font-semibold">Date</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Principal</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Interest</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => {
                  const isPaid = row.paymentNumber <= paid;
                  return (
                    <tr key={row.paymentNumber} className={isPaid ? 'bg-emerald-50/50' : ''}>
                      <td className="py-1 px-2">{row.paymentNumber}</td>
                      <td className="py-1 px-2">{format(new Date(row.date), 'MMM yy')}</td>
                      <td className="py-1 px-2 text-right">₹{row.principal.toLocaleString('en-IN')}</td>
                      <td className="py-1 px-2 text-right">₹{row.interest.toLocaleString('en-IN')}</td>
                      <td className="py-1 px-2 text-right">₹{row.balance.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mark Completed */}
        {loan.status === 'active' && (
          <Button
            variant="outline"
            className="w-full rounded-2xl gap-2"
            onClick={onMarkCompleted}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark as Paid Off
          </Button>
        )}
      </div>
    </>
  );
}
