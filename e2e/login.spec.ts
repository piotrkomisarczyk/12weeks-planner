import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle("Sign In | 12 Weeks Planner");

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Try to submit without filling fields - use helper methods to ensure clean state
    await loginPage.fillEmail("");
    await loginPage.fillPassword("");
    await loginPage.loginButton.click();
    await page.waitForTimeout(500);
    // Check for validation error messages
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toHaveText("Email is required");
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toHaveText("Password is required");
  });

  test("should show validation error for invalid email format", async ({ page }) => {
    // Enter invalid email using helper methods for proper synchronization
    await loginPage.fillEmail("invalid-email");
    await loginPage.fillPassword("password123");

    // Click the button to trigger React validation
    await loginPage.loginButton.click();

    // Wait for React validation to process
    await page.waitForTimeout(500);

    // Check for React validation error message
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toHaveText("Please enter a valid email address");
  });

  test("should navigate to register page", async ({ page }) => {
    await loginPage.goToRegister();

    // Verify navigation to register page
    await expect(page).toHaveURL(/.*register/);
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await loginPage.goToForgotPassword();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test("should have accessible form elements", async ({ page }) => {
    // Check for proper labels and accessibility
    const emailLabel = page.locator('label[for*="email"], label:has-text("Email")');
    const passwordLabel = page.locator('label[for*="password"], label:has-text("Password")');

    // At least one form of label should be present
    const hasEmailLabel = (await emailLabel.count()) > 0;
    const hasPasswordLabel = (await passwordLabel.count()) > 0;

    expect(hasEmailLabel || (await loginPage.emailInput.getAttribute("aria-label"))).toBeTruthy();
    expect(hasPasswordLabel || (await loginPage.passwordInput.getAttribute("aria-label"))).toBeTruthy();
  });
});
