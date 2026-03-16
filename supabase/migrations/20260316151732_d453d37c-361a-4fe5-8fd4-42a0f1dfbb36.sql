
-- Fix overly permissive church creation policy
DROP POLICY "Treasurers can create churches" ON public.churches;

-- Only allow church creation during onboarding (user has no church yet)
CREATE POLICY "Users can create churches during onboarding" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND church_id IS NOT NULL)
  );

-- Allow treasurers to update their church
CREATE POLICY "Treasurers can update own church" ON public.churches
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );
