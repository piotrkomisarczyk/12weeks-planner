# E2E Test Implementation Summary

## Overview

This document summarizes the implementation of E2E tests for the Weekly Goals Management feature, including the addition of `data-test-id` attributes across key components.

## Changes Made

### 1. Added Data Test IDs to Components

#### Login Components (`src/components/auth/LoginForm.tsx`)

```typescript
-login -
  form - // Form container
  login -
  email -
  input - // Email input field
  login -
  password -
  input - // Password input field
  login -
  submit -
  button; // Submit button
```

#### Navigation Components

- **`src/components/navigation/NavLink.astro`**
  ```typescript
  -nav - link - { label }; // Dynamic, e.g., "nav-link-week", "nav-link-plans"
  ```

#### Week Planning Components

**`src/components/plans/week/WeeklyGoalsSection.tsx`**

```typescript
-add - weekly - goal - button; // Button to open create goal dialog
```

**`src/components/plans/week/CreateWeeklyGoalDialog.tsx`**

```typescript
-create -
  weekly -
  goal -
  dialog - // Dialog container
  weekly -
  goal -
  title -
  input - // Goal title input
  weekly -
  goal -
  longterm -
  select - // Long-term goal dropdown
  longterm -
  goal -
  option -
  { goalTitle } - // Dynamic option
  longterm -
  goal -
  option -
  none - // "None" option
  create -
  weekly -
  goal -
  submit -
  button - // Create button
  create -
  weekly -
  goal -
  cancel -
  button; // Cancel button
```

**`src/components/plans/week/WeeklyGoalCard.tsx`**

```typescript
-weekly -
  goal -
  title -
  { goalTitle } - // Dynamic goal title
  add -
  task -
  to -
  goal -
  { goalTitle }; // Dynamic add task button
```

**`src/components/plans/week/InlineAddTask.tsx`**

```typescript
-inline -
  task -
  title -
  input - // Task title input
  inline -
  task -
  submit -
  button; // Submit button (plus icon)
```

**`src/components/plans/week/AdHocSection.tsx`**

```typescript
-other -
  tasks -
  section - // Section header
  add -
  adhoc -
  task -
  button; // Add task button
```

**`src/components/plans/week/TaskItem.tsx`**

```typescript
-task - item - { taskTitle }; // Dynamic task item
```

### 2. Page Object Models (POMs)

Created four Page Object Model classes:

#### `e2e/pages/LoginPage.ts` (Updated)

- Updated to use new `data-test-id` attributes
- Maintains existing login functionality
- Methods: `goto()`, `login()`, `goToRegister()`, `goToForgotPassword()`

#### `e2e/pages/NavigationBar.ts` (New)

- Encapsulates navigation menu interactions
- Methods for all navigation links: `goToPlans()`, `goToWeek()`, `goToGoals()`, etc.

#### `e2e/pages/WeekPage.ts` (New)

- Handles Week planning page interactions
- Methods:
  - `goto(planId, weekNumber)` - Navigate to week page
  - `clickAddWeeklyGoal()` - Open create goal dialog
  - `clickAddTaskForGoal(goalTitle)` - Add task to specific goal
  - `clickAddAdHocTask()` - Add ad-hoc task
  - `addTaskInline(title)` - Fill and submit task form
  - `getWeeklyGoalByTitle(title)` - Locate goal element
  - `getTaskByTitle(title)` - Locate task element
  - `hasWeeklyGoal(title)` - Check goal existence
  - `hasTask(title)` - Check task existence

#### `e2e/pages/CreateWeeklyGoalDialog.ts` (New)

- Handles weekly goal creation dialog
- Methods:
  - `waitForDialog()` - Wait for dialog visibility
  - `fillTitle(title)` - Enter goal title
  - `selectLongTermGoal(goalTitle)` - Select long-term goal
  - `selectNoLongTermGoal()` - Select "None" option
  - `submit()` - Submit form
  - `cancel()` - Close dialog
  - `createGoal(title, longTermGoalTitle?)` - Complete creation flow

### 3. Test Scenarios

Created `e2e/weekly-goals.spec.ts` with three test scenarios:

#### Test 1: Complete Weekly Goals Workflow

**Steps:**

1. Login using `E2E_USERNAME` and `E2E_PASSWORD` environment variables
2. Navigate to Week page via navigation menu
3. Click "Add Weekly Goal" button
4. Enter goal title "Test Weekly Goal One"
5. Select long-term goal "TestGoal" from dropdown
6. Click "Create Goal" button
7. Click "Add Task" for the newly created weekly goal
8. Enter task title "Test Task for the week" and submit
9. Click "Add Task" in "Other Tasks" section
10. Enter task title "Test OTHER Task" and submit
11. Verify task exists within "Test Weekly Goal One"
12. Verify ad-hoc task exists in "Other Tasks" section

#### Test 2: Verify Weekly Goal Display

- Verifies weekly goal is displayed with long-term goal association
- Checks goal visibility and badge display

#### Test 3: Multiple Tasks Management

- Creates a new weekly goal
- Adds multiple tasks to the same goal
- Verifies all tasks are displayed correctly

### 4. Documentation

#### `e2e/README.md`

Comprehensive documentation including:

- Test structure and organization
- Prerequisites and setup instructions
- Running tests commands
- Complete list of all `data-test-id` attributes
- Guidelines for writing new tests
- Troubleshooting section
- CI/CD integration notes

