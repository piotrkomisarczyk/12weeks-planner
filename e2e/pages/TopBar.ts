import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Top Bar
 * Encapsulates user menu interactions and theme toggle
 */
export class TopBar {
  readonly page: Page;
  readonly userMenuButton: Locator;
  readonly logoutButton: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuButton = page.getByRole('button', { name: 'User menu' });
    this.logoutButton = page.getByTestId('logout-button');
    this.themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  }

  /**
   * Open the user menu dropdown
   */
  async openUserMenu() {
    await this.userMenuButton.click();
  }

  /**
   * Logout the current user
   * Opens the user menu and clicks the logout button
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /**
   * Toggle the theme (light/dark mode)
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }
}
