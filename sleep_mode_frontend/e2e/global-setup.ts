import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs once before all test files
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Verify Rails backend is running
    console.log('🔍 Checking Rails backend health...');
    const healthResponse = await page.request.get('http://localhost:3000/health');
    if (!healthResponse.ok()) {
      throw new Error(`Rails backend health check failed: ${healthResponse.status()}`);
    }
    console.log('✅ Rails backend is healthy');

    // 2. Verify React frontend is running
    console.log('🔍 Checking React frontend...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    console.log('✅ React frontend is accessible');

    // 3. Create test user accounts
    console.log('👤 Setting up test user accounts...');
    await setupTestUsers(page);

    // 4. Setup test environment variables
    process.env.E2E_TEST_USER_EMAIL = 'test@sleepmode.app';
    process.env.E2E_TEST_USER_PASSWORD = 'testpassword123';
    process.env.E2E_ADMIN_EMAIL = 'admin@sleepmode.app';
    process.env.E2E_ADMIN_PASSWORD = 'adminpassword123';

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup test user accounts via API
 */
async function setupTestUsers(page: any) {
  const testUsers = [
    {
      email: 'test@sleepmode.app',
      password: 'testpassword123',
      password_confirmation: 'testpassword123'
    },
    {
      email: 'admin@sleepmode.app',
      password: 'adminpassword123',
      password_confirmation: 'adminpassword123'
    }
  ];

  for (const user of testUsers) {
    try {
      // Check if user already exists by trying to login
      const loginResponse = await page.request.post('http://localhost:3000/api/v1/auth/login', {
        data: {
          user: {
            email: user.email,
            password: user.password
          }
        }
      });

      if (loginResponse.ok()) {
        console.log(`✅ Test user ${user.email} already exists`);
        continue;
      }

      // User doesn't exist, create them
      const registerResponse = await page.request.post('http://localhost:3000/api/v1/auth/register', {
        data: {
          user: user
        }
      });

      if (registerResponse.ok()) {
        console.log(`✅ Created test user: ${user.email}`);
      } else {
        const responseBody = await registerResponse.text();
        console.log(`⚠️  Failed to create user ${user.email}: ${responseBody}`);
      }
    } catch (error) {
      console.log(`⚠️  Error setting up user ${user.email}:`, error);
    }
  }
}

export default globalSetup; 