import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, loginUserViaUI, TEST_USERS } from '../utils/auth-helpers';
import { createMultipleSleepSessions } from '../utils/data-helpers';

test.describe('Navigation and User Experience', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Setup authenticated session
    authToken = await setupAuthenticatedSession(page);
  });

  test.describe('Primary Navigation', () => {
    test('should navigate between main sections', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify we start on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-dashboard"]')).toHaveClass(/active/);
      
      // Navigate to profile
      await page.click('[data-testid="nav-profile"]');
      await expect(page).toHaveURL('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-profile"]')).toHaveClass(/active/);
      
      // Navigate to settings
      await page.click('[data-testid="nav-settings"]');
      await expect(page).toHaveURL('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toHaveClass(/active/);
      
      // Navigate to analytics
      await page.click('[data-testid="nav-analytics"]');
      await expect(page).toHaveURL('/analytics');
      await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-analytics"]')).toHaveClass(/active/);
      
      // Navigate back to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    });

    test('should show current page in navigation', async ({ page }) => {
      // Test that navigation state reflects current page
      const routes = [
        { path: '/dashboard', testId: 'nav-dashboard' },
        { path: '/profile', testId: 'nav-profile' },
        { path: '/settings', testId: 'nav-settings' },
        { path: '/analytics', testId: 'nav-analytics' }
      ];

      for (const route of routes) {
        await page.goto(route.path);
        await expect(page.locator(`[data-testid="${route.testId}"]`)).toHaveClass(/active/);
        
        // Other nav items should not be active
        const otherNavItems = routes.filter(r => r.testId !== route.testId);
        for (const otherRoute of otherNavItems) {
          await expect(page.locator(`[data-testid="${otherRoute.testId}"]`)).not.toHaveClass(/active/);
        }
      }
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate forward through pages
      await page.click('[data-testid="nav-profile"]');
      await expect(page).toHaveURL('/profile');
      
      await page.click('[data-testid="nav-settings"]');
      await expect(page).toHaveURL('/settings');
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
      
      await page.goBack();
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Use browser forward button
      await page.goForward();
      await expect(page).toHaveURL('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should show breadcrumbs on detail pages', async ({ page }) => {
      // Create a sleep session and navigate to its detail page
      await createMultipleSleepSessions(page, authToken, 1);
      await page.goto('/dashboard');
      
      await page.click('[data-testid="sleep-session-item"]');
      
      // Should show breadcrumb navigation
      await expect(page.locator('[data-testid="breadcrumb-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-dashboard"]')).toContainText('Dashboard');
      await expect(page.locator('[data-testid="breadcrumb-current"]')).toContainText('Sleep Session');
      
      // Clicking breadcrumb should navigate back
      await page.click('[data-testid="breadcrumb-dashboard"]');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should show breadcrumbs on edit pages', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 1);
      await page.goto('/dashboard');
      
      await page.click('[data-testid="sleep-session-item"]');
      await page.click('[data-testid="edit-session-button"]');
      
      // Should show breadcrumb with edit context
      await expect(page.locator('[data-testid="breadcrumb-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-session"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-current"]')).toContainText('Edit');
    });
  });

  test.describe('Search and Global Navigation', () => {
    test('should perform global search from header', async ({ page }) => {
      // Create sessions with different notes
      await createMultipleSleepSessions(page, authToken, 5);
      
      await page.goto('/dashboard');
      
      // Use global search in header
      await page.fill('[data-testid="global-search-input"]', 'sleep');
      await page.press('[data-testid="global-search-input"]', 'Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-result-item"]')).toHaveCount(5);
    });

    test('should show recent items in global search dropdown', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 3);
      await page.goto('/dashboard');
      
      // Click on a session to make it "recent"
      await page.click('[data-testid="sleep-session-item"]');
      await page.goto('/dashboard');
      
      // Focus on search input should show recent items
      await page.click('[data-testid="global-search-input"]');
      
      await expect(page.locator('[data-testid="recent-items-dropdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-item"]')).toHaveCount(1);
    });
  });

  test.describe('Modal and Dialog Navigation', () => {
    test('should handle modal navigation correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open create sleep session modal
      await page.click('[data-testid="create-sleep-session-button"]');
      
      // Should show modal and update URL
      await expect(page.locator('[data-testid="sleep-session-modal"]')).toBeVisible();
      await expect(page).toHaveURL('/sleep-sessions/new');
      
      // Escape key should close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="sleep-session-modal"]')).not.toBeVisible();
      await expect(page).toHaveURL('/dashboard');
      
      // Clicking backdrop should close modal
      await page.click('[data-testid="create-sleep-session-button"]');
      await page.click('[data-testid="modal-backdrop"]');
      await expect(page.locator('[data-testid="sleep-session-modal"]')).not.toBeVisible();
    });

    test('should handle confirmation dialogs', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 1);
      await page.goto('/dashboard');
      
      await page.click('[data-testid="sleep-session-item"]');
      await page.click('[data-testid="delete-session-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      
      // Escape should close dialog without action
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      
      // Should remain on session page
      await expect(page).toHaveURL(/\/sleep-sessions\/\d+/);
    });
  });

  test.describe('Form Navigation and State', () => {
    test('should preserve form state during navigation', async ({ page }) => {
      await page.goto('/sleep-sessions/new');
      
      // Fill in partial form data
      await page.fill('[data-testid="notes-input"]', 'Partial form data');
      await page.selectOption('[data-testid="quality-rating-select"]', '7');
      
      // Navigate away and back
      await page.click('[data-testid="nav-dashboard"]');
      await page.click('[data-testid="create-sleep-session-button"]');
      
      // Form should be reset (new session)
      await expect(page.locator('[data-testid="notes-input"]')).toHaveValue('');
      await expect(page.locator('[data-testid="quality-rating-select"]')).toHaveValue('');
    });

    test('should warn about unsaved changes', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 1);
      await page.goto('/dashboard');
      
      await page.click('[data-testid="sleep-session-item"]');
      await page.click('[data-testid="edit-session-button"]');
      
      // Make changes to form
      await page.fill('[data-testid="notes-input"]', 'Unsaved changes');
      
      // Try to navigate away
      await page.click('[data-testid="nav-dashboard"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toContainText('unsaved changes');
      
      // Cancel should stay on current page
      await page.click('[data-testid="cancel-navigation-button"]');
      await expect(page).toHaveURL(/\/sleep-sessions\/\d+\/edit/);
      
      // Discard changes should navigate away
      await page.click('[data-testid="nav-dashboard"]');
      await page.click('[data-testid="discard-changes-button"]');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Deep Linking and URL State', () => {
    test('should handle direct navigation to deep URLs', async ({ page }) => {
      // Create a session and get its ID
      const sessions = await createMultipleSleepSessions(page, authToken, 1);
      const sessionId = sessions[0].id;
      
      // Direct navigation to session detail
      await page.goto(`/sleep-sessions/${sessionId}`);
      
      // Should load directly to session detail
      await expect(page.locator('[data-testid="session-details"]')).toBeVisible();
      await expect(page).toHaveURL(`/sleep-sessions/${sessionId}`);
      
      // Navigation should work from here
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle URL parameters and query strings', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 10);
      
      // Navigate with query parameters
      await page.goto('/dashboard?page=2&sort=date&filter=recent');
      
      // Should respect URL parameters
      await expect(page.locator('[data-testid="pagination-current"]')).toContainText('2');
      await expect(page.locator('[data-testid="sort-selector"]')).toHaveValue('date');
      await expect(page.locator('[data-testid="filter-selector"]')).toHaveValue('recent');
      
      // Changing filters should update URL
      await page.selectOption('[data-testid="sort-selector"]', 'quality');
      await expect(page).toHaveURL(/sort=quality/);
    });

    test('should maintain URL state during page refresh', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 15);
      
      // Navigate to filtered view
      await page.goto('/dashboard?page=2&sort=quality&filter=high-quality');
      
      // Refresh page
      await page.reload();
      
      // Should maintain state after refresh
      await expect(page.locator('[data-testid="pagination-current"]')).toContainText('2');
      await expect(page.locator('[data-testid="sort-selector"]')).toHaveValue('quality');
      await expect(page.locator('[data-testid="filter-selector"]')).toHaveValue('high-quality');
    });
  });

  test.describe('Error Navigation', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 page
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="not-found-title"]')).toContainText('Page Not Found');
      
      // Should provide navigation back to dashboard
      await page.click('[data-testid="back-to-dashboard-button"]');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle invalid session IDs', async ({ page }) => {
      await page.goto('/sleep-sessions/999999');
      
      // Should show session not found page
      await expect(page.locator('[data-testid="session-not-found"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-not-found"]')).toContainText('Session not found');
      
      // Should provide navigation back
      await page.click('[data-testid="back-to-sessions-button"]');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle server errors with fallback navigation', async ({ page }) => {
      // Intercept requests to simulate server error
      await page.route('**/api/v1/sleep_sessions/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      const sessions = await createMultipleSleepSessions(page, authToken, 1);
      await page.goto(`/sleep-sessions/${sessions[0].id}`);
      
      // Should show error page with navigation options
      await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Something went wrong');
      
      // Should provide retry and navigation options
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="go-home-button"]')).toBeVisible();
      
      await page.click('[data-testid="go-home-button"]');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in lists', async ({ page }) => {
      await createMultipleSleepSessions(page, authToken, 5);
      await page.goto('/dashboard');
      
      // Focus on first item
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="sleep-session-item"]:first-child')).toBeFocused();
      
      // Arrow down to next item
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="sleep-session-item"]:nth-child(2)')).toBeFocused();
      
      // Enter should open item
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/sleep-sessions\/\d+/);
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Ctrl+N should open new session form
      await page.keyboard.press('Control+n');
      await expect(page).toHaveURL('/sleep-sessions/new');
      
      // Escape should go back
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL('/dashboard');
      
      // Ctrl+/ should focus search
      await page.keyboard.press('Control+/');
      await expect(page.locator('[data-testid="global-search-input"]')).toBeFocused();
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show loading states during navigation', async ({ page }) => {
      // Slow down network to see loading states
      await page.route('**/api/v1/sleep_sessions', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      await page.goto('/dashboard');
      
      // Should show loading indicator
      await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
      
      // Loading should disappear when data loads
      await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible({ timeout: 2000 });
      await expect(page.locator('[data-testid="sleep-sessions-list"]')).toBeVisible();
    });

    test('should preload critical routes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Hover over navigation should preload route
      await page.hover('[data-testid="nav-profile"]');
      
      // Check that profile route was preloaded (implementation dependent)
      const preloadLinks = await page.locator('link[rel="prefetch"]').count();
      expect(preloadLinks).toBeGreaterThan(0);
    });
  });
}); 