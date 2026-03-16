# Phone OTP Authentication Implementation

## ✅ Completed Changes

### 1. **useAuth.tsx** (`src/hooks/useAuth.tsx`)
- Replaced `signUp(email, password, name, role)` with `sendOtp(phone, name, role)`
- Replaced `signIn(email, password)` with `verifyOtp(phone, token)`
- Both methods handle `+91` country code prefix automatically
- OTP data includes user `name` and `role` for automatic profile creation

### 2. **Login.tsx** (`src/pages/Login.tsx`)
- **Step 1 (Phone Entry):**
  - Input: Full Name
  - Input: Phone number (10 digits only, +91 prefix shown as read-only)
  - Dropdown: Role selection (Treasurer / Counter / Pastor)
  - Button: "Send OTP"

- **Step 2 (OTP Verification):**
  - Shows phone number: "+91XXXXXXXXXX"
  - Input: 6-digit OTP code (formatted for easy entry)
  - Button: "Verify & Login"
  - Button: "Resend Code" (disabled until 30s countdown finishes)
  - Button: "Change Phone Number" (returns to step 1)

### 3. **Signup.tsx** (`src/pages/Signup.tsx`)
- Replaced with simple redirect to `/login`
- Signup flow merged into login (first login with new phone = automatic account creation)

### 4. **App.tsx** (`src/App.tsx`)
- Removed `/signup` route import and definition
- `/signup` path now redirects to `/login` via Signup.tsx

### 5. **Types** (`src/types/index.ts`)
- Added optional `phone?: string` field to `Profile` interface

## ⏳ Remaining Steps (User Must Complete)

### Step 0: Enable Phone Provider in Supabase
1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** provider and toggle **Enable**
4. SMS provider will default to Supabase built-in (for testing)
5. Save changes

### Step 1: Database Migration
Run this SQL in **Supabase SQL Editor**:

```sql
-- Make email nullable (phone users won't have email)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET DEFAULT '';

-- Add phone column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update trigger to handle phone auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.phone, NEW.email, 'User'),
    COALESCE(NEW.email, ''),
    NEW.phone
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'counter'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Testing Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit** `http://localhost:5173/login`

3. **Test new user flow:**
   - Enter phone: `9876543210`
   - Enter name: `John Doe`
   - Select role: `Counter`
   - Click "Send OTP"
   - Wait for SMS (Supabase test mode shows OTP in logs)
   - Enter 6-digit code
   - Click "Verify & Login"
   - Should land on Dashboard

4. **Test returning user:**
   - Sign out (button on dashboard)
   - Visit `/login` again
   - Same phone number
   - New name/role inputs are shown but will be ignored (profile already exists)
   - Verify OTP → logs in with existing profile

5. **Test resend:**
   - On OTP step, wait 30s or click "Resend Code" after countdown
   - Should receive new OTP

6. **Verify no TypeScript errors:**
   ```bash
   npm run build
   ```

## Architecture Notes

- **OTP Storage:** Supabase handles OTP generation and validation (SMS)
- **Auto User Creation:** Supabase trigger creates profile + role on first login
- **Phone Format:** All phone numbers are stored with `+91` prefix
- **Role Metadata:** Role is passed in auth metadata and transferred to profiles on signup
- **Email Not Required:** Email is optional, defaults to empty string for phone-only users

## Rollback Plan (if needed)

1. Revert Supabase Phone provider to disabled
2. Restore previous `useAuth.tsx`, `Login.tsx`, `App.tsx`, `Signup.tsx`
3. Users on old email/password still work (separate auth provider)

## Files Modified

- ✅ `src/hooks/useAuth.tsx` — OTP methods
- ✅ `src/pages/Login.tsx` — 2-step form
- ✅ `src/pages/Signup.tsx` — Redirect only
- ✅ `src/App.tsx` — Remove /signup route
- ✅ `src/types/index.ts` — Add phone field
- ✅ Build passes with no errors

## Next: Manual Supabase Steps

Once you complete the Supabase setup (enable Phone provider + run migration), the app is ready to use.
