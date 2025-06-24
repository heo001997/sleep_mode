import { api } from './api';
import type { User } from '../types';

// Profile-related request/response types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdateEmailRequest {
  email: string;
  password: string;
}

export interface ProfileActivityItem {
  id: string;
  type: 'login' | 'password_change' | 'email_change' | 'profile_update' | 'account_deletion';
  description: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
}

export interface PrivacySettings {
  data_sharing: boolean;
  analytics_tracking: boolean;
  marketing_emails: boolean;
  account_notifications: boolean;
  export_data_consent: boolean;
}

// Profile service class
class ProfileService {
  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await api.put('/auth/profile', { user: data });
      return response.data.user;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await api.put('/auth/password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  // Update email address
  async updateEmail(data: UpdateEmailRequest): Promise<{ message: string; requires_verification: boolean }> {
    try {
      const response = await api.put('/auth/email', {
        email: data.email,
        password: data.password,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update email:', error);
      throw error;
    }
  }

  // Verify email change
  async verifyEmailChange(token: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/email/verify', { token });
      return response.data;
    } catch (error) {
      console.error('Failed to verify email change:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ avatar_url: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      throw error;
    }
  }

  // Delete profile picture
  async deleteProfilePicture(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/auth/avatar');
      return response.data;
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      throw error;
    }
  }

  // Get account activity log
  async getActivityLog(page = 1, limit = 20): Promise<{
    activities: ProfileActivityItem[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      per_page: number;
    };
  }> {
    try {
      const response = await api.get('/auth/activity', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      throw error;
    }
  }

  // Get privacy settings
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const response = await api.get('/auth/privacy');
      return response.data.privacy_settings;
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const response = await api.put('/auth/privacy', { privacy_settings: settings });
      return response.data.privacy_settings;
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }

  // Request data export
  async requestDataExport(): Promise<{ message: string; export_id: string }> {
    try {
      const response = await api.post('/auth/export');
      return response.data;
    } catch (error) {
      console.error('Failed to request data export:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(password: string, reason?: string): Promise<{ message: string }> {
    try {
      const response = await api.delete('/auth/account', {
        data: {
          password,
          deletion_reason: reason,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  // Enable two-factor authentication
  async enableTwoFactor(): Promise<{ qr_code: string; backup_codes: string[] }> {
    try {
      const response = await api.post('/auth/2fa/enable');
      return response.data;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  // Disable two-factor authentication
  async disableTwoFactor(password: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/2fa/disable', { password });
      return response.data;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }

  // Verify two-factor setup
  async verifyTwoFactor(code: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/2fa/verify', { code });
      return response.data;
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService; 