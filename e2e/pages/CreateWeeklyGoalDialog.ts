import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Create Weekly Goal Dialog
 * Encapsulates dialog elements and interactions for creating weekly goals
 */
export class CreateWeeklyGoalDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly longTermGoalSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("create-weekly-goal-dialog");
    this.titleInput = page.getByTestId("weekly-goal-title-input");
    this.longTermGoalSelect = page.getByTestId("weekly-goal-longterm-select");
    this.submitButton = page.getByTestId("create-weekly-goal-submit-button");
    this.cancelButton = page.getByTestId("create-weekly-goal-cancel-button");
  }

  /**
   * Wait for the dialog to be visible
   */
  async waitForDialog(timeout = 10000) {
    await this.dialog.waitFor({ state: "visible", timeout });
  }

  /**
   * Fill in the goal title
   */
  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  /**
   * Select a long-term goal by its title
   */
  async selectLongTermGoal(goalTitle: string) {
    // Click the select trigger to open the dropdown
    await this.longTermGoalSelect.click();

    // Wait for the dropdown to be visible and select the option
    const option = this.page.getByTestId(`longterm-goal-option-${goalTitle}`);
    await option.waitFor({ state: "visible" });
    await option.click();
  }

  /**
   * Select "None" for long-term goal
   */
  async selectNoLongTermGoal() {
    await this.longTermGoalSelect.click();
    const noneOption = this.page.getByTestId("longterm-goal-option-none");
    await noneOption.click();
  }

  /**
   * Click the submit button to create the goal
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Click the cancel button to close the dialog
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Create a weekly goal with the given title and optional long-term goal
   */
  async createGoal(title: string, longTermGoalTitle?: string) {
    await this.waitForDialog();
    await this.fillTitle(title);

    if (longTermGoalTitle) {
      await this.selectLongTermGoal(longTermGoalTitle);
    }

    await this.submit();

    // Wait for dialog to close
    await this.dialog.waitFor({ state: "hidden" });
  }
}
