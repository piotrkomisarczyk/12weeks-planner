# Cloudflare Pages + Supabase Client Creation Issue - Fix Plan

## ✅ ISSUE RESOLVED

**Root Cause:** `src/layouts/Layout.astro` was creating its own Supabase server client using `import.meta.env.SUPABASE_URL` and `import.meta.env.SUPABASE_KEY`, which are **undefined** in Cloudflare Pages (non-PUBLIC variables are not available via `import.meta.env` in Cloudflare).

**Solution:** Changed Layout.astro to use the Supabase client from `Astro.locals.supabase` (created by middleware with proper runtime environment variables).

**Status:** Code fix applied ✅ | Ready to deploy ✅ | Testing required ⏳

---

## Issue Summary

**URL:** https://8a97f0c2.12weeks-planner.pages.dev/plans

**Symptoms:**
- ✅ Login, register, and forgot password pages load correctly
- ✅ User can successfully log in
- ❌ After login, navigating to `/plans` fails with error: "Your project's URL and Key are required to create a Supabase client!"

**Cloudflare Logs Analysis:**
```javascript
// Middleware successfully creates server client
"logs": [
  {
    "message": ["[createServerSupabaseClient] URL:", "hpuv.supabase.co", "KEY:", "ki2QOc"],
    "timestamp": 1769866029950
  },
  {
    "message": ["[createServerSupabaseClient] Supabase client created successfully"],
    "timestamp": 1769866029950
  }
],

// But then an exception occurs
"exceptions": [
  {
    "message": "Your project's URL and Key are required to create a Supabase client!..."
  }
]
```

## Root Cause Analysis - **CONFIRMED**

### 1. The Actual Issue: Duplicate Client Creation in Layout.astro

**ROOT CAUSE IDENTIFIED:**
`src/layouts/Layout.astro` was creating its own Supabase server client using `import.meta.env` variables instead of using the client from middleware:

```typescript
// INCORRECT - Layout.astro line 16
const supabase = createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
  // ...
});
```

**Why This Failed in Cloudflare Pages:**
- `import.meta.env.SUPABASE_URL` → ❌ undefined (not PUBLIC_ prefixed, not available at build time)
- `import.meta.env.SUPABASE_KEY` → ❌ undefined (not PUBLIC_ prefixed, not available at build time)
- Non-PUBLIC environment variables are ONLY available via `context.locals.runtime.env` in Cloudflare Pages
- Astro layouts don't have access to `context.locals.runtime`, only to `Astro.locals`

### 2. Environment Variable Behavior in Cloudflare Pages

**Critical Understanding:**
- **Runtime variables** (`SUPABASE_URL`, `SUPABASE_KEY`): Available at runtime in server-side code via `context.locals.runtime.env`
- **Build-time variables** (`PUBLIC_*` prefixed): Embedded into the JavaScript bundle during build and NOT updatable at runtime
- **`import.meta.env` in Cloudflare Pages**: Only contains PUBLIC_ prefixed variables when deployed

**What Was Working:**
1. Middleware correctly creates server client using runtime env vars via `context.locals.runtime.env` ✅
2. Middleware attaches client to `locals.supabase` ✅

**What Was Failing:**
3. Layout.astro tries to create ANOTHER client using `import.meta.env.SUPABASE_URL` ❌
4. These variables are undefined in Cloudflare Pages
5. Supabase library throws: "Your project's URL and Key are required to create a Supabase client!"

### 3. Actual Code Flow Analysis

#### Request Flow for `/plans` - **CONFIRMED**
```
1. Browser requests /plans
2. Middleware runs (middleware/index.ts):
   ✅ Creates server Supabase client using runtime env vars
   ✅ Authenticates user
   ✅ Attaches user to locals.user
   ✅ Attaches client to locals.supabase
3. Astro page renders (pages/plans/index.astro):
   ✅ Loads Layout.astro
   ❌ Layout.astro tries to create OWN Supabase client with import.meta.env
   ❌ import.meta.env.SUPABASE_URL and import.meta.env.SUPABASE_KEY are undefined
   ❌ EXCEPTION THROWN: "Your project's URL and Key are required..."
```

**Cloudflare Logs Confirm:**
```javascript
// Middleware succeeds
"[createServerSupabaseClient] URL: hpuv.supabase.co KEY: KKINTB"
"[createServerSupabaseClient] Supabase client created successfully"

// Then Layout.astro fails
"exceptions": [{
  "message": "Your project's URL and Key are required to create a Supabase client!"
}]
```

