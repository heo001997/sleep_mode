import { api } from './api';
import { TimeValue } from '../components/common';

// Settings interfaces
export interface SleepScheduleSettings {
  enabled: boolean;
  bedtime: TimeValue;
  wakeTime: TimeValue;
  timeFormat: '12' | '24';
}

export interface NotificationSettings {
  bedtimeReminders: boolean;
  wakeUpAlarms: boolean;
  sleepGoalAlerts: boolean;
  weeklyReports: boolean;
  appUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  doNotDisturb: boolean;
  reminderTime: number; // minutes before bedtime
}

export interface UserSettings {
  sleepSchedule: SleepScheduleSettings;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface SettingsUpdateRequest {
  sleepSchedule?: Partial<SleepScheduleSettings>;
  notifications?: Partial<NotificationSettings>;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
}

// API service class
class SettingsService {
  private readonly basePath = '/api/v1/settings';

  // Get user settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<UserSettings>(this.basePath);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      throw error;
    }
  }

  // Update user settings (partial update)
  async updateUserSettings(settings: SettingsUpdateRequest): Promise<UserSettings> {
    try {
      const response = await api.patch<UserSettings>(this.basePath, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  }

  // Update sleep schedule settings
  async updateSleepSchedule(sleepSchedule: Partial<SleepScheduleSettings>): Promise<SleepScheduleSettings> {
    try {
      const response = await api.patch<SleepScheduleSettings>(
        `${this.basePath}/sleep-schedule`, 
        sleepSchedule
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update sleep schedule:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await api.patch<NotificationSettings>(
        `${this.basePath}/notifications`, 
        notifications
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  // Reset settings to defaults
  async resetSettings(): Promise<UserSettings> {
    try {
      const response = await api.post<UserSettings>(`${this.basePath}/reset`);
      return response.data;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  // Test settings connectivity
  async testSettingsSync(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await api.get<{ status: string; timestamp: string }>(`${this.basePath}/sync/test`);
      return response.data;
    } catch (error) {
      console.error('Failed to test settings sync:', error);
      throw error;
    }
  }

  // Export settings data
  async exportSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<UserSettings>(`${this.basePath}/export`);
      return response.data;
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  // Import settings data
  async importSettings(settings: UserSettings): Promise<UserSettings> {
    try {
      const response = await api.post<UserSettings>(`${this.basePath}/import`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const settingsService = new SettingsService();
export default settingsService; 