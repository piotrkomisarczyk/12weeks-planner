# E2E Tests for 12 Weeks Planner

This directory contains end-to-end tests for the 12 Weeks Planner application using Playwright.

## Test Structure

The tests follow the Page Object Model (POM) pattern for better maintainability and reusability:

```
e2e/
├── pages/                          # Page Object Models
│   ├── LoginPage.ts               # Login page elements and actions
│   ├── NavigationBar.ts           # Navigation menu elements and actions
│   ├── WeekPage.ts                # Week planning page elements and actions
│   └── CreateWeeklyGoalDialog.ts  # Weekly goal creation dialog
├── login.spec.ts                  # Login page tests
├── weekly-goals.spec.ts           # Weekly goals management tests
└── README.md                      # This file
```

## Prerequisites

1. **Environment Variables**: Create a `.env.test` file in the root directory with test credentials:

```bash
E2E_USERNAME=your-test-email@example.com
E2E_PASSWORD=your-test-password
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

2. **Test Data**: Ensure the following test data exists in your test database:
   - A user account with the credentials from `.env.test`
   - An active plan for the test user
   - A long-term goal named "TestGoal" in the plan

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test e2e/weekly-goals.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Debug tests
```bash
npx playwright test --debug
```

## Test Scenarios

### Login Tests (`login.spec.ts`)
- Display login form
- Show validation errors for empty fields
- Show validation error for invalid email format
- Navigate to register page
- Navigate to forgot password page
- Verify form accessibility

### Weekly Goals Tests (`weekly-goals.spec.ts`)
1. **Create weekly goal with task and ad-hoc task**:
   - Login using environment variables
   - Navigate to Week page via navigation menu
   - Create weekly goal "Test Weekly Goal One"
   - Link to long-term goal "TestGoal"
   - Add task "Test Task for the week" to the weekly goal
   - Add ad-hoc task "Test OTHER Task" to Other Tasks section
   - Verify both tasks exist in their respective sections

2. **Display weekly goal with long-term goal association**:
   - Verify weekly goal is displayed correctly
   - Check long-term goal association badge

3. **Add multiple tasks to a weekly goal**:
   - Create a new weekly goal
   - Add multiple tasks to the goal
   - Verify all tasks are displayed

## Data Test IDs

The application uses `data-test-id` attributes for reliable element selection:

### Login Page
- `login-form` - Login form container
- `login-email-input` - Email input field
- `login-password-input` - Password input field
- `login-submit-button` - Sign in button

### Navigation Bar
- `nav-link-plans` - Plans navigation link
- `nav-link-dashboard` - Dashboard navigation link
- `nav-link-goals` - Goals navigation link
- `nav-link-hierarchy` - Hierarchy navigation link
- `nav-link-week` - Week navigation link
- `nav-link-today` - Today navigation link
- `nav-link-review` - Review navigation link

### Week Page
- `add-weekly-goal-button` - Button to open create weekly goal dialog
- `weekly-goal-title-{goalTitle}` - Weekly goal title element
- `add-task-to-goal-{goalTitle}` - Button to add task to specific goal
- `other-tasks-section` - Other Tasks section header
- `add-adhoc-task-button` - Button to add ad-hoc task

### Create Weekly Goal Dialog
- `create-weekly-goal-dialog` - Dialog container
- `weekly-goal-title-input` - Goal title input field
- `weekly-goal-longterm-select` - Long-term goal select dropdown
- `longterm-goal-option-{goalTitle}` - Long-term goal option
- `longterm-goal-option-none` - "None" option for long-term goal
- `create-weekly-goal-submit-button` - Create Goal button
- `create-weekly-goal-cancel-button` - Cancel button

### Task Components
- `inline-task-title-input` - Task title input field
- `inline-task-submit-button` - Submit button (plus icon)
- `task-item-{taskTitle}` - Task item element

## Writing New Tests

When writing new tests:

1. **Use Page Object Models**: Create or extend POM classes in the `pages/` directory
2. **Use data-test-id**: Prefer `page.getByTestId()` over CSS selectors
3. **Add meaningful waits**: Use `waitFor()` for async operations
4. **Clean test data**: Consider cleanup after tests or use unique identifiers
5. **Document scenarios**: Add clear comments explaining test steps

### Example:
```typescript
test('should do something', async ({ page }) => {
  // Initialize page objects
  const loginPage = new LoginPage(page);
  const weekPage = new WeekPage(page);

  // Step 1: Login
  await loginPage.goto();
  await loginPage.login(email, password);

  // Step 2: Navigate to Week page
  await weekPage.goto(planId, weekNumber);

  // Step 3: Perform action
  await weekPage.clickAddWeeklyGoal();

  // Step 4: Verify result
  await expect(weekPage.dialog).toBeVisible();
});
```

## Troubleshooting

### Tests are flaky
- Increase timeouts in `playwright.config.ts`
- Add explicit waits using `waitFor()` or `waitForTimeout()`
- Check for race conditions in async operations

### Elements not found
- Verify `data-test-id` attributes are present in the component
- Check if elements are inside shadow DOM or iframes
- Use Playwright Inspector to debug: `npx playwright test --debug`

### Login fails
- Verify credentials in `.env.test`
- Check if test user exists in the database
- Ensure authentication endpoints are working

## CI/CD Integration

The tests are configured to run in CI with the following settings:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Reports: HTML, JSON, and list formats

See `playwright.config.ts` for full configuration.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
