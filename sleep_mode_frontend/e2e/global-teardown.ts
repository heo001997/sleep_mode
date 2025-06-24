import { chromium, FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Runs once after all test files complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');

  // Create a browser instance for cleanup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Cleanup test data if needed
    console.log('🗑️  Cleaning up test data...');
    await cleanupTestData(page);

    // 2. Clear any cached data
    console.log('🔄 Clearing browser cache...');
    await context.clearCookies();

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error as we don't want to fail the entire test suite
    // if cleanup fails
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Cleanup test data via API
 */
async function cleanupTestData(page: any) {
  const testUserEmails = [
    'test@sleepmode.app',
    'admin@sleepmode.app'
  ];

  for (const email of testUserEmails) {
    try {
      // Login as test user to get token
      const loginResponse = await page.request.post('http://localhost:3000/api/v1/auth/login', {
        data: {
          user: {
            email: email,
            password: email.includes('admin') ? 'adminpassword123' : 'testpassword123'
          }
        }
      });

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        const token = loginData.data?.token;

        if (token) {
          // Get user's sleep sessions and delete them
          const sessionsResponse = await page.request.get('http://localhost:3000/api/v1/sleep_sessions', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (sessionsResponse.ok()) {
            const sessionsData = await sessionsResponse.json();
            const sessions = sessionsData.data?.sleep_sessions || [];

            // Delete each sleep session
            for (const session of sessions) {
              await page.request.delete(`http://localhost:3000/api/v1/sleep_sessions/${session.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            }

            console.log(`✅ Cleaned up ${sessions.length} sleep sessions for ${email}`);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Error cleaning up data for ${email}:`, error);
    }
  }
}

export default globalTeardown; 