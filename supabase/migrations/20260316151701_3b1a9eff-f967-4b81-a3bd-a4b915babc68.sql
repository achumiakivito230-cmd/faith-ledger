
-- Enum types
CREATE TYPE public.app_role AS ENUM ('treasurer', 'counter', 'pastor');
CREATE TYPE public.offering_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.audit_action AS ENUM (
  'create_offering', 'verify_offering', 'reject_offering',
  'login', 'logout', 'change_password', 'create_user'
);

-- Churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Offerings table
CREATE TABLE public.offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status offering_status NOT NULL DEFAULT 'pending',
  counted_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  verified_by_user_id UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

-- Denominations table (one-to-one with offerings)
CREATE TABLE public.denominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL UNIQUE REFERENCES public.offerings(id) ON DELETE CASCADE,
  note_500 INT NOT NULL DEFAULT 0,
  note_200 INT NOT NULL DEFAULT 0,
  note_100 INT NOT NULL DEFAULT 0,
  note_50 INT NOT NULL DEFAULT 0,
  note_20 INT NOT NULL DEFAULT 0,
  note_10 INT NOT NULL DEFAULT 0,
  total_notes INT NOT NULL DEFAULT 0
);
ALTER TABLE public.denominations ENABLE ROW LEVEL SECURITY;

-- Audit log table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  performed_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  church_id UUID REFERENCES public.churches(id),
  offering_id UUID REFERENCES public.offerings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON public.offerings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'counter'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Churches: users can see their own church
CREATE POLICY "Users can view own church" ON public.churches
  FOR SELECT TO authenticated
  USING (id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Treasurers can create churches" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Profiles: users can see profiles in their church
CREATE POLICY "Users can view church profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles: users can see roles in their church
CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IN (
    SELECT p2.user_id FROM public.profiles p1
    JOIN public.profiles p2 ON p1.church_id = p2.church_id
    WHERE p1.user_id = auth.uid()
  ));

-- Offerings: church members can see offerings
CREATE POLICY "Users can view church offerings" ON public.offerings
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Counters and treasurers can create offerings" ON public.offerings
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.has_role(auth.uid(), 'counter') OR public.has_role(auth.uid(), 'treasurer'))
  );

CREATE POLICY "Counters and treasurers can update offerings" ON public.offerings
  FOR UPDATE TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid())
    AND (public.has_role(auth.uid(), 'counter') OR public.has_role(auth.uid(), 'treasurer'))
    AND status = 'pending'
  );

-- Denominations
CREATE POLICY "Users can view denominations" ON public.denominations
  FOR SELECT TO authenticated
  USING (offering_id IN (
    SELECT id FROM public.offerings WHERE church_id IN (
      SELECT church_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Counters can create denominations" ON public.denominations
  FOR INSERT TO authenticated
  WITH CHECK (offering_id IN (
    SELECT id FROM public.offerings WHERE church_id IN (
      SELECT church_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- Audit logs
CREATE POLICY "Treasurers can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.profiles WHERE user_id = auth.uid())
    AND public.has_role(auth.uid(), 'treasurer')
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (performed_by_user_id = auth.uid());
