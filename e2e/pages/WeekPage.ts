import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Week Planning Page
 * Encapsulates week page elements and interactions for weekly goals and tasks
 */
export class WeekPage {
  readonly page: Page;
  readonly addWeeklyGoalButton: Locator;
  readonly otherTasksSection: Locator;
  readonly addAdHocTaskButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addWeeklyGoalButton = page.getByTestId("add-weekly-goal-button");
    this.otherTasksSection = page.getByTestId("other-tasks-section");
    this.addAdHocTaskButton = page.getByTestId("add-adhoc-task-button");
  }

  /**
   * Navigate to the week page for a specific plan and week number
   */
  async goto(planId: string, weekNumber = 1) {
    await this.page.goto(`/plans/${planId}/week/${weekNumber}`);
  }

  /**
   * Wait for the week page to fully load (data fetching complete)
   * This waits for the loading spinner to disappear and the main content to appear
   */
  async waitForPageLoad() {
    // Wait for the "Add Weekly Goal" button to be visible, which indicates loading is complete
    await this.addWeeklyGoalButton.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Click the "Add Weekly Goal" button to open the dialog
   */
  async clickAddWeeklyGoal() {
    // Wait for button to be visible and enabled before clicking
    await this.addWeeklyGoalButton.waitFor({ state: "visible" });
    
    // Wait for button to be enabled (not disabled)
    // This ensures React has finished hydration and state updates
    await this.page.waitForFunction(
      (selector) => {
        const button = document.querySelector(`[data-test-id="${selector}"]`);
        return button && !button.hasAttribute("disabled") && !button.hasAttribute("aria-disabled");
      },
      "add-weekly-goal-button",
      { timeout: 5000 }
    );
    
    await this.addWeeklyGoalButton.click();
  }

  /**
   * Get a weekly goal element by its title
   */
  getWeeklyGoalByTitle(title: string): Locator {
    return this.page.getByTestId(`weekly-goal-title-${title}`);
  }

  /**
   * Click "Add Task" button for a specific weekly goal
   */
  async clickAddTaskForGoal(goalTitle: string) {
    const addTaskButton = this.page.getByTestId(`add-task-to-goal-${goalTitle}`);
    await addTaskButton.click();
  }

  /**
   * Get a task item by its title
   */
  getTaskByTitle(title: string): Locator {
    return this.page.getByTestId(`task-item-${title}`);
  }

  /**
   * Click the "Add Task" button in the Other Tasks section
   */
  async clickAddAdHocTask() {
    await this.addAdHocTaskButton.click();
  }

  /**
   * Fill in task title in the inline add task form and submit
   */
  async addTaskInline(title: string) {
    const taskInput = this.page.getByTestId("inline-task-title-input");
    const submitButton = this.page.getByTestId("inline-task-submit-button");

    await taskInput.fill(title);
    await submitButton.click();
  }

  /**
   * Wait for a task to appear in the list
   */
  async waitForTask(title: string) {
    const task = this.getTaskByTitle(title);
    await task.waitFor({ state: "visible" });
  }

  /**
   * Check if a weekly goal exists
   */
  async hasWeeklyGoal(title: string): Promise<boolean> {
    const goal = this.getWeeklyGoalByTitle(title);
    return await goal.isVisible();
  }

  /**
   * Check if a task exists
   */
  async hasTask(title: string): Promise<boolean> {
    const task = this.getTaskByTitle(title);
    return await task.isVisible();
  }

  /**
   * Delete a task by opening its menu and clicking delete
   */
  async deleteTask(taskTitle: string) {
    // Open the task menu by hovering over the task first to make menu visible
    const taskItem = this.getTaskByTitle(taskTitle);
    await taskItem.hover();

    // Click the task menu button
    const menuButton = this.page.getByTestId(`task-menu-${taskTitle}`);
    await menuButton.click();

    // Click the delete menu item
    const deleteMenuItem = this.page.getByTestId(`task-delete-menu-item-${taskTitle}`);
    await deleteMenuItem.click();
  }

  /**
   * Confirm task deletion in the confirmation dialog
   */
  async confirmTaskDeletion(taskTitle: string) {
    const confirmButton = this.page.getByTestId(`task-delete-confirm-button-${taskTitle}`);
    await confirmButton.click();
  }

  /**
   * Delete a weekly goal by opening its menu and clicking delete
   */
  async deleteWeeklyGoal(goalTitle: string) {
    // Click the weekly goal menu button
    const menuButton = this.page.getByTestId(`weekly-goal-menu-${goalTitle}`);
    await menuButton.click();

    // Click the delete menu item
    const deleteMenuItem = this.page.getByTestId(`weekly-goal-delete-menu-item-${goalTitle}`);
    await deleteMenuItem.click();
  }

  /**
   * Confirm weekly goal deletion in the confirmation dialog
   */
  async confirmWeeklyGoalDeletion(goalTitle: string) {
    const confirmButton = this.page.getByTestId(`weekly-goal-delete-confirm-button-${goalTitle}`);
    await confirmButton.click();
  }

  /**
   * Get all weekly goal titles currently visible on the page
   */
  async getAllWeeklyGoalTitles(): Promise<string[]> {
    // Find all elements with data-test-id that start with "weekly-goal-title-"
    const goalElements = await this.page.locator('[data-test-id^="weekly-goal-title-"]').all();
    const titles: string[] = [];

    for (const element of goalElements) {
      const text = await element.textContent();
      if (text) {
        titles.push(text.trim());
      }
    }

    return titles;
  }

  /**
   * Get all task titles within a specific weekly goal
   */
  async getTasksForWeeklyGoal(goalTitle: string): Promise<string[]> {
    // First, expand the goal if it's collapsed
    const goalTitleElement = this.getWeeklyGoalByTitle(goalTitle);
    await goalTitleElement.click();

    // Wait a bit for the accordion to expand
    await this.page.waitForTimeout(500);

    // Get all task items within the goal's accordion
    const goalCard = goalTitleElement.locator('xpath=ancestor::div[contains(@class, "bg-card")]');
    const taskElements = await goalCard.locator('[data-test-id^="task-item-"]').all();

    const titles: string[] = [];
    for (const element of taskElements) {
      const testId = await element.getAttribute("data-test-id");
      if (testId) {
        // Extract task title from data-test-id="task-item-{title}"
        const title = testId.replace("task-item-", "");
        titles.push(title);
      }
    }

    return titles;
  }

  /**
   * Get all ad-hoc task titles in the "Other Tasks" section
   */
  async getAllAdHocTasks(): Promise<string[]> {
    // First, expand the "Other Tasks" section if collapsed
    const otherTasksSection = this.otherTasksSection;
    const isVisible = await otherTasksSection.isVisible();

    if (isVisible) {
      await otherTasksSection.click();
      await this.page.waitForTimeout(500);
    }

    // Find all task items in the ad-hoc section
    const adHocSection = this.page
      .locator('[data-test-id="other-tasks-section"]')
      .locator('xpath=ancestor::div[contains(@class, "bg-card")]');
    const taskElements = await adHocSection.locator('[data-test-id^="task-item-"]').all();

    const titles: string[] = [];
    for (const element of taskElements) {
      const testId = await element.getAttribute("data-test-id");
      if (testId) {
        // Extract task title from data-test-id="task-item-{title}"
        const title = testId.replace("task-item-", "");
        titles.push(title);
      }
    }

    return titles;
  }

  /**
   * Delete multiple tasks by their titles
   * @param taskTitles - Array of task titles to delete
   */
  async deleteTasks(taskTitles: string[]) {
    for (const taskTitle of taskTitles) {
      await this.deleteTask(taskTitle);
      await this.confirmTaskDeletion(taskTitle);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Delete multiple weekly goals by their titles
   * @param goalTitles - Array of goal titles to delete
   */
  async deleteWeeklyGoals(goalTitles: string[]) {
    for (const goalTitle of goalTitles) {
      await this.deleteWeeklyGoal(goalTitle);
      await this.confirmWeeklyGoalDeletion(goalTitle);
      await this.page.waitForTimeout(500);
    }
  }
}
