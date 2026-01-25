# Login Flow - Manual Test Checklist

## Pre-requisites ✅

- [x] Build successful (`npm run build`)
- [ ] Environment variables set in `.env`
- [ ] Test user created in Supabase
- [ ] Development server running (`npm run dev`)

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in Supabase credentials from your Supabase Dashboard:
```env
# Server-side (private) - from Supabase Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Client-side (public) - from Supabase Settings > API
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Create test user in Supabase Dashboard:
   - Go to Authentication > Users
   - Click "Add user"
   - Email: `test@example.com`
   - Password: `test1234`
   - Confirm email (disable email confirmation for testing)

## Test Scenarios

### ✅ Test 1: Access Login Page (Unauthenticated)
**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000/login`

**Expected Result:**
- Login form is displayed
- No errors in console
- Form has email and password fields
- "Forgot password?" link visible
- "Sign up" link visible

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 2: Email Validation
**Steps:**
1. Go to `/login`
2. Enter invalid email: `test` (no @ symbol)
3. Enter password: `anything`
4. Click "Sign in"

**Expected Result:**
- Error message under email field: "Please enter a valid email address"
- Form does not submit
- No API call made

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 3: Required Fields Validation
**Steps:**
1. Go to `/login`
2. Leave email empty
3. Click "Sign in"

**Expected Result:**
- Error message under email field: "Email is required"
- Form does not submit

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 4: Failed Login - Invalid Credentials
**Steps:**
1. Go to `/login`
2. Enter email: `test@example.com`
3. Enter wrong password: `wrongpassword`
4. Click "Sign in"

**Expected Result:**
- Toast notification appears: "Invalid email or password. Please try again."
- User stays on login page
- Button returns to "Sign in" state (not loading)
- Network tab shows POST to `/api/auth/login` with 401 status

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 5: Successful Login - User WITH Active Planner
**Pre-requisite:** Test user has an active planner in database

**Steps:**
1. Go to `/login`
2. Enter email: `test@example.com`
3. Enter correct password: `test1234`
4. Click "Sign in"

**Expected Result:**
- Toast notification: "Login successful"
- Redirect to `/plans/{planner-id}` (dashboard of active planner)
- User is authenticated (check cookies in DevTools)
- Network tab shows:
  - POST to `/api/auth/login` with 200 status
  - Supabase auth cookies set

**Status:** [ ] PASS / [x] FAIL
NOTE: REDIRECTS TO PLANS NOT THE ACTIVE PLAN
---

### ✅ Test 6: Successful Login - User WITHOUT Active Planner
**Pre-requisite:** Test user has NO active planner in database

**Steps:**
1. Go to `/login`
2. Enter email: `test@example.com`
3. Enter correct password: `test1234`
4. Click "Sign in"

**Expected Result:**
- Toast notification: "Login successful"
- Redirect to `/plans` (planners list page)
- User is authenticated

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 7: Redirect Authenticated User from Login
**Pre-requisite:** User is already logged in

**Steps:**
1. Login successfully (Test 5 or 6)
2. Manually navigate to `/login` in address bar

**Expected Result:**
- Immediate redirect to `/` (home page)
- Then redirect based on active planner status
- User never sees login form

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 8: Protected Route Access (Unauthenticated)
**Steps:**
1. Logout or use incognito mode
2. Try to access `/plans`

**Expected Result:**
- Immediate redirect to `/login`
- User cannot access protected page

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 9: Session Persistence
**Steps:**
1. Login successfully
2. Close browser tab
3. Open new tab
4. Navigate to `http://localhost:3000`

**Expected Result:**
- User is still authenticated
- Redirect works based on active planner
- No need to login again

**Status:** [ ] PASS / [x] FAIL 
NOTE: REDIRECTS TO PLANS NOT THE ACTIVE PLAN



---

### ✅ Test 10: Loading State
**Steps:**
1. Go to `/login`
2. Enter valid credentials
3. Click "Sign in"
4. Observe button during API call

**Expected Result:**
- Button text changes to "Signing in..."
- Button is disabled during submission
- Cannot submit form multiple times

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 11: Error Clearing on Input
**Steps:**
1. Go to `/login`
2. Leave email empty and submit (trigger error)
3. Start typing in email field

**Expected Result:**
- Error message under email field disappears as soon as user starts typing
- Good UX - immediate feedback

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 12: Network Error Handling
**Steps:**
1. Go to `/login`
2. Open DevTools > Network tab
3. Enable "Offline" mode
4. Enter valid credentials and submit

**Expected Result:**
- Toast notification: "An unexpected error occurred. Please try again."
- Button returns to normal state
- User can retry

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 13: Logout Functionality
**Pre-requisite:** User is logged in

**Steps:**
1. Login successfully
2. Click on user avatar in top-right corner
3. Click "Log out" from dropdown menu

**Expected Result:**
- Toast notification: "Logged out successfully"
- Redirect to `/login`
- User is no longer authenticated
- Cannot access protected routes without logging in again
- Network tab shows POST to `/api/auth/logout` with 200 status
- Auth cookies are cleared

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 14: Logout Loading State
**Pre-requisite:** User is logged in

**Steps:**
1. Open user menu
2. Click "Log out"
3. Observe button text during API call

**Expected Result:**
- Button text changes to "Logging out..."
- Button is disabled during logout
- Cannot click logout multiple times

**Status:** [x] PASS / [ ] FAIL

---

### ✅ Test 15: Logout Error Handling
**Steps:**
1. Login successfully
2. Open DevTools > Network tab
3. Enable "Offline" mode
4. Click "Log out"

**Expected Result:**
- Toast notification: "Failed to log out" with error description
- User remains logged in
- Can retry logout

**Status:** [x] PASS / [ ] FAIL

---

## Browser Compatibility

Test in multiple browsers:
- [x] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

## Security Checks

- [ ] Passwords are not visible in Network tab
- [ ] Auth cookies have `httpOnly` flag
- [ ] Auth cookies have `secure` flag (in production)
- [ ] Auth cookies have `sameSite: lax`
- [ ] No sensitive data in console logs
- [ ] Generic error messages for auth failures (no "user not found" vs "wrong password")

## Performance Checks

- [ ] Login form loads quickly (< 1s)
- [ ] API response time < 2s
- [ ] No console errors or warnings
- [ ] No memory leaks (check DevTools Memory tab)

## Accessibility Checks

- [ ] Can navigate form with keyboard (Tab)
- [ ] Can submit with Enter key
- [ ] Error messages have proper ARIA attributes
- [ ] Form inputs have labels
- [ ] Focus visible on all interactive elements

---

## Summary

**Total Tests:** 15  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Tested By:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production  

## Notes

(Add any additional observations, bugs found, or suggestions here)

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint

# Build for production
npm run build
```

## Troubleshooting

### Issue: "Cannot connect to Supabase"
**Solution:** Check environment variables are set correctly

### Issue: "User not found" even with correct credentials
**Solution:** Verify user exists in Supabase Dashboard and email is confirmed

### Issue: Redirect loop
**Solution:** Check middleware PUBLIC_PATHS configuration

### Issue: Cookies not persisting
**Solution:** 
- In development: Check `secure: true` might need to be `false` for localhost
- In production: Ensure HTTPS is enabled
