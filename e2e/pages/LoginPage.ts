import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Login Page
 * Encapsulates login page elements and interactions
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
    this.emailError = page.locator('#email-error');
    this.passwordError = page.locator('#password-error');
    this.registerLink = page.locator('a[href="/register"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Fill in the login form and submit
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Get HTML5 validation message from email input
   */
  async getEmailValidationMessage() {
    return await this.emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
  }

  /**
   * Get HTML5 validation message from password input
   */
  async getPasswordValidationMessage() {
    return await this.passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
  }
}
