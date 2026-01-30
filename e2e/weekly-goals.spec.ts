import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { NavigationBar } from "./pages/NavigationBar";
import { WeekPage } from "./pages/WeekPage";
import { CreateWeeklyGoalDialog } from "./pages/CreateWeeklyGoalDialog";
import { TopBar } from "./pages/TopBar";

/**
 * E2E Test: Weekly Goals Management
 *
 * This test scenario covers:
 * 1. Login using environment variables
 * 2. Navigate to Week page via navigation menu
 * 3. Create a weekly goal linked to an existing long-term goal
 * 4. Add a task to the weekly goal
 * 5. Add an ad-hoc task to "Other Tasks" section
 * 6. Verify both tasks exist in their respective sections
 */
test.describe.serial("Weekly Goals Management", () => {
  let loginPage: LoginPage;
  let navigationBar: NavigationBar;
  let weekPage: WeekPage;
  let createWeeklyGoalDialog: CreateWeeklyGoalDialog;
  let topBar: TopBar;

  // Get credentials from environment variables
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  test.beforeAll(() => {
    // Validate that environment variables are set
    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }
  });

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    navigationBar = new NavigationBar(page);
    weekPage = new WeekPage(page);
    createWeeklyGoalDialog = new CreateWeeklyGoalDialog(page);
    topBar = new TopBar(page);
  });

  test.afterEach(async ({ page }) => {
    await topBar.logout();
    await page.waitForURL(/.*login/, { timeout: 5000 });
  });

  test("should create weekly goal with task and ad-hoc task", async ({ page }) => {
    // Step 1: Login to the application
    await loginPage.goto();
    await loginPage.login(testEmail || "", testPassword || "");

    // Wait for successful login - should redirect to plans page
    await page.waitForURL(/.*plans/, { timeout: 10000 });
    expect(page.url()).toContain("/plans");

    // Step 2: Navigate to Week page using the navigation menu
    await navigationBar.goToWeek();

    // Wait for Week page to load
    await page.waitForURL(/.*\/week\/\d+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/week\/\d+/);

    // Wait for page data to load completely
    await weekPage.waitForPageLoad();

    // Step 3: Click "Add Weekly Goal" button
    await weekPage.clickAddWeeklyGoal();

    // Wait for dialog to appear
    await createWeeklyGoalDialog.waitForDialog();

    // Step 4: Fill in goal title "Test Weekly Goal One"
    await createWeeklyGoalDialog.fillTitle("Test Weekly Goal One");

    // Step 5: Select existing long-term goal "TestGoal"
    await createWeeklyGoalDialog.selectLongTermGoal("TestGoal");

    // Step 6: Click "Create Goal" button
    await createWeeklyGoalDialog.submit();

    // Wait for dialog to close and goal to appear
    await page.waitForTimeout(1000);

    // Verify the weekly goal was created
    const weeklyGoalExists = await weekPage.hasWeeklyGoal("Test Weekly Goal One");
    expect(weeklyGoalExists).toBe(true);

    // Step 7: Add a task to the weekly goal "Test Weekly Goal One"
    await weekPage.clickAddTaskForGoal("Test Weekly Goal One");

    // Step 8: Enter task title "Test Task for the week" and click "+" to add
    await weekPage.addTaskInline("Test Task for the week");

    // Wait for task to be created
    await page.waitForTimeout(500);

    // Step 9: Add an ad-hoc task in "Other Tasks" section
    await weekPage.clickAddAdHocTask();

    // Step 10: Enter task title "Test OTHER Task" and click "+" to add
    await weekPage.addTaskInline("Test OTHER Task");

    // Wait for ad-hoc task to be created
    await page.waitForTimeout(500);

    // Step 11: Verify the task exists within "Test Weekly Goal One"
    const weeklyGoalTask = weekPage.getTaskByTitle("Test Task for the week");
    await expect(weeklyGoalTask).toBeVisible();

    // Step 12: Verify the ad-hoc task exists in "Other Tasks" section
    const adHocTask = weekPage.getTaskByTitle("Test OTHER Task");
    await expect(adHocTask).toBeVisible();

    // Additional verification: Check that both tasks have the correct content
    const weeklyGoalTaskText = await weeklyGoalTask.textContent();
    expect(weeklyGoalTaskText).toContain("Test Task for the week");

    const adHocTaskText = await adHocTask.textContent();
    expect(adHocTaskText).toContain("Test OTHER Task");

    // Cleanup: Delete all created tasks and weekly goals
    await weekPage.deleteTasks(["Test Task for the week", "Test OTHER Task"]);
    await weekPage.deleteWeeklyGoals(["Test Weekly Goal One"]);
  });

  test("should allow adding multiple tasks to a weekly goal", async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(testEmail || "", testPassword || "");
    await page.waitForURL(/.*plans/, { timeout: 10000 });

    // Navigate to Week page
    await navigationBar.goToWeek();
    await page.waitForURL(/.*\/week\/\d+/, { timeout: 5000 });

    // Wait for page data to load completely
    await weekPage.waitForPageLoad();

    // Create a new weekly goal
    await weekPage.clickAddWeeklyGoal();
    await createWeeklyGoalDialog.waitForDialog();
    await createWeeklyGoalDialog.fillTitle("Multi-Task Goal");
    await createWeeklyGoalDialog.selectLongTermGoal("TestGoal");
    await createWeeklyGoalDialog.submit();
    await page.waitForTimeout(1000);

    // Add first task
    await weekPage.clickAddTaskForGoal("Multi-Task Goal");
    await weekPage.addTaskInline("First Task");
    await page.waitForTimeout(500);

    // Add second task
    await weekPage.clickAddTaskForGoal("Multi-Task Goal");
    await weekPage.addTaskInline("Second Task");
    await page.waitForTimeout(500);

    // Verify both tasks exist
    await expect(weekPage.getTaskByTitle("First Task")).toBeVisible();
    await expect(weekPage.getTaskByTitle("Second Task")).toBeVisible();

    // Cleanup: Delete all created tasks and weekly goals
    await weekPage.deleteTasks(["First Task", "Second Task"]);
    await weekPage.deleteWeeklyGoals(["Multi-Task Goal"]);
  });
});
