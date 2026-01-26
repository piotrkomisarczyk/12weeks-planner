# Testing Documentation

This document provides an overview of the testing setup and guidelines for the 12weeks-planner project.

## Tech Stack

- **Vitest** - Unit tests for business logic and validation
- **Playwright** - E2E tests and visual regression testing
- **@testing-library/react** - React component testing utilities
- **jsdom** - DOM environment for unit tests

## Project Structure

```
12weeks-planner/
├── src/
│   ├── lib/
│   │   └── utils.test.ts           # Unit tests for utilities
│   └── test/
│       └── setup.ts                 # Vitest global setup
├── e2e/
│   ├── pages/
│   │   └── LoginPage.ts            # Page Object Model
│   └── login.spec.ts               # E2E test specs
├── vitest.config.ts                # Vitest configuration
└── playwright.config.ts            # Playwright configuration
```

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run all unit tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Writing Unit Tests

Unit tests are located next to the source files with `.test.ts` or `.spec.ts` extension.

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    });
  });
});
```

### Best Practices

- Use `describe` blocks to group related tests
- Use clear, descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies using `vi.mock()`
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Avoid testing implementation details
- Focus on testing behavior and outcomes

### Configuration

The Vitest configuration is in `vitest.config.ts`:

- **Environment**: jsdom (for DOM testing)
- **Setup file**: `src/test/setup.ts` (global mocks and configuration)
- **Coverage thresholds**: 70% for lines, functions, branches, and statements
- **Exclude**: node_modules, dist, .astro, e2e

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in debug mode with Playwright Inspector
npm run test:e2e:debug

# Generate tests interactively (codegen)
npm run test:e2e:codegen
```

### Writing E2E Tests

E2E tests are located in the `e2e/` directory.

**Page Object Model Example:**

```typescript
// e2e/pages/LoginPage.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.loginButton.click();
  }
}
```

**Test Spec Example:**

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async ({ page }) => {
    await expect(page).toHaveTitle(/12weeks/i);
    await expect(loginPage.emailInput).toBeVisible();
  });
});
```

### Best Practices

- **Use Page Object Model** - Encapsulate page elements and interactions
- **Use locators** - Prefer role-based and accessible locators
- **Use browser contexts** - Isolate test environments
- **Leverage API testing** - Validate backend independently
- **Implement visual comparison** - Use `expect(page).toHaveScreenshot()`
- **Use codegen tool** - Generate tests by recording interactions
- **Leverage trace viewer** - Debug test failures with detailed traces
- **Implement test hooks** - Use `beforeEach`/`afterEach` for setup/teardown
- **Use expect assertions** - Use specific matchers for better error messages

### Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: http://localhost:3000
- **Test directory**: `e2e/`
- **Parallel execution**: Enabled (except on CI)
- **Retries**: 2 on CI, 0 locally
- **Trace**: On first retry
- **Screenshot**: On failure only
- **Video**: Retained on failure
- **Web server**: Auto-starts `npm run dev` before tests

## CI/CD Integration

Tests can be integrated into GitHub Actions or other CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

## Coverage Reports

After running `npm run test:coverage`, you can view the HTML coverage report:

```bash
open coverage/index.html
```

Coverage thresholds are configured to maintain at least 70% coverage across all metrics.

## Debugging Tips

### Unit Tests

1. Use `test.only()` or `describe.only()` to run specific tests
2. Use `console.log()` or `debug()` from testing-library
3. Run tests with `--reporter=verbose` for detailed output
4. Use Vitest UI for interactive debugging: `npm run test:ui`

### E2E Tests

1. Use `--headed` flag to see browser actions
2. Use `--debug` flag to step through tests
3. Use `page.pause()` to pause test execution
4. View trace files in Playwright Trace Viewer
5. Use codegen to understand selectors: `npm run test:e2e:codegen`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
