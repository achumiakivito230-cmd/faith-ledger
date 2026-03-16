
-- Create a security definer function to get user's church_id without hitting RLS
CREATE OR REPLACE FUNCTION public.get_user_church_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Fix profiles SELECT policy to avoid self-referencing recursion
DROP POLICY IF EXISTS "Users can view church profiles" ON public.profiles;
CREATE POLICY "Users can view church profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR church_id = public.get_user_church_id(auth.uid())
  );

-- Fix offerings SELECT policy
DROP POLICY IF EXISTS "Users can view church offerings" ON public.offerings;
CREATE POLICY "Users can view church offerings"
  ON public.offerings FOR SELECT TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()));

-- Fix offerings INSERT policy
DROP POLICY IF EXISTS "Counters and treasurers can create offerings" ON public.offerings;
CREATE POLICY "Counters and treasurers can create offerings"
  ON public.offerings FOR INSERT TO authenticated
  WITH CHECK (
    church_id = public.get_user_church_id(auth.uid())
    AND (has_role(auth.uid(), 'counter') OR has_role(auth.uid(), 'treasurer'))
  );

-- Fix offerings UPDATE policy
DROP POLICY IF EXISTS "Counters and treasurers can update offerings" ON public.offerings;
CREATE POLICY "Counters and treasurers can update offerings"
  ON public.offerings FOR UPDATE TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND (has_role(auth.uid(), 'counter') OR has_role(auth.uid(), 'treasurer'))
    AND status = 'pending'
  );

-- Fix denominations policies
DROP POLICY IF EXISTS "Counters can create denominations" ON public.denominations;
CREATE POLICY "Counters can create denominations"
  ON public.denominations FOR INSERT TO authenticated
  WITH CHECK (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE church_id = public.get_user_church_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view denominations" ON public.denominations;
CREATE POLICY "Users can view denominations"
  ON public.denominations FOR SELECT TO authenticated
  USING (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE church_id = public.get_user_church_id(auth.uid())
    )
  );

-- Fix audit_logs policies
DROP POLICY IF EXISTS "Treasurers can view audit logs" ON public.audit_logs;
CREATE POLICY "Treasurers can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    church_id = public.get_user_church_id(auth.uid())
    AND has_role(auth.uid(), 'treasurer')
  );

-- Fix churches SELECT policy
DROP POLICY IF EXISTS "Users can view own church" ON public.churches;
CREATE POLICY "Users can view own church"
  ON public.churches FOR SELECT TO authenticated
  USING (id = public.get_user_church_id(auth.uid()));

-- Fix churches UPDATE policy
DROP POLICY IF EXISTS "Treasurers can update own church" ON public.churches;
CREATE POLICY "Treasurers can update own church"
  ON public.churches FOR UPDATE TO authenticated
  USING (
    id = public.get_user_church_id(auth.uid())
    AND has_role(auth.uid(), 'treasurer')
  );

-- Fix churches INSERT policy
DROP POLICY IF EXISTS "Users can create churches during onboarding" ON public.churches;
CREATE POLICY "Users can create churches during onboarding"
  ON public.churches FOR INSERT TO authenticated
  WITH CHECK (public.get_user_church_id(auth.uid()) IS NULL);

-- Fix user_roles SELECT policy
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.get_user_church_id(user_id) IS NOT NULL
      AND public.get_user_church_id(user_id) = public.get_user_church_id(auth.uid())
    )
  );