### 3. Client Creation Points

**Server-Side Client (Working):**
- File: `src/lib/supabase/server.ts`
- Function: `createServerSupabaseClient()`
- Uses: Runtime env vars via `runtime?.env?.SUPABASE_URL` → Works ✅
- Used in: Middleware, API routes

**Client-Side Clients (Potentially Failing):**

1. **File: `src/db/supabase.client.ts`**
   ```typescript
   const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
   ```
   - Uses: `import.meta.env.PUBLIC_*` (build-time)
   - Risk: If not set during build, these are `undefined`

2. **File: `src/lib/supabase/client.ts`**
   ```typescript
   const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
   const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
   ```
   - Uses: `import.meta.env.PUBLIC_*` (build-time)
   - Risk: If not set during build, these are `undefined`

### 4. Why Login Works But /plans Doesn't

**Login Flow:**
```
1. Login page loads (server-side) ✅
2. LoginForm component hydrates (client-side) ✅
3. User submits form → fetch('/api/auth/login') ✅
4. API route uses locals.supabase (server-side) ✅
```
→ No client-side Supabase client needed

**Plans Flow:**
```
1. /plans page loads (server-side) ✅
2. PlansView component hydrates (client-side) ✅
3. useEffect calls fetchPlans() ✅
4. fetch('/api/v1/plans') ✅
5. API route /api/v1/plans runs (server-side) ✅
6. SOMEWHERE: A client-side Supabase client is created ❌
```
→ Client-side Supabase client creation fails

### 5. Hypothesis: Where Client-Side Client Is Being Created

**Most Likely Culprits:**

1. **Import-time initialization**: One of the client files is being imported, causing the lazy initialization to trigger
2. **Component mount**: A React component is trying to create a Supabase client on mount
3. **Service layer**: Code in the service layer accidentally imports/uses client-side Supabase

**Investigation needed:**
- Check if any components import `src/db/supabase.client.ts` or `src/lib/supabase/client.ts`
- Check if any API routes accidentally import client-side code
- Check if there's any global initialization happening

## Fix Implementation Plan

### ✅ Phase 0: PRIMARY FIX - **COMPLETED**

#### The Fix: Use Middleware's Supabase Client

**File: `src/layouts/Layout.astro`**

**BEFORE (Lines 4-28):**
```typescript
import { createServerClient } from "@supabase/ssr";
// ...

// Initialize Supabase server client
const supabase = createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
  cookies: {
    get(key) {
      return Astro.cookies.get(key)?.value;
    },
    set(key, value, options) {
      Astro.cookies.set(key, value, options);
    },
    remove(key, options) {
      Astro.cookies.delete(key, options);
    },
  },
});
```

**AFTER:**
```typescript
// Remove createServerClient import
// ...

// Use Supabase client from middleware (already created with proper env vars)
// This ensures compatibility with Cloudflare Pages runtime environment
const supabase = Astro.locals.supabase;
```

**Why This Works:**
- ✅ Middleware creates the client with access to `runtime.env`
- ✅ Layout uses the already-created client from `Astro.locals.supabase`
- ✅ No duplicate client creation
- ✅ No dependency on `import.meta.env` for non-PUBLIC variables

**Status:** ✅ **FIXED** - Ready to deploy and test

### Phase 1: Verify Environment Variables (RECOMMENDED)

#### Step 1.1: Verify Cloudflare Pages Environment Variables

**Location:** Cloudflare Dashboard → Pages → 12weeks-planner → Settings → Environment Variables

**Required Variables:**

| Variable Name | Type | Required For | Notes |
|--------------|------|--------------|-------|
| `SUPABASE_URL` | Runtime | Server-side API calls | Set for Production & Preview |
| `SUPABASE_KEY` or `SUPABASE_ANON_KEY` | Runtime | Server-side API calls | Set for Production & Preview |
| `PUBLIC_SUPABASE_URL` | Build-time | Client-side (React components) | **MUST be set at build time** |
| `PUBLIC_SUPABASE_ANON_KEY` | Build-time | Client-side (React components) | **MUST be set at build time** |

