import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Navigation Bar
 * Encapsulates navigation links and interactions
 */
export class NavigationBar {
  readonly page: Page;
  readonly plansLink: Locator;
  readonly dashboardLink: Locator;
  readonly goalsLink: Locator;
  readonly hierarchyLink: Locator;
  readonly weekLink: Locator;
  readonly todayLink: Locator;
  readonly reviewLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.plansLink = page.getByTestId("nav-link-plans");
    this.dashboardLink = page.getByTestId("nav-link-dashboard");
    this.goalsLink = page.getByTestId("nav-link-goals");
    this.hierarchyLink = page.getByTestId("nav-link-hierarchy");
    this.weekLink = page.getByTestId("nav-link-week");
    this.todayLink = page.getByTestId("nav-link-today");
    this.reviewLink = page.getByTestId("nav-link-review");
  }

  /**
   * Navigate to the Plans page
   */
  async goToPlans() {
    await this.plansLink.click();
  }

  /**
   * Navigate to the Dashboard page
   */
  async goToDashboard() {
    await this.dashboardLink.click();
  }

  /**
   * Navigate to the Goals page
   */
  async goToGoals() {
    await this.goalsLink.click();
  }

  /**
   * Navigate to the Hierarchy page
   */
  async goToHierarchy() {
    await this.hierarchyLink.click();
  }

  /**
   * Navigate to the Week page
   */
  async goToWeek() {
    await this.weekLink.click();
  }

  /**
   * Navigate to the Today page
   */
  async goToToday() {
    await this.todayLink.click();
  }

  /**
   * Navigate to the Review page
   */
  async goToReview() {
    await this.reviewLink.click();
  }
}
