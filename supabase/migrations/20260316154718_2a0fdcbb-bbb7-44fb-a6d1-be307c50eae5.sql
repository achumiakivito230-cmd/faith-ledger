
-- Fix: only allow church creation if user doesn't already have one
DROP POLICY IF EXISTS "Users can create churches during onboarding" ON public.churches;
CREATE POLICY "Users can create churches during onboarding"
  ON public.churches FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.church_id IS NOT NULL
    )
  );
