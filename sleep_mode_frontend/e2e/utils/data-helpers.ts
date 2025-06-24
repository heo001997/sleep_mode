import { Page, expect } from '@playwright/test';

export interface SleepSession {
  id?: number;
  start_time: string;
  end_time?: string;
  quality_rating?: number;
  notes?: string;
  duration_minutes?: number;
}

/**
 * Create a sleep session via API
 */
export async function createSleepSession(page: Page, token: string, sessionData: Partial<SleepSession>): Promise<SleepSession> {
  const defaultData: SleepSession = {
    start_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    end_time: new Date().toISOString(), // now
    quality_rating: 8,
    notes: 'Test sleep session'
  };

  const data = { ...defaultData, ...sessionData };

  const response = await page.request.post('http://localhost:3000/api/v1/sleep_sessions', {
    data: {
      sleep_session: data
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  const session = responseData.data?.sleep_session;
  
  expect(session).toBeTruthy();
  console.log(`✅ Created sleep session with ID: ${session.id}`);
  
  return session;
}

/**
 * Create multiple sleep sessions for testing
 */
export async function createMultipleSleepSessions(page: Page, token: string, count: number = 5): Promise<SleepSession[]> {
  const sessions: SleepSession[] = [];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = count - i;
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - daysAgo);
    startTime.setHours(22, 0, 0, 0); // 10 PM
    
    const endTime = new Date(startTime);
    endTime.setHours(6, 0, 0, 0); // 6 AM next day
    endTime.setDate(endTime.getDate() + 1);
    
    const session = await createSleepSession(page, token, {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      quality_rating: Math.floor(Math.random() * 5) + 6, // 6-10 rating
      notes: `Test sleep session ${i + 1}`
    });
    
    sessions.push(session);
  }
  
  console.log(`✅ Created ${sessions.length} sleep sessions`);
  return sessions;
}

/**
 * Delete a sleep session via API
 */
export async function deleteSleepSession(page: Page, token: string, sessionId: number): Promise<void> {
  const response = await page.request.delete(`http://localhost:3000/api/v1/sleep_sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  expect(response.ok()).toBeTruthy();
  console.log(`✅ Deleted sleep session with ID: ${sessionId}`);
}

/**
 * Get all sleep sessions for a user
 */
export async function getSleepSessions(page: Page, token: string): Promise<SleepSession[]> {
  const response = await page.request.get('http://localhost:3000/api/v1/sleep_sessions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  const sessions = responseData.data?.sleep_sessions || [];
  
  console.log(`✅ Retrieved ${sessions.length} sleep sessions`);
  return sessions;
}

/**
 * Update a sleep session via API
 */
export async function updateSleepSession(page: Page, token: string, sessionId: number, updateData: Partial<SleepSession>): Promise<SleepSession> {
  const response = await page.request.patch(`http://localhost:3000/api/v1/sleep_sessions/${sessionId}`, {
    data: {
      sleep_session: updateData
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  const session = responseData.data?.sleep_session;
  
  expect(session).toBeTruthy();
  console.log(`✅ Updated sleep session with ID: ${sessionId}`);
  
  return session;
}

/**
 * Cleanup all sleep sessions for a user
 */
export async function cleanupUserSleepSessions(page: Page, token: string): Promise<void> {
  const sessions = await getSleepSessions(page, token);
  
  for (const session of sessions) {
    if (session.id) {
      await deleteSleepSession(page, token, session.id);
    }
  }
  
  console.log(`✅ Cleaned up ${sessions.length} sleep sessions`);
}

/**
 * Generate test sleep session data
 */
export function generateSleepSessionData(overrides: Partial<SleepSession> = {}): SleepSession {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(22, 0, 0, 0); // 10 PM yesterday
  
  const thismorning = new Date(now);
  thismorning.setHours(6, 0, 0, 0); // 6 AM today
  
  return {
    start_time: yesterday.toISOString(),
    end_time: thismorning.toISOString(),
    quality_rating: 8,
    notes: 'Generated test sleep session',
    ...overrides
  };
}

/**
 * Wait for sleep sessions to load in the UI
 */
export async function waitForSleepSessionsToLoad(page: Page, expectedCount?: number): Promise<void> {
  // Wait for sleep sessions list to be visible
  await expect(page.locator('[data-testid="sleep-sessions-list"]')).toBeVisible();
  
  if (expectedCount !== undefined) {
    // Wait for specific number of sessions to be visible
    await expect(page.locator('[data-testid="sleep-session-item"]')).toHaveCount(expectedCount);
  } else {
    // Just wait for at least one session to be visible
    await expect(page.locator('[data-testid="sleep-session-item"]').first()).toBeVisible();
  }
  
  console.log('✅ Sleep sessions loaded in UI');
}

/**
 * Create sleep session via UI form
 */
export async function createSleepSessionViaUI(page: Page, sessionData: Partial<SleepSession>): Promise<void> {
  // Navigate to create sleep session page
  await page.click('[data-testid="create-sleep-session-button"]');
  
  // Wait for form to be visible
  await expect(page.locator('[data-testid="sleep-session-form"]')).toBeVisible();
  
  // Fill in the form
  if (sessionData.start_time) {
    const startDate = new Date(sessionData.start_time);
    await page.fill('[data-testid="start-time-input"]', startDate.toISOString().slice(0, 16));
  }
  
  if (sessionData.end_time) {
    const endDate = new Date(sessionData.end_time);
    await page.fill('[data-testid="end-time-input"]', endDate.toISOString().slice(0, 16));
  }
  
  if (sessionData.quality_rating) {
    await page.selectOption('[data-testid="quality-rating-select"]', sessionData.quality_rating.toString());
  }
  
  if (sessionData.notes) {
    await page.fill('[data-testid="notes-input"]', sessionData.notes);
  }
  
  // Submit the form
  await page.click('[data-testid="submit-sleep-session-button"]');
  
  // Wait for success message or redirect
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  console.log('✅ Created sleep session via UI form');
} 