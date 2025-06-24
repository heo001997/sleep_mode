import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  token?: string;
}

export const TEST_USERS = {
  regular: {
    email: 'test@sleepmode.app',
    password: 'testpassword123'
  },
  admin: {
    email: 'admin@sleepmode.app',
    password: 'adminpassword123'
  }
} as const;

/**
 * Login a user via the UI
 */
export async function loginUserViaUI(page: Page, user: TestUser) {
  await page.goto('/login');
  
  // Wait for login form to be visible
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  
  // Submit form
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  
  console.log(`✅ Successfully logged in user: ${user.email}`);
}

/**
 * Login a user via API and set auth tokens
 */
export async function loginUserViaAPI(page: Page, user: TestUser): Promise<string> {
  const response = await page.request.post('http://localhost:3000/api/v1/auth/login', {
    data: {
      user: {
        email: user.email,
        password: user.password
      }
    }
  });

  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  const token = responseData.data?.token;
  
  expect(token).toBeTruthy();
  
  // Set the auth token in localStorage for frontend to use
  await page.addInitScript((tokenValue) => {
    localStorage.setItem('authToken', tokenValue);
  }, token);
  
  console.log(`✅ Successfully authenticated user via API: ${user.email}`);
  return token;
}

/**
 * Logout user via UI
 */
export async function logoutUserViaUI(page: Page) {
  // Click user profile dropdown
  await page.click('[data-testid="user-profile-dropdown"]');
  
  // Click logout button
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to login page
  await expect(page).toHaveURL('/login');
  
  console.log('✅ Successfully logged out user');
}

/**
 * Register a new user via UI
 */
export async function registerUserViaUI(page: Page, user: TestUser & { passwordConfirmation?: string }) {
  await page.goto('/register');
  
  // Wait for register form to be visible
  await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.fill('[data-testid="password-confirmation-input"]', user.passwordConfirmation || user.password);
  
  // Submit form
  await page.click('[data-testid="register-button"]');
  
  // Wait for successful redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  
  console.log(`✅ Successfully registered user: ${user.email}`);
}

/**
 * Check if user is authenticated by checking UI state
 */
export async function checkUserAuthentication(page: Page): Promise<boolean> {
  try {
    // Check if we're on the dashboard and user info is visible
    await expect(page.locator('[data-testid="user-profile-dropdown"]')).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for API request to complete and verify response
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp, expectedStatus = 200) {
  const response = await page.waitForResponse(response => 
    (typeof urlPattern === 'string' ? response.url().includes(urlPattern) : urlPattern.test(response.url())) &&
    response.status() === expectedStatus
  );
  
  return response;
}

/**
 * Setup authenticated session with token storage
 */
export async function setupAuthenticatedSession(page: Page, user: TestUser = TEST_USERS.regular) {
  const token = await loginUserViaAPI(page, user);
  
  // Navigate to dashboard to establish session
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  
  return token;
} 