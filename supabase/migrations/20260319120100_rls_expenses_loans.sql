-- RLS policies for expenses table
CREATE POLICY "Users can view church expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()));

CREATE POLICY "Counters and treasurers can create expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (
    church_id = public.get_user_church_id(auth.uid())
    AND (public.has_role(auth.uid(), 'counter') OR public.has_role(auth.uid(), 'treasurer'))
  );

CREATE POLICY "Treasurers can update expenses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

CREATE POLICY "Treasurers can delete expenses"
  ON public.expenses FOR DELETE TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

-- RLS policies for loans table
CREATE POLICY "Users can view church loans"
  ON public.loans FOR SELECT TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()));

CREATE POLICY "Treasurers can create loans"
  ON public.loans FOR INSERT TO authenticated
  WITH CHECK (
    church_id = public.get_user_church_id(auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

CREATE POLICY "Treasurers can update loans"
  ON public.loans FOR UPDATE TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

CREATE POLICY "Treasurers can delete loans"
  ON public.loans FOR DELETE TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

-- RLS policies for loan_payments table
CREATE POLICY "Users can view loan payments"
  ON public.loan_payments FOR SELECT TO authenticated
  USING (
    loan_id IN (
      SELECT id FROM public.loans
      WHERE church_id = public.get_user_church_id(auth.uid())
    )
  );

CREATE POLICY "Counters and treasurers can create loan payments"
  ON public.loan_payments FOR INSERT TO authenticated
  WITH CHECK (
    loan_id IN (
      SELECT id FROM public.loans
      WHERE church_id = public.get_user_church_id(auth.uid())
    )
    AND (public.has_role(auth.uid(), 'counter') OR public.has_role(auth.uid(), 'treasurer'))
  );
