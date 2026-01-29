# Troubleshooting: Login Test Flakiness

## Problem Description

The E2E tests were experiencing intermittent failures where the email field value would:

1. Appear to be filled correctly
2. Disappear immediately after
3. Cause "Email is required" validation error

## Root Cause Analysis

### Issue 1: React Controlled Inputs + Playwright `fill()`

The `LoginForm` component uses **controlled inputs** where the input value is tied to React state:

```tsx
<Input
  value={formData.email} // Controlled by React state
  onChange={handleChange("email")}
  autoComplete="email"
/>
```

**What was happening:**

1. Playwright's `fill()` sets the DOM value directly (fast)
2. This triggers a `change` event
3. React's `handleChange` calls `setState` (asynchronous)
4. Browser autocomplete or React re-renders can interfere
5. Input resets to state value (empty string) before state update completes

### Issue 2: Unnecessary Field Clearing

The old login method was clearing fields unnecessarily:

```typescript
// OLD - Problematic
async login(email: string, password: string) {
  await this.emailInput.fill('');  // ❌ Triggers extra onChange events
  await this.passwordInput.fill('');  // ❌ Triggers extra onChange events
  await this.emailInput.fill(email);
  await this.passwordInput.fill(password);
  await this.page.waitForTimeout(500);
  await this.loginButton.click();
}
```

Each `fill('')` triggers React's `onChange` handler, causing additional state updates that can race with subsequent fills.

### Issue 3: Browser Autocomplete Interference

The `autoComplete="email"` and `autoComplete="current-password"` attributes can cause browsers to:

- Pre-fill values based on stored credentials
- Interfere with Playwright's input manipulation
- Cause timing conflicts with React state updates

## Solutions Applied

### Fix 1: Use `pressSequentially()` Instead of `fill()`

**Why it works:**

- Simulates actual keyboard typing (character by character)
- Each keystroke triggers onChange properly
- React state updates have time to process between characters
- More compatible with controlled inputs

```typescript
// NEW - Reliable
async login(email: string, password: string) {
  // Clear fields properly
  await this.emailInput.click();
  await this.emailInput.clear();
  await this.passwordInput.click();
  await this.passwordInput.clear();

  // Use pressSequentially with delay
  await this.emailInput.pressSequentially(email, { delay: 50 });
  await this.passwordInput.pressSequentially(password, { delay: 50 });

  // Wait for React state to stabilize
  await this.page.waitForTimeout(300);

  // Verify values before submitting
  await this.page.waitForFunction(
    ({ email, password }) => {
      const emailInput = document.querySelector<HTMLInputElement>('[data-test-id="login-email-input"]');
      const passwordInput = document.querySelector<HTMLInputElement>('[data-test-id="login-password-input"]');
      return emailInput?.value === email && passwordInput?.value === password;
    },
    { email, password },
    { timeout: 5000 }
  );

  await this.loginButton.click();
}
```

### Fix 2: Added Value Verification

Before clicking submit, we now verify that the DOM actually contains the expected values:

```typescript
await this.page.waitForFunction(
  ({ email, password }) => {
    const emailInput = document.querySelector<HTMLInputElement>('[data-test-id="login-email-input"]');
    const passwordInput = document.querySelector<HTMLInputElement>('[data-test-id="login-password-input"]');
    return emailInput?.value === email && passwordInput?.value === password;
  },
  { email, password },
  { timeout: 5000 }
);
```

This ensures we don't proceed until React state and DOM are synchronized.

### Fix 3: Removed Unnecessary Field Clearing

Removed all unnecessary `fill('')` calls from:

- `LoginPage.ts` login method
- `login.spec.ts` beforeEach hook
- `login.spec.ts` validation test

### Fix 4: Improved Test Configuration

Updated `playwright.config.ts` to prevent browser autocomplete interference:

```typescript
use: {
  contextOptions: {
    storageState: undefined, // Disable credential storage
  },
}
```

## Testing the Fix

Run the flaky test multiple times to verify stability:

```bash
# Run the specific test 10 times
npx playwright test e2e/weekly-goals.spec.ts --grep "should allow adding multiple tasks" --repeat-each=10

# Run with UI to observe behavior
npx playwright test e2e/weekly-goals.spec.ts --grep "should allow adding multiple tasks" --ui

# Run all login-related tests
npx playwright test e2e/login.spec.ts e2e/weekly-goals.spec.ts
```

## Prevention Guidelines

### When Writing E2E Tests with Controlled React Inputs:

1. **Prefer `pressSequentially()` over `fill()`** for controlled inputs
2. **Add value verification** before critical actions (like form submission)
3. **Avoid unnecessary clearing** - don't use `fill('')` unless needed
4. **Wait for state stabilization** after input operations
5. **Disable autocomplete** in test environments when possible

### Example Pattern:

```typescript
// ✅ Good pattern for controlled inputs
await input.clear();
await input.pressSequentially("value", { delay: 50 });
await page.waitForTimeout(200); // Let React catch up
await page.waitForFunction(() => document.querySelector("#input")?.value === "value");

// ❌ Avoid for controlled inputs
await input.fill(""); // Unnecessary state update
await input.fill("value"); // Too fast for React
await button.click(); // Might submit before state updates
```

## Related Files

- `/e2e/pages/LoginPage.ts` - Login page object with updated login method
- `/e2e/login.spec.ts` - Login tests cleaned up
- `/e2e/weekly-goals.spec.ts` - Tests using the login method
- `/src/components/auth/LoginForm.tsx` - React controlled form component
- `/playwright.config.ts` - Test configuration with autocomplete disabled

## References

- [Playwright: Handling controlled inputs](https://playwright.dev/docs/input#type-characters)
- [React: Controlled Components](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)
- [Playwright: Auto-waiting](https://playwright.dev/docs/actionability)