## Test Execution

### Environment Setup

Create `.env.test` file:

```bash
E2E_USERNAME=your-test-email@example.com
E2E_PASSWORD=your-test-password
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### Run Commands

```bash
# Run all tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test
npx playwright test e2e/weekly-goals.spec.ts

# Debug mode
npx playwright test --debug
```

## Benefits

### 1. Maintainability

- **Page Object Model**: Encapsulates page interactions, making tests easier to maintain
- **Consistent selectors**: `data-test-id` attributes are stable and resistant to UI changes
- **Centralized logic**: Page-specific logic lives in POM classes

### 2. Reliability

- **Stable selectors**: `data-test-id` doesn't break when CSS classes or structure changes
- **Explicit waits**: Tests wait for elements to be ready before interacting
- **Clear assertions**: Tests verify exact expected outcomes

### 3. Readability

- **Descriptive test IDs**: Easy to understand element purpose
- **Clear test steps**: Each test scenario is well-documented
- **Semantic method names**: POM methods describe what they do

### 4. Scalability

- **Reusable components**: POMs can be used across multiple tests
- **Easy to extend**: New tests can leverage existing POMs
- **Consistent patterns**: Following established conventions

## Component Tree Reference

### Login Page Flow

```
src/pages/login.astro
└── LoginForm [data-test-id="login-form"]
    ├── Input [data-test-id="login-email-input"]
    ├── Input [data-test-id="login-password-input"]
    └── Button [data-test-id="login-submit-button"]
```

### Week Page Flow

```
src/pages/plans/[id]/week/[weekNumber].astro
├── NavigationBar
│   └── NavLink [data-test-id="nav-link-week"]
│
└── WeekPlannerContainer
    ├── WeeklyGoalsSection
    │   ├── Button [data-test-id="add-weekly-goal-button"]
    │   │
    │   ├── CreateWeeklyGoalDialog [data-test-id="create-weekly-goal-dialog"]
    │   │   ├── Input [data-test-id="weekly-goal-title-input"]
    │   │   ├── Select [data-test-id="weekly-goal-longterm-select"]
    │   │   │   └── Option [data-test-id="longterm-goal-option-{title}"]
    │   │   ├── Button [data-test-id="create-weekly-goal-submit-button"]
    │   │   └── Button [data-test-id="create-weekly-goal-cancel-button"]
    │   │
    │   └── WeeklyGoalCard
    │       ├── h3 [data-test-id="weekly-goal-title-{title}"]
    │       ├── Button [data-test-id="add-task-to-goal-{title}"]
    │       │
    │       ├── InlineAddTask
    │       │   ├── Input [data-test-id="inline-task-title-input"]
    │       │   └── Button [data-test-id="inline-task-submit-button"]
    │       │
    │       └── TaskItem [data-test-id="task-item-{title}"]
    │
    └── AdHocSection
        ├── h3 [data-test-id="other-tasks-section"]
        ├── Button [data-test-id="add-adhoc-task-button"]
        │
        ├── InlineAddTask
        │   ├── Input [data-test-id="inline-task-title-input"]
        │   └── Button [data-test-id="inline-task-submit-button"]
        │
        └── TaskItem [data-test-id="task-item-{title}"]
```

## Next Steps

### Recommended Improvements

1. **Add more test scenarios**:
   - Edit weekly goal title
   - Delete weekly goal
   - Reorder goals and tasks
   - Link/unlink long-term goals
   - Assign tasks to specific days

2. **Add visual regression testing**:
   - Screenshot comparison for key pages
   - Verify UI consistency across browsers

3. **Performance testing**:
   - Measure page load times
   - Monitor API response times

4. **Test data management**:
   - Implement fixtures for test data
   - Add cleanup after test execution
   - Use unique identifiers to avoid conflicts

5. **Expand coverage**:
   - Test error scenarios
   - Test validation messages
   - Test accessibility features

## Files Modified

### Component Files

1. `src/components/auth/LoginForm.tsx`
2. `src/components/navigation/NavLink.astro`
3. `src/components/plans/week/WeeklyGoalsSection.tsx`
4. `src/components/plans/week/CreateWeeklyGoalDialog.tsx`
5. `src/components/plans/week/WeeklyGoalCard.tsx`
6. `src/components/plans/week/InlineAddTask.tsx`
7. `src/components/plans/week/AdHocSection.tsx`
8. `src/components/plans/week/TaskItem.tsx`

### Test Files Created

1. `e2e/pages/LoginPage.ts` (updated)
2. `e2e/pages/NavigationBar.ts` (new)
3. `e2e/pages/WeekPage.ts` (new)
4. `e2e/pages/CreateWeeklyGoalDialog.ts` (new)
5. `e2e/weekly-goals.spec.ts` (new)

### Documentation Files Created

1. `e2e/README.md`
2. `docs/e2e-test-implementation.md` (this file)

## Conclusion

The implementation provides a solid foundation for E2E testing of the Weekly Goals Management feature. The addition of `data-test-id` attributes ensures stable and maintainable tests, while the Page Object Model pattern promotes code reusability and readability.

The test scenarios cover the complete workflow from login to task creation, providing confidence in the application's core functionality. The documentation ensures that the team can easily extend and maintain these tests going forward.
