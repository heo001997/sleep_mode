import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from '../utils/auth-helpers';
import { 
  createSleepSession, 
  createMultipleSleepSessions, 
  deleteSleepSession, 
  updateSleepSession,
  getSleepSessions,
  cleanupUserSleepSessions,
  generateSleepSessionData,
  waitForSleepSessionsToLoad,
  createSleepSessionViaUI 
} from '../utils/data-helpers';

test.describe('Sleep Session Management', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Setup authenticated session and get token
    authToken = await setupAuthenticatedSession(page);
    
    // Clean up any existing test data
    await cleanupUserSleepSessions(page, authToken);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    if (authToken) {
      await cleanupUserSleepSessions(page, authToken);
    }
  });

  test.describe('Dashboard Sleep Session Display', () => {
    test('should display empty state when no sleep sessions exist', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show empty state
      await expect(page.locator('[data-testid="empty-sleep-sessions"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-sleep-sessions"]')).toContainText('No sleep sessions');
      
      // Should show call-to-action to create first session
      await expect(page.locator('[data-testid="create-first-session-button"]')).toBeVisible();
    });

    test('should display sleep sessions list when sessions exist', async ({ page }) => {
      // Create test sleep sessions
      await createMultipleSleepSessions(page, authToken, 3);
      
      await page.goto('/dashboard');
      
      // Should show sleep sessions list
      await waitForSleepSessionsToLoad(page, 3);
      
      // Verify session cards contain expected data
      const sessionCards = page.locator('[data-testid="sleep-session-item"]');
      await expect(sessionCards).toHaveCount(3);
      
      // Check first session card contains expected elements
      const firstCard = sessionCards.first();
      await expect(firstCard.locator('[data-testid="session-date"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="session-duration"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="session-quality"]')).toBeVisible();
    });

    test('should show recent sleep session summary', async ({ page }) => {
      // Create a recent sleep session
      const sessionData = generateSleepSessionData({
        quality_rating: 9,
        notes: 'Great sleep last night'
      });
      
      await createSleepSession(page, authToken, sessionData);
      
      await page.goto('/dashboard');
      
      // Should show summary stats
      await expect(page.locator('[data-testid="sleep-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-sessions"]')).toContainText('1');
      await expect(page.locator('[data-testid="average-quality"]')).toContainText('9');
      await expect(page.locator('[data-testid="total-sleep-time"]')).toBeVisible();
    });

    test('should navigate to detailed session view on click', async ({ page }) => {
      // Create a test session
      const session = await createSleepSession(page, authToken, generateSleepSessionData());
      
      await page.goto('/dashboard');
      await waitForSleepSessionsToLoad(page, 1);
      
      // Click on session card
      await page.click('[data-testid="sleep-session-item"]');
      
      // Should navigate to session detail page
      await expect(page).toHaveURL(`/sleep-sessions/${session.id}`);
      await expect(page.locator('[data-testid="session-details"]')).toBeVisible();
    });
  });

  test.describe('Sleep Session Creation', () => {
    test('should create sleep session via UI form', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click create session button
      await page.click('[data-testid="create-sleep-session-button"]');
      
      // Should navigate to create form
      await expect(page).toHaveURL('/sleep-sessions/new');
      await expect(page.locator('[data-testid="sleep-session-form"]')).toBeVisible();
      
      // Fill in sleep session data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startTime = new Date(tomorrow);
      startTime.setHours(22, 30, 0, 0); // 10:30 PM
      const endTime = new Date(tomorrow);
      endTime.setHours(30, 0, 0, 0); // 6:00 AM next day
      endTime.setDate(endTime.getDate() + 1);
      
      await page.fill('[data-testid="start-time-input"]', startTime.toISOString().slice(0, 16));
      await page.fill('[data-testid="end-time-input"]', endTime.toISOString().slice(0, 16));
      await page.selectOption('[data-testid="quality-rating-select"]', '8');
      await page.fill('[data-testid="notes-input"]', 'UI test sleep session');
      
      // Submit form
      await page.click('[data-testid="submit-sleep-session-button"]');
      
      // Should show success message and redirect
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Sleep session created');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Verify session appears in list
      await waitForSleepSessionsToLoad(page, 1);
      await expect(page.locator('[data-testid="sleep-session-item"]')).toContainText('UI test sleep session');
    });

    test('should show validation errors for invalid form data', async ({ page }) => {
      await page.goto('/sleep-sessions/new');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-sleep-session-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="start-time-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-time-error"]')).toContainText('Start time is required');
    });

    test('should validate end time is after start time', async ({ page }) => {
      await page.goto('/sleep-sessions/new');
      
      // Set end time before start time
      const today = new Date();
      const startTime = new Date(today);
      startTime.setHours(22, 0, 0, 0);
      const endTime = new Date(today);
      endTime.setHours(20, 0, 0, 0); // Earlier than start time
      
      await page.fill('[data-testid="start-time-input"]', startTime.toISOString().slice(0, 16));
      await page.fill('[data-testid="end-time-input"]', endTime.toISOString().slice(0, 16));
      
      await page.click('[data-testid="submit-sleep-session-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="end-time-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="end-time-error"]')).toContainText('End time must be after start time');
    });
  });

  test.describe('Sleep Session Editing', () => {
    test('should edit sleep session via UI', async ({ page }) => {
      // Create a test session
      const session = await createSleepSession(page, authToken, generateSleepSessionData({
        notes: 'Original notes'
      }));
      
      await page.goto(`/sleep-sessions/${session.id}`);
      
      // Click edit button
      await page.click('[data-testid="edit-session-button"]');
      
      // Should show edit form
      await expect(page.locator('[data-testid="sleep-session-form"]')).toBeVisible();
      
      // Update notes and quality rating
      await page.fill('[data-testid="notes-input"]', 'Updated notes via UI');
      await page.selectOption('[data-testid="quality-rating-select"]', '10');
      
      // Submit changes
      await page.click('[data-testid="submit-sleep-session-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Sleep session updated');
      
      // Verify changes are reflected
      await expect(page.locator('[data-testid="session-notes"]')).toContainText('Updated notes via UI');
      await expect(page.locator('[data-testid="session-quality"]')).toContainText('10');
    });

    test('should cancel editing and return to view mode', async ({ page }) => {
      const session = await createSleepSession(page, authToken, generateSleepSessionData());
      
      await page.goto(`/sleep-sessions/${session.id}`);
      await page.click('[data-testid="edit-session-button"]');
      
      // Make some changes
      await page.fill('[data-testid="notes-input"]', 'Changes that should be discarded');
      
      // Cancel editing
      await page.click('[data-testid="cancel-edit-button"]');
      
      // Should return to view mode without saving changes
      await expect(page.locator('[data-testid="sleep-session-form"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="session-details"]')).toBeVisible();
      
      // Changes should not be reflected
      await expect(page.locator('[data-testid="session-notes"]')).not.toContainText('Changes that should be discarded');
    });
  });

  test.describe('Sleep Session Deletion', () => {
    test('should delete sleep session with confirmation', async ({ page }) => {
      const session = await createSleepSession(page, authToken, generateSleepSessionData());
      
      await page.goto(`/sleep-sessions/${session.id}`);
      
      // Click delete button
      await page.click('[data-testid="delete-session-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toContainText('Are you sure');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Sleep session deleted');
      
      // Session should no longer exist
      await expect(page.locator('[data-testid="empty-sleep-sessions"]')).toBeVisible();
    });

    test('should cancel deletion and remain on session page', async ({ page }) => {
      const session = await createSleepSession(page, authToken, generateSleepSessionData());
      
      await page.goto(`/sleep-sessions/${session.id}`);
      
      await page.click('[data-testid="delete-session-button"]');
      
      // Cancel deletion
      await page.click('[data-testid="cancel-delete-button"]');
      
      // Should close dialog and remain on session page
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      await expect(page).toHaveURL(`/sleep-sessions/${session.id}`);
      await expect(page.locator('[data-testid="session-details"]')).toBeVisible();
    });
  });

  test.describe('Sleep Session Filtering and Search', () => {
    test('should filter sleep sessions by date range', async ({ page }) => {
      // Create sessions across different dates
      const sessions = await createMultipleSleepSessions(page, authToken, 5);
      
      await page.goto('/dashboard');
      await waitForSleepSessionsToLoad(page, 5);
      
      // Open date filter
      await page.click('[data-testid="date-filter-button"]');
      
      // Set date range for last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      await page.fill('[data-testid="start-date-filter"]', threeDaysAgo.toISOString().slice(0, 10));
      await page.fill('[data-testid="end-date-filter"]', new Date().toISOString().slice(0, 10));
      
      await page.click('[data-testid="apply-filter-button"]');
      
      // Should show filtered results
      await expect(page.locator('[data-testid="sleep-session-item"]')).toHaveCount(3);
      await expect(page.locator('[data-testid="filter-status"]')).toContainText('Showing 3 of 5 sessions');
    });

    test('should search sleep sessions by notes', async ({ page }) => {
      // Create sessions with different notes
      await createSleepSession(page, authToken, generateSleepSessionData({
        notes: 'Great sleep with new mattress'
      }));
      await createSleepSession(page, authToken, generateSleepSessionData({
        notes: 'Poor sleep due to noise'
      }));
      await createSleepSession(page, authToken, generateSleepSessionData({
        notes: 'Average night'
      }));
      
      await page.goto('/dashboard');
      await waitForSleepSessionsToLoad(page, 3);
      
      // Search for specific term
      await page.fill('[data-testid="search-input"]', 'mattress');
      await page.click('[data-testid="search-button"]');
      
      // Should show only matching session
      await expect(page.locator('[data-testid="sleep-session-item"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="sleep-session-item"]')).toContainText('Great sleep with new mattress');
    });
  });

  test.describe('Sleep Analytics and Charts', () => {
    test('should display sleep quality trend chart', async ({ page }) => {
      // Create sessions with varying quality ratings
      const sessions = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        sessions.push(await createSleepSession(page, authToken, generateSleepSessionData({
          start_time: new Date(date.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          end_time: date.toISOString(),
          quality_rating: 6 + i % 5 // Ratings between 6-10
        })));
      }
      
      await page.goto('/analytics');
      
      // Should display quality trend chart
      await expect(page.locator('[data-testid="quality-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="chart-title"]')).toContainText('Sleep Quality Trend');
      
      // Should show data points for the last 7 days
      await expect(page.locator('[data-testid="chart-data-point"]')).toHaveCount(7);
    });

    test('should display sleep duration statistics', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 10);
      
      await page.goto('/analytics');
      
      // Should show duration statistics
      await expect(page.locator('[data-testid="duration-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-duration"]')).toBeVisible();
      await expect(page.locator('[data-testid="longest-sleep"]')).toBeVisible();
      await expect(page.locator('[data-testid="shortest-sleep"]')).toBeVisible();
      
      // Verify statistics contain expected format (hours and minutes)
      await expect(page.locator('[data-testid="average-duration"]')).toContainText('h');
      await expect(page.locator('[data-testid="average-duration"]')).toContainText('m');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display properly on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip('This test only runs on mobile viewports');
      }
      
      await createMultipleSleepSessions(page, authToken, 3);
      await page.goto('/dashboard');
      
      // Mobile layout should be active
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      
      // Sleep session cards should stack vertically
      const sessionCards = page.locator('[data-testid="sleep-session-item"]');
      await expect(sessionCards).toHaveCount(3);
      
      // Navigation should be collapsible
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Touch interactions should work
      await sessionCards.first().tap();
      await expect(page).toHaveURL(/\/sleep-sessions\/\d+/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API request and simulate server error
      await page.route('**/api/v1/sleep_sessions', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/dashboard');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load sleep sessions');
      
      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle network connectivity issues', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Simulate network going offline
      await page.context().setOffline(true);
      
      // Try to create a new session
      await page.click('[data-testid="create-sleep-session-button"]');
      await page.fill('[data-testid="start-time-input"]', new Date().toISOString().slice(0, 16));
      await page.click('[data-testid="submit-sleep-session-button"]');
      
      // Should show offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-message"]')).toContainText('You are currently offline');
      
      // Restore network connection
      await page.context().setOffline(false);
      
      // Should allow retry
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });
}); 