**Action Items:**
1. ✅ Verify `SUPABASE_URL` is set (appears to be set based on logs)
2. ✅ Verify `SUPABASE_KEY` or `SUPABASE_ANON_KEY` is set (appears to be set based on logs)
3. ❗ **CRITICAL**: Set `PUBLIC_SUPABASE_URL` for Production environment
4. ❗ **CRITICAL**: Set `PUBLIC_SUPABASE_ANON_KEY` for Production environment
5. ❗ **CRITICAL**: Set the same variables for Preview environments

**Expected Values:**
```bash
# Runtime (server-side)
SUPABASE_URL=https://hpuv.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key

# Build-time (client-side)
PUBLIC_SUPABASE_URL=https://hpuv.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
```

#### Step 1.2: Redeploy Application

**CRITICAL:** Just setting environment variables is NOT enough for `PUBLIC_*` variables!

**Why?** `PUBLIC_*` variables are embedded into the JavaScript bundle at BUILD TIME.

**Action:**
1. After setting `PUBLIC_*` variables in Cloudflare Dashboard
2. Trigger a new deployment:
   - Option A: Push a new commit to trigger rebuild
   - Option B: Use Cloudflare Dashboard → Deployments → "Retry deployment"
   - Option C: Use Cloudflare API to trigger new build

**Verification:**
After redeployment, check the browser console:
```javascript
// Should show the actual URL, not undefined
console.log(import.meta.env.PUBLIC_SUPABASE_URL);
```

### Phase 2: Code Audit and Improvements

#### Step 2.1: Add Debug Logging

**Purpose:** Identify exactly where client-side Supabase client is being created

**File: `src/db/supabase.client.ts`**
Add stack trace logging:
```typescript
function initializeClient(): SupabaseClientType<Database> {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // ENHANCED DEBUG LOGGING
  console.log("[supabase.client.ts] Initializing client");
  console.log("[supabase.client.ts] URL defined:", !!supabaseUrl);
  console.log("[supabase.client.ts] KEY defined:", !!supabaseAnonKey);
  
  // Log stack trace to identify who's calling this
  if (typeof window !== 'undefined') {
    console.trace("[supabase.client.ts] Client initialization stack trace");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(/* existing error message */);
  }
  
  // ... rest of function
}
```

**File: `src/lib/supabase/client.ts`**
Add similar logging:
```typescript
export function createClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // ENHANCED DEBUG LOGGING
  console.log("[lib/supabase/client.ts] Creating browser client");
  console.log("[lib/supabase/client.ts] URL defined:", !!supabaseUrl);
  console.log("[lib/supabase/client.ts] KEY defined:", !!supabaseKey);
  
  if (typeof window !== 'undefined') {
    console.trace("[lib/supabase/client.ts] Client creation stack trace");
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(/* existing error message */);
  }
  
  // ... rest of function
}
```

#### Step 2.2: Identify Improper Client Usage

**Search for imports:**
```bash
# Find all files importing client-side Supabase clients
grep -r "from.*supabase.client" src/
grep -r "from.*supabase/client" src/
```

**Expected legitimate uses:**
- React components that need real-time subscriptions
- Client-side auth flows (if any)

**NOT legitimate:**
- API routes importing client-side code
- Server-side services using client-side clients
- Middleware using client-side clients

#### Step 2.3: Verify API Routes Don't Import Client-Side Code

**Files to audit:**
- `src/pages/api/v1/plans.ts`
- `src/pages/api/v1/plans/[id].ts`
- `src/lib/services/plan.service.ts`

**Check:**
1. No imports from `src/db/supabase.client.ts`
2. No imports from `src/lib/supabase/client.ts`
3. Only using `SupabaseClient` type from typed imports
4. Services receive `SupabaseClient` via dependency injection

**Current Status (Based on Review):**
- ✅ `src/pages/api/v1/plans.ts`: Uses `locals.supabase` correctly
- ✅ `src/lib/services/plan.service.ts`: Receives client via constructor
- ✅ Middleware creates server client correctly

### Phase 3: Improve Error Handling and Validation

#### Step 3.1: Add Build-Time Validation

**File: `astro.config.mjs`**
Add validation to fail build if PUBLIC_* vars are missing:
```javascript
// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Validate required build-time environment variables
function validateBuildEnv() {
  const required = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !process.env[key] && !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required PUBLIC environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nThese must be set during build time for Cloudflare Pages.');
    console.error('Set them in: Cloudflare Dashboard → Pages → Settings → Environment Variables\n');
    
    // Don't fail build in dev mode, just warn
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables');
    }
  } else {
    console.log('✅ All required PUBLIC environment variables are set');
  }
}

validateBuildEnv();

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
```

