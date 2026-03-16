# Authentication Setup Checklist for Faith Ledger

## Current Status ✓ (What's Already Done)

### Infrastructure
- ✅ Supabase project configured (`vmdipvvnqsraoyjbevdk`)
- ✅ Environment variables in `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- ✅ Supabase client initialized with localStorage persistence & auto-refresh
- ✅ Database tables exist:
  - `profiles` (user profiles linked to auth)
  - `user_roles` (role assignments: treasurer, counter, pastor)
  - `churches` (church data)
  - `offerings` (offering records)
  - `denominations` (currency denominations)
  - `audit_logs` (activity tracking)

### Frontend Components
- ✅ Login page (`src/pages/Login.tsx`) - form exists, styled, ready
- ✅ Signup page (`src/pages/Signup.tsx`) - placeholder (redirects to login)
- ✅ `useAuth` hook (`src/hooks/useAuth.tsx`) - complete auth context
- ✅ Auth UI components (Button, Input, Label from shadcn)
- ✅ Error handling & toast notifications

## What's NOT Done ❌ (What I Need to Set Up)

### 1. **Supabase Authentication Methods** (Backend)
- [ ] Enable **Email/Password** auth in Supabase Auth settings
  - Need to: Go to Supabase dashboard → Authentication → Providers → Email
  - Enable email provider
  - Set password policy (min 8 chars recommended)

- [ ] Enable **Email Confirmations** (optional but recommended for church apps)
  - Confirm email addresses before account creation
  - Prevents spam signups

### 2. **User Management in Supabase**
- [ ] Create test users in Supabase Auth (for testing)
  - Email: `treasurer@church.com`, Password: `test123456`
  - Email: `counter@church.com`, Password: `test123456`
  - Email: `pastor@church.com`, Password: `test123456`

- [ ] Create matching profiles in `profiles` table (for each test user)
  - Link auth user to profile with correct `user_id`
  - Set `name`, `email`, `church_id`, `is_active`, etc.

- [ ] Assign roles in `user_roles` table
  - treasurer → can view Dashboard, New Offering, History, Analytics, Verify
  - counter → can count offerings
  - pastor → admin role (full access)

### 3. **Route Protection** (Frontend)
- [ ] Implement `ProtectedRoute` component properly
  - Currently just returns children (no auth check)
  - Should: Check if `user` exists, redirect to `/login` if not

- [ ] Update routing to enforce login for protected pages:
  - `/` (Dashboard)
  - `/new-offering`
  - `/history`
  - `/verify`
  - `/analytics`
  - Allow public access: `/login`, `/church-setup` (maybe)

### 4. **Signup Flow** (Optional but Useful)
- [ ] Replace Signup redirect with actual signup form
  - Email validation
  - Password strength check
  - Terms acceptance
  - Church selection
  - Auto-create profile on signup

### 5. **Auth Persistence & Session Management**
- [ ] Verify localStorage session persistence works
  - Already configured in `supabase/client.ts`
  - Test: Log in → refresh page → should stay logged in

- [ ] Handle session refresh on app load
  - Already in `useAuth` hook
  - Test: Close app → reopen → should check if session valid

### 6. **Logout Functionality** (Partial)
- [ ] Add logout button to navbar/menu
  - `useAuth` has `signOut` method
  - Needs UI: Dropdown menu in header with logout option

### 7. **Error Handling & Edge Cases**
- [ ] Handle password reset flow (optional)
- [ ] Handle token expiration
- [ ] Handle account not found / invalid credentials
- [ ] Display proper error messages to users

### 8. **Deployment (Vercel)**
- [ ] Add environment variables to Vercel
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Use Supabase's **anon key** (safe for frontend, no secrets)

- [ ] Set Supabase CORS settings
  - Allow domain: `https://your-vercel-domain.vercel.app`

## What I Need From You

Before I implement, please clarify:

1. **Should signup be available?**
   - [ ] Yes, open signup (anyone can create account)
   - [ ] No, only admins create accounts (I create them manually in Supabase)
   - [ ] Approval flow (signup → pending → admin approves → activated)

2. **Email verification requirement?**
   - [ ] Yes, users must verify email to log in
   - [ ] No, sign up and login immediately

3. **Test credentials:**
   - What email addresses should I use for test users?
   - Do you have a church name to set for `church_id`?

4. **Role assignment:**
   - Should each role have different permissions visible in UI?
   - Currently all roles see all nav items (treasurer role shows everything)
   - Should we restrict features by role? (e.g., `counter` can't see Analytics)

5. **Password reset:**
   - Should users be able to reset forgotten passwords?
   - [ ] Yes, send reset link via email
   - [ ] No, admins will reset manually

## Implementation Order (Once You Answer Above)

1. Supabase Auth setup (Email/Password provider)
2. Create test users in Supabase
3. Implement `ProtectedRoute` + redirect to login
4. Test login flow with real credentials
5. Add logout button to navbar
6. (Optional) Implement proper signup flow
7. Deploy to Vercel with env vars
8. Test production login

---

**Time estimate:** 2-3 hours for basic email/password auth + login protection
