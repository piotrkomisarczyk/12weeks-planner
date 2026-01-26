import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill('');
    await loginPage.passwordInput.fill('');
  });

  test('should display login form', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle("Sign In | 12 Weeks Planner");

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await loginPage.emailInput.fill('');
    await loginPage.passwordInput.fill('');
    await loginPage.loginButton.click();

    // Check for validation error messages
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toHaveText('Password is required');
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Enter invalid email
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Check for HTML5 validation message on email input
    // Browser prevents form submission and shows native validation
    const validationMessage = await loginPage.getEmailValidationMessage();
    expect(validationMessage).toBeTruthy();
    expect(validationMessage).toContain('@');
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.goToRegister();
    
    // Verify navigation to register page
    await expect(page).toHaveURL(/.*register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.goToForgotPassword();
    
    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('should have accessible form elements', async ({ page }) => {
    // Check for proper labels and accessibility
    const emailLabel = page.locator('label[for*="email"], label:has-text("Email")');
    const passwordLabel = page.locator('label[for*="password"], label:has-text("Password")');

    // At least one form of label should be present
    const hasEmailLabel = await emailLabel.count() > 0;
    const hasPasswordLabel = await passwordLabel.count() > 0;

    expect(hasEmailLabel || (await loginPage.emailInput.getAttribute('aria-label'))).toBeTruthy();
    expect(hasPasswordLabel || (await loginPage.passwordInput.getAttribute('aria-label'))).toBeTruthy();
  });
});
