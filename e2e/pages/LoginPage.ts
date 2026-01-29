import { type Page, type Locator } from "@playwright/test";

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
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.loginButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.locator('[role="alert"]');
    this.emailError = page.locator("#email-error");
    this.passwordError = page.locator("#password-error");
    this.registerLink = page.locator('a[href="/register"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Fill in the login form and submit
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    // Clear fields first by clicking and selecting all
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.passwordInput.click();
    await this.passwordInput.clear();

    // Use pressSequentially for more reliable input with controlled React components
    await this.emailInput.pressSequentially(email, { delay: 50 });
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Wait for React state to stabilize
    await this.page.waitForTimeout(300);

    // Verify fields contain the expected values before submitting
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

  /**
   * Fill in the email field with proper synchronization
   * @param email - Email value to enter
   */
  async fillEmail(email: string) {
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    // Wait for React state to update
    await this.page.waitForTimeout(200);

    // Verify the value is set
    await this.page.waitForFunction(
      ({ email }) => {
        const emailInput = document.querySelector<HTMLInputElement>('[data-test-id="login-email-input"]');
        return emailInput?.value === email;
      },
      { email },
      { timeout: 3000 }
    );
  }

  /**
   * Fill in the password field with proper synchronization
   * @param password - Password value to enter
   */
  async fillPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Wait for React state to update
    await this.page.waitForTimeout(200);

    // Verify the value is set
    await this.page.waitForFunction(
      ({ password }) => {
        const passwordInput = document.querySelector<HTMLInputElement>('[data-test-id="login-password-input"]');
        return passwordInput?.value === password;
      },
      { password },
      { timeout: 3000 }
    );
  }
}
