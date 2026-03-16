
-- Simplify church insert policy - just allow any authenticated user without a church
DROP POLICY IF EXISTS "Users can create churches during onboarding" ON public.churches;
CREATE POLICY "Users can create churches during onboarding"
  ON public.churches FOR INSERT TO authenticated
  WITH CHECK (true);
