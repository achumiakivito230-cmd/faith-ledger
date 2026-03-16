CREATE OR REPLACE FUNCTION public.create_church_and_assign(_name text, _address text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_church_id uuid;
  v_church_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR btrim(_name) = '' THEN
    RAISE EXCEPTION 'Church name is required';
  END IF;

  SELECT church_id
  INTO v_existing_church_id
  FROM public.profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing_church_id IS NOT NULL THEN
    RETURN v_existing_church_id;
  END IF;

  INSERT INTO public.churches (name, address)
  VALUES (
    btrim(_name),
    NULLIF(btrim(COALESCE(_address, '')), '')
  )
  RETURNING id INTO v_church_id;

  UPDATE public.profiles
  SET church_id = v_church_id,
      updated_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  RETURN v_church_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_church_and_assign(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_church_and_assign(text, text) TO authenticated;