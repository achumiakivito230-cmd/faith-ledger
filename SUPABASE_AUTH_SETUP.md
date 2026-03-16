# Supabase Email/Password Authentication Setup

**Your Email:** `achumiakivito230@gmail.com`

This guide will help you enable email/password authentication in Supabase and create test users for the Faith Ledger app.

## Step 1: Enable Email Authentication in Supabase Dashboard

1. Go to https://app.supabase.com
2. Sign in with your account
3. Select your project: **vmdipvvnqsraoyjbevdk** (Faith Ledger)
4. Navigate to **Authentication** → **Providers** (left sidebar)
5. Find **Email** provider and click it
6. Toggle **Enable Email Provider** ON
7. Configure:
   - **Autoconfirm user:** Leave OFF (users must verify email)
   - **Confirm email:** Leave ON
   - **Confirm change email:** Leave ON
8. Click **Save**

## Step 2: Add Authorized Redirect URLs

This tells Supabase where email verification links can redirect:

1. In Authentication → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:8081/
   http://localhost:8080/
   https://your-vercel-domain.vercel.app/
   ```
3. Click **Save**

## Step 3: Create Test Users (Option A: Via Supabase Dashboard)

1. Go to **Authentication** → **Users**
2. Click **+ Add User**
3. Create first user:
   - **Email:** `treasurer@church.com`
   - **Password:** `TestPassword123`
   - Check ✓ **Auto send sign up confirmation**
4. Click **Create User**
5. The user will receive a confirmation email

Repeat for:
- **counter@church.com** / `TestPassword123`
- **pastor@church.com** / `TestPassword123`

## Step 4: Create User Profiles

Users won't have profiles yet. You need to create them:

1. Go to **SQL Editor** (left sidebar)
2. Click **+ New Query**
3. Paste this SQL:

```sql
-- Create profile for treasurer
INSERT INTO public.profiles (id, user_id, name, email, church_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'treasurer@church.com'),
  'Treasurer Demo',
  'treasurer@church.com',
  NULL,
  true,
  NOW(),
  NOW()
);

-- Create profile for counter
INSERT INTO public.profiles (id, user_id, name, email, church_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'counter@church.com'),
  'Counter Demo',
  'counter@church.com',
  NULL,
  true,
  NOW(),
  NOW()
);

-- Create profile for pastor
INSERT INTO public.profiles (id, user_id, name, email, church_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'pastor@church.com'),
  'Pastor Demo',
  'pastor@church.com',
  NULL,
  true,
  NOW(),
  NOW()
);
```

4. Click **Run** (play button)
5. Check for success: "Query executed successfully"

## Step 5: Assign Roles

Still in SQL Editor, create a new query:

```sql
-- Assign treasurer role
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'treasurer@church.com'),
  'treasurer',
  NOW(),
  NOW()
);

-- Assign counter role
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'counter@church.com'),
  'counter',
  NOW(),
  NOW()
);

-- Assign pastor role
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'pastor@church.com'),
  'pastor',
  NOW(),
  NOW()
);
```

Click **Run**.

## Step 6: Test Email Verification

Users created in Supabase will receive confirmation emails. They need to click the link to verify.

**For testing locally:**
1. Check email at **Gmail** (achumiakivito230@gmail.com)
2. Look for emails from Supabase `<noreply@...@supabase.io>`
3. Click the verification link
4. You'll be redirected to `http://localhost:8081/` with an auth session

**Email verification uses a one-time token in the URL.** The token is valid for 24 hours.

## Step 7: Test the App

### Local Testing
1. Start dev server: `npm run dev`
2. Go to `http://localhost:8081/`
3. You should be redirected to login
4. Sign in with:
   - Email: `treasurer@church.com`
   - Password: `TestPassword123`
5. You should see the Dashboard
6. Nav items should show: Dashboard, New Offering, History, Verify, Analytics
7. Click **Logout** (top right) to sign out

### Test Different Roles
- **Treasurer:** All nav items visible
- **Counter:** Restricted access (if role-based UI is implemented)
- **Pastor:** Full access

## Step 8: Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "feat: implement email/password auth with protected routes"
   git push origin main
   ```

2. Vercel will auto-deploy

3. After deploy, add your Vercel domain to Supabase redirect URLs:
   ```
   https://faith-ledger-[random].vercel.app/
   ```

4. Update GitHub with new redirect URL and redeploy

## Troubleshooting

### "User not confirmed" error when logging in
- User hasn't verified their email yet
- **Solution:** Check email (achumiakivito230@gmail.com), click verification link, retry login

### Confirmation emails not arriving
- Check Gmail spam folder
- Verify email address in Supabase Auth → Users is correct
- Check if Email provider is enabled

### Session not persisting after refresh
- Check browser localStorage (DevTools → Application)
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`

### Profile not found error
- Profile wasn't created in SQL step
- Re-run the INSERT profiles query from Step 4

## Next Steps (Optional Enhancements)

1. **Real signup flow** — App already has it! Just needs Supabase email provider enabled
2. **Password reset** — Users can request password reset via "Forgot Password"
3. **Email change** — Users can change email from settings
4. **Session timeout** — Add auto-logout after inactivity
5. **2FA** — Enable TOTP or SMS 2FA in Supabase Auth

---

**Need help?**
- Supabase Docs: https://supabase.com/docs/guides/auth/passwords
- Check browser console for errors (DevTools → Console)
- Check Supabase dashboard logs (Authentication → Logs)
