import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { motion } from 'framer-motion';
import { CalendarIcon, Send } from 'lucide-react';
import { AnimatedText } from '@/components/ui/animated-text';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types';
import type { ExpenseCategory, PaymentMethod } from '@/types';
import { mockChurch } from '@/lib/mockData';
import { saveLocalExpense } from '@/lib/localStorage';

const generateId = () => `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function NewExpensePage() {
  const { user, churchId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    if (!user) return;
    if (!category) {
      toast({ title: 'Error', description: 'Please select a category.', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Please enter a description.', variant: 'destructive' });
      return;
    }
    if (parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Amount must be greater than zero.', variant: 'destructive' });
      return;
    }
    if (date > new Date()) {
      toast({ title: 'Error', description: 'Date cannot be in the future.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const expense = {
        id: generateId(),
        church_id: churchId || mockChurch.id,
        date: format(date, 'yyyy-MM-dd'),
        category: category as ExpenseCategory,
        description: description.trim(),
        amount: parsedAmount,
        payment_method: paymentMethod as PaymentMethod,
        notes: notes.trim() || null,
        created_by_user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveLocalExpense(expense);
      toast({ title: 'Expense Recorded', description: `₹${parsedAmount.toLocaleString('en-IN')} recorded successfully.` });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record expense';
      console.error('Submit error:', err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const formSections = [
    {
      bg: 'bg-[#fef3c7]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
    {
      bg: 'bg-[#fde8e8]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      bg: 'bg-[#fdf2d6]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Description</Label>
          <Input
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      ),
    },
    {
      bg: 'bg-[#f5e8d2]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Amount (₹)</Label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-tabular text-lg"
          />
        </div>
      ),
    },
    {
      bg: 'bg-[#fef3c7]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      bg: 'bg-[#fde8e8]',
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 pb-16">
        <div className="pt-1">
          <AnimatedText text="New Expense" textClassName="text-[28px] font-extrabold tracking-tight text-foreground" underlineHeight="h-0.5" underlineOffset="-bottom-1" duration={0.04} delay={0.03} />
          <p className="text-sm text-muted-foreground mt-2">Record a church expense</p>
        </div>

        {/* Form sections */}
        <div className="space-y-2.5">
          {formSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`${section.bg} rounded-2xl p-3.5`}
            >
              {section.content}
            </motion.div>
          ))}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-4 rounded-2xl bg-[#fde8e8] p-4 shadow-elevated">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Expense Amount</p>
              <p className="text-3xl font-semibold font-tabular text-card-foreground">
                ₹{parsedAmount.toLocaleString('en-IN')}
              </p>
              {category && (
                <p className="text-xs text-muted-foreground">{category}</p>
              )}
            </div>
          </div>
          <Button
            className="w-full active:scale-[0.98] transition-transform"
            onClick={handleSubmit}
            disabled={submitting || parsedAmount <= 0}
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? 'Recording...' : 'Record Expense'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