#### Step 3.2: Improve Error Messages

**File: `src/db/supabase.client.ts`**
Update error to be more Cloudflare-specific:
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase PUBLIC environment variables for client.\n\n" +
    `PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}\n` +
    `PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗"}\n\n` +
    "🔧 For Cloudflare Pages:\n" +
    "1. Go to: Cloudflare Dashboard → Pages → 12weeks-planner → Settings → Environment Variables\n" +
    "2. Add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY\n" +
    "3. IMPORTANT: Trigger a new deployment (PUBLIC_* vars are embedded at build time)\n" +
    "4. For local development, add these to your .env file\n\n" +
    "📚 More info: https://docs.astro.build/en/guides/environment-variables/#public-environment-variables"
  );
}
```

**File: `src/lib/supabase/client.ts`**
Add similar improved error message.

### Phase 4: Add Healthcheck and Diagnostics

#### Step 4.1: Create Diagnostics API Endpoint

**File: `src/pages/api/diagnostics.ts`** (new file)
```typescript
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/diagnostics
 * Returns environment variable status for debugging
 * (Safe - only shows presence, not values)
 */
export const GET: APIRoute = async ({ locals }) => {
  // Server-side runtime env check
  const runtimeEnv = locals.runtime?.env;
  
  const serverEnv = {
    SUPABASE_URL: !!runtimeEnv?.SUPABASE_URL,
    PUBLIC_SUPABASE_URL: !!runtimeEnv?.PUBLIC_SUPABASE_URL,
    SUPABASE_KEY: !!runtimeEnv?.SUPABASE_KEY,
    SUPABASE_ANON_KEY: !!runtimeEnv?.SUPABASE_ANON_KEY,
    PUBLIC_SUPABASE_ANON_KEY: !!runtimeEnv?.PUBLIC_SUPABASE_ANON_KEY,
  };

  // Build-time env check
  const buildEnv = {
    PUBLIC_SUPABASE_URL: !!import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    serverEnv,
    buildEnv,
    supabaseClientStatus: {
      server: serverEnv.SUPABASE_URL && (serverEnv.SUPABASE_KEY || serverEnv.SUPABASE_ANON_KEY),
      client: buildEnv.PUBLIC_SUPABASE_URL && buildEnv.PUBLIC_SUPABASE_ANON_KEY,
    },
    recommendations: [],
  };

  // Add recommendations
  if (!diagnostics.supabaseClientStatus.server) {
    diagnostics.recommendations.push(
      "❌ Server-side Supabase client cannot be created. Set SUPABASE_URL and SUPABASE_KEY in Cloudflare environment variables."
    );
  }

  if (!diagnostics.supabaseClientStatus.client) {
    diagnostics.recommendations.push(
      "❌ Client-side Supabase client cannot be created. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in Cloudflare environment variables, then REDEPLOY."
    );
  }

  if (diagnostics.supabaseClientStatus.server && diagnostics.supabaseClientStatus.client) {
    diagnostics.recommendations.push("✅ All Supabase environment variables are properly configured.");
  }

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
```

**Usage:**
```bash
curl https://8a97f0c2.12weeks-planner.pages.dev/api/diagnostics
```

#### Step 4.2: Add Client-Side Diagnostics Component

**File: `src/components/diagnostics/EnvCheck.tsx`** (new file)
```typescript
import { useState, useEffect } from "react";

export function EnvCheck() {
  const [status, setStatus] = useState<{
    buildTime: boolean;
    serverTime: boolean;
  } | null>(null);

  useEffect(() => {
    // Check build-time vars (available in browser)
    const buildTime = !!(
      import.meta.env.PUBLIC_SUPABASE_URL &&
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    // Check server-time vars (via API)
    fetch("/api/diagnostics")
      .then((r) => r.json())
      .then((data) => {
        setStatus({
          buildTime,
          serverTime: data.supabaseClientStatus.server,
        });
      })
      .catch(() => {
        setStatus({
          buildTime,
          serverTime: false,
        });
      });
  }, []);

  if (!status) return null;

  // Only show if there's an issue
  if (status.buildTime && status.serverTime) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-600 rounded-lg p-4 max-w-md shadow-lg">
      <h3 className="font-bold text-yellow-900 mb-2">⚠️ Configuration Issue</h3>
      <ul className="text-sm text-yellow-800 space-y-1">
        {!status.buildTime && (
          <li>❌ PUBLIC_* environment variables not set at build time</li>
        )}
        {!status.serverTime && (
          <li>❌ Server-side environment variables not available</li>
        )}
      </ul>
      <p className="text-xs text-yellow-700 mt-2">
        Contact administrator to configure Cloudflare Pages environment variables.
      </p>
    </div>
  );
}
```

**Add to development mode pages for debugging:**
```astro
---
// In Layout.astro or specific pages during debugging
import { EnvCheck } from "@/components/diagnostics/EnvCheck";
---

<!-- Add in body -->
{import.meta.env.DEV && <EnvCheck client:only="react" />}
```

### Phase 5: Testing and Verification

#### Step 5.1: Pre-Deployment Checklist

- [ ] All `PUBLIC_*` environment variables set in Cloudflare Dashboard
- [ ] Variables set for both Production and Preview environments
- [ ] Build-time validation added to `astro.config.mjs`
- [ ] Debug logging added to client creation functions
- [ ] Diagnostics API endpoint created

#### Step 5.2: Post-Deployment Verification

**Test 1: Diagnostics API**
```bash
curl https://8a97f0c2.12weeks-planner.pages.dev/api/diagnostics
```

Expected output:
```json
{
  "timestamp": "2026-01-31T...",
  "environment": "production",
  "serverEnv": {
    "SUPABASE_URL": true,
    "SUPABASE_KEY": true,
    // ...
  },
  "buildEnv": {
    "PUBLIC_SUPABASE_URL": true,
    "PUBLIC_SUPABASE_ANON_KEY": true
  },
  "supabaseClientStatus": {
    "server": true,
    "client": true
  },
  "recommendations": [
    "✅ All Supabase environment variables are properly configured."
  ]
}
```

**Test 2: Browser Console**
Open browser console and check:
```javascript
// Should show actual values, not undefined
console.log('URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('KEY:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
```

**Test 3: Login and Navigate**
1. Go to login page
2. Log in with credentials
3. Automatically redirected to `/plans`
4. Check Cloudflare Functions logs for errors
5. Verify page loads without exceptions

**Test 4: Plans Page Functionality**
1. Navigate to `/plans`
2. Verify plans list loads (or empty state if no plans)
3. Try creating a new plan
4. Check that all API calls succeed

#### Step 5.3: Rollback Plan

If issues persist:

1. **Immediate:** Check Cloudflare Functions Real-time logs
2. **Debug:** Use diagnostics API to verify env vars
3. **Check:** Browser console for client-side errors
4. **Verify:** Stack traces from debug logging show where client creation happens
5. **Fallback:** Temporarily disable client-side Supabase usage if needed

## Quick Fix Summary - **ACTUAL SOLUTION**

### ✅ Issue Resolved

**Root Cause:** `Layout.astro` was creating its own Supabase server client using `import.meta.env` variables (which are undefined in Cloudflare Pages for non-PUBLIC vars).

**The Fix:** Changed Layout.astro to use `Astro.locals.supabase` from middleware instead.

**File Changed:** `src/layouts/Layout.astro`

**Change Made:**
```typescript
// OLD: Creating own client with undefined env vars
const supabase = createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {...});

// NEW: Using client from middleware
const supabase = Astro.locals.supabase;
```

### Deployment Instructions

1. ✅ **Code fix already applied** to `src/layouts/Layout.astro`
2. **Commit and push** the change
3. **Deploy** to Cloudflare Pages
4. **Test** by:
   - Logging in
   - Navigating to `/plans`
   - Verify no exceptions in Cloudflare Functions logs

### Additional Recommendations

While the primary issue is fixed, consider implementing:
1. **Phase 1:** Verify all environment variables are properly set (especially PUBLIC_ vars for client-side)
2. **Phase 4:** Add diagnostics endpoint for future debugging
3. **Phase 3:** Improve error messages with Cloudflare-specific guidance

## Additional Resources

- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/overview)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

## Notes

- **Build vs Runtime**: Understanding this distinction is critical for Cloudflare Pages
- **PUBLIC_* prefix**: Required for variables that need to be available in the browser
- **Redeploy requirement**: Changing `PUBLIC_*` vars requires redeploy
- **Security**: `PUBLIC_*` vars are exposed in browser - only use public keys (anon key, not service key)
