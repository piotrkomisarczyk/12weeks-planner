# Foreign Key Constraint Fix - User Registration Issue

## Problem

When a newly registered user attempted to create their first planner, the application threw a foreign key constraint violation error:

```
Error: Failed to create plan: insert or update on table "plans" violates foreign key constraint "plans_user_id_fkey"
```

## Root Cause

The API endpoints were using a hardcoded `DEFAULT_USER_ID` instead of the authenticated user's actual ID from the session:

```typescript
// OLD CODE - INCORRECT
const userId = DEFAULT_USER_ID; // Hardcoded: 'dac44a9c-c1a0-4c6b-bed0-127e367a4fe3'
```

### Why This Failed

1. **New User Registration**: When a user registers, Supabase creates a new user with a unique UUID in the `auth.users` table
2. **Hardcoded User ID**: The API endpoint used a hardcoded UUID that didn't match the newly registered user
3. **Foreign Key Constraint**: The database enforces that `plans.user_id` must reference an existing `auth.users.id`
4. **Result**: Database rejected the insert operation

## Solution

### 1. Fixed `/api/v1/plans` Endpoint

Changed the authentication logic to use the actual authenticated user from `locals.user`:

```typescript
// NEW CODE - CORRECT
const userId = locals.user?.id;

if (!userId) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "You must be logged in to access this resource",
    } as ErrorResponse),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Changes Made:**

- Removed import of `DEFAULT_USER_ID`
- Added proper authentication check in both GET and POST handlers
- Returns 401 Unauthorized if user is not authenticated

### 2. Fixed Middleware Logic

Corrected the middleware to consistently use `locals.user` (which includes email verification check):

```typescript
// OLD CODE - INCONSISTENT
if (user && isPublicPath && url.pathname !== "/api/auth/logout") {
  return redirect("/plans");
}

if (!user && !isPublicPath) {
  return redirect("/login");
}
```

```typescript
// NEW CODE - CONSISTENT
if (locals.user && isPublicPath && url.pathname !== "/api/auth/logout") {
  return redirect("/plans");
}

if (!locals.user && !isPublicPath) {
  return redirect("/login");
}
```

**Why This Matters:**

- `user` - Raw user object from Supabase (may have unverified email)
- `locals.user` - Only set if email is verified
- Ensures consistent authentication state throughout the application

## Testing

After applying these fixes, test the following flow:

1. **Register a new user**

   ```bash
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```

2. **Verify email** (if email confirmation is enabled in Supabase)
   - Click the verification link in the email
   - Should redirect to `/login?verified=true`

3. **Login**

   ```bash
   POST /api/auth/login
   {
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```

4. **Create a plan**

   ```bash
   POST /api/v1/plans
   {
     "name": "My First Plan",
     "start_date": "2026-01-27"
   }
   ```

   Should return 201 Created with the plan data

## Important Notes

### Email Verification Requirement

The middleware requires email verification before allowing access:

```typescript
// Only set locals.user if email is verified
locals.user =
  user && isEmailVerified
    ? {
        id: user.id,
        email: user.email,
      }
    : null;
```

**Implications:**

- Users must verify their email before they can create plans
- If Supabase email confirmation is disabled, users can access immediately after registration
- If enabled, users must click the verification link first

### Complete Fix Applied

**All API endpoints and Astro pages have been updated!** ✅

The following changes were applied across the entire codebase:

#### API Endpoints Fixed (31 files):

- ✅ `/api/v1/plans.ts` (GET, POST)
- ✅ `/api/v1/plans/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/plans/[id]/dashboard.ts` (GET)
- ✅ `/api/v1/plans/[id]/archive.ts` (POST)
- ✅ `/api/v1/plans/[id]/goals.ts` (GET)
- ✅ `/api/v1/goals/index.ts` (GET, POST)
- ✅ `/api/v1/goals/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/goals/[goalId]/milestones.ts` (GET)
- ✅ `/api/v1/goals/[goalId]/tasks.ts` (GET)
- ✅ `/api/v1/goals/[goalId]/weekly-goals.ts` (GET)
- ✅ `/api/v1/milestones.ts` (GET, POST)
- ✅ `/api/v1/milestones/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/milestones/[milestoneId]/tasks.ts` (GET)
- ✅ `/api/v1/milestones/[milestoneId]/weekly-goals.ts` (GET)
- ✅ `/api/v1/weekly-goals/index.ts` (GET, POST)
- ✅ `/api/v1/weekly-goals/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/weekly-reviews/index.ts` (GET, POST)
- ✅ `/api/v1/weekly-reviews/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/weekly-reviews/[id]/complete.ts` (POST)
- ✅ `/api/v1/weekly-reviews/week/[weekNumber].ts` (GET)
- ✅ `/api/v1/tasks/index.ts` (GET, POST)
- ✅ `/api/v1/tasks/[id].ts` (GET, PATCH, DELETE)
- ✅ `/api/v1/tasks/[id]/copy.ts` (POST)
- ✅ `/api/v1/tasks/[taskId]/history.ts` (GET)
- ✅ `/api/v1/tasks/daily.ts` (GET)
- ✅ `/api/v1/users/metrics.ts` (GET)
- ✅ `/api/v1/export.ts` (GET)

#### Astro Pages Fixed (7 files):

- ✅ `/pages/plans/[id]/index.astro`
- ✅ `/pages/plans/[id]/edit.astro`
- ✅ `/pages/plans/[id]/goals.astro`
- ✅ `/pages/plans/[id]/hierarchy.astro`
- ✅ `/pages/plans/[id]/review/[weekNumber].astro`
- ✅ `/pages/plans/[id]/week/[weekNumber].astro`
- ✅ `/pages/plans/[id]/week/[weekNumber]/day/[dayNumber].astro`

#### Layout Fixed:

- ✅ `/layouts/Layout.astro`

**Pattern Applied:**

For API endpoints:

```typescript
const userId = locals.user?.id;

if (!userId) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "You must be logged in to access this resource",
    } as ErrorResponse),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

For Astro pages:

```typescript
const userId = Astro.locals.user?.id;

if (!userId) {
  return Astro.redirect("/login");
}
```

## Files Modified

**Total: 40 files updated**

### Core Infrastructure (2 files):

1. `/src/middleware/index.ts` - Fixed inconsistent user checks
2. `/src/layouts/Layout.astro` - Removed DEFAULT_USER_ID fallback

### API Endpoints (31 files):

All API endpoints in `/src/pages/api/v1/` now use authenticated user from `locals.user`

### Astro Pages (7 files):

All plan pages in `/src/pages/plans/` now use authenticated user from `Astro.locals.user`

## Related Documentation

- [Authentication Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./testing-guide.md)
- [Supabase Email Configuration](./supabase-email-configuration.md)
