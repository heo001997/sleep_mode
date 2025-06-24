import { test, expect } from '@playwright/test';
import { loginUserViaUI, registerUserViaUI, logoutUserViaUI, TEST_USERS, checkUserAuthentication } from '../utils/auth-helpers';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const newUser = {
        email: `test-${Date.now()}@sleepmode.app`,
        password: 'testpassword123',
        passwordConfirmation: 'testpassword123'
      };

      await registerUserViaUI(page, newUser);

      // Verify user is redirected to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Verify user profile is shown
      await expect(page.locator('[data-testid="user-profile-dropdown"]')).toBeVisible();
    });

    test('should show validation errors for invalid registration', async ({ page }) => {
      await page.goto('/register');
      
      // Try to register with mismatched passwords
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="password-confirmation-input"]', 'password456');
      
      await page.click('[data-testid="register-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Password confirmation');
    });

    test('should show error for duplicate email registration', async ({ page }) => {
      await page.goto('/register');
      
      // Try to register with existing test user email
      await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="password-confirmation-input"]', 'password123');
      
      await page.click('[data-testid="register-button"]');
      
      // Should show error about email already taken
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('already been taken');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);

      // Verify user is on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Verify user is authenticated
      const isAuthenticated = await checkUserAuthentication(page);
      expect(isAuthenticated).toBe(true);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email or password');
      
      // Should remain on login page
      await expect(page).toHaveURL('/login');
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit without filling fields
      await page.click('[data-testid="login-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should persist authentication across page reloads', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Reload the page
      await page.reload();
      
      // Should still be authenticated and on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      const isAuthenticated = await checkUserAuthentication(page);
      expect(isAuthenticated).toBe(true);
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Then logout
      await logoutUserViaUI(page);
      
      // Should be redirected to login page
      await expect(page).toHaveURL('/login');
      
      // Should not be authenticated
      const isAuthenticated = await checkUserAuthentication(page);
      expect(isAuthenticated).toBe(false);
    });

    test('should clear authentication data on logout', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      await logoutUserViaUI(page);
      
      // Check that auth token is cleared from localStorage
      const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
      expect(authToken).toBeNull();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should redirect unauthenticated users from profile page', async ({ page }) => {
      await page.goto('/profile');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from settings page', async ({ page }) => {
      await page.goto('/settings');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login');
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Should be able to access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Should be able to access profile
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
      
      // Should be able to access settings
      await page.goto('/settings');
      await expect(page).toHaveURL('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should handle expired tokens gracefully', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Simulate expired token by setting invalid token
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'expired-token');
      });
      
      // Try to access a protected route
      await page.goto('/dashboard');
      
      // Should be redirected to login due to invalid token
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('session expired');
    });

    test('should handle network errors during authentication', async ({ page }) => {
      // Intercept login request and simulate network error
      await page.route('**/api/v1/auth/login', route => {
        route.abort('failed');
      });
      
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.regular.password);
      
      await page.click('[data-testid="login-button"]');
      
      // Should show network error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    });
  });

  test.describe('Navigation', () => {
    test('should redirect authenticated users away from auth pages', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Try to access login page while authenticated
      await page.goto('/login');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should redirect authenticated users away from register page', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Try to access register page while authenticated
      await page.goto('/register');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should allow navigation between protected routes', async ({ page }) => {
      await loginUserViaUI(page, TEST_USERS.regular);
      
      // Navigate to profile
      await page.click('[data-testid="profile-nav-link"]');
      await expect(page).toHaveURL('/profile');
      
      // Navigate to settings
      await page.click('[data-testid="settings-nav-link"]');
      await expect(page).toHaveURL('/settings');
      
      // Navigate back to dashboard
      await page.click('[data-testid="dashboard-nav-link"]');
      await expect(page).toHaveURL('/dashboard');
    });
  });
}); 