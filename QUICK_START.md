# Quick Start: Complete Email Auth Setup

**Frontend:** ✅ DONE (code is ready)
**Backend:** ⏳ YOUR TURN (follow these steps)
**Testing:** 🧪 We'll test together via Gmail

---

## Your Action Items (In Order)

### 1. Enable Email Auth in Supabase (5 min)
Follow **SUPABASE_AUTH_SETUP.md** Steps 1-2:
- Go to Authentication → Providers → Email
- Turn ON "Enable Email Provider"
- Save

### 2. Add Redirect URLs (2 min)
Still in SUPABASE_AUTH_SETUP.md:
- Add `http://localhost:8081/` to authorized URLs
- Save

### 3. Create Test Users (3 min)
Choose ONE method:

**Option A (Easy - Dashboard):**
- Go to Authentication → Users
- Click "Add User"
- Email: `treasurer@church.com` Password: `TestPassword123`
- Check ✓ Auto confirm (skip email verification for now)
- Repeat for counter@, pastor@

**Option B (SQL - Recommended):**
- Go to SQL Editor
- Copy-paste SQL from SUPABASE_AUTH_SETUP.md Steps 3-4
- Run queries

### 4. Test Login Locally (2 min)
```bash
cd faith-ledger
npm run dev  # If not already running
```
- Open http://localhost:8081/
- Should redirect to /login
- Sign in with: `treasurer@church.com` / `TestPassword123`
- You should see Dashboard + nav items

---

## Testing Email Verification (With Gmail)

Once you enable email verification (Step 1 of SUPABASE_AUTH_SETUP.md):

1. **Create a test user WITHOUT auto-confirm:**
   - Email: `test@example.com` or use your email `achumiakivito230@gmail.com`
   - Password: `TestPassword123`
   - Leave ✗ Auto confirm UNCHECKED

2. **Check your Gmail inbox** for Supabase email:
   - From: `noreply@...@supabase.io`
   - Subject: "Confirm your signup"
   - I can monitor your inbox automatically ✓

3. **Click the verification link** in the email
   - You'll be redirected to `http://localhost:8081/`
   - You'll be logged in automatically

4. **Verify it worked:**
   - You see the Dashboard
   - All nav items visible
   - Name and role shown in top right

---

## What's Done

| Task | Status | Notes |
|------|--------|-------|
| Frontend Routes | ✅ | Protected routes + login/signup pages |
| Auth Hook | ✅ | useAuth manages session, profile, role |
| Logout | ✅ | Button in top right corner |
| Navigation | ✅ | Role-based filtering (treasurer role sees all) |
| Email Signup | ✅ | Real form with validation |
| Session Persistence | ✅ | localStorage + auto-refresh |
| **Backend Auth** | ⏳ | Enable in Supabase dashboard |
| **Test Users** | ⏳ | Create in Supabase |
| **Deployment** | ⏳ | After testing locally |

---

## Commands

```bash
# Start dev server (runs on http://localhost:8081)
npm run dev

# Build for production
npm run build

# View git log
git log --oneline

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

---

## Email Monitoring

I'm watching your Gmail for:
- ✉️ Supabase confirmation emails
- ✉️ Any signup verification links
- ✉️ Password reset requests

When you create a test user without auto-confirm, an email will arrive and I'll help you click the link to test the full flow.

---

## Next Steps

1. **Now:** Follow SUPABASE_AUTH_SETUP.md to enable email auth
2. **Then:** Create test users
3. **Then:** Test login at http://localhost:8081/
4. **Finally:** Deploy to Vercel

**Questions?** Check:
- Browser console (DevTools → Console) for errors
- Supabase dashboard (Authentication → Logs) for auth activity
- Gmail inbox for confirmation emails

---

**Time estimate:** 15 min total
