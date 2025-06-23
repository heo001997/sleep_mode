import { api } from './api';
import type { User, LoginCredentials, RegisterCredentials } from '../types';
import { STORAGE_KEYS } from '../config/constants';
import { storage } from '../utils';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  timezone?: string;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    sleep_goal_hours?: number;
    bedtime_reminder?: boolean;
    wake_up_reminder?: boolean;
  };
}

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store auth data in localStorage
    storage.set(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    storage.set(STORAGE_KEYS.USER_DATA, response.data.user);
    
    return response.data;
  },

  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    
    // Store auth data in localStorage
    storage.set(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    storage.set(STORAGE_KEYS.USER_DATA, response.data.user);
    
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.remove(STORAGE_KEYS.USER_DATA);
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    
    // Update stored user data
    storage.set(STORAGE_KEYS.USER_DATA, response.data);
    
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const response = await api.patch<User>('/auth/profile', data);
    
    // Update stored user data
    storage.set(STORAGE_KEYS.USER_DATA, response.data);
    
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    current_password: string;
    new_password: string;
    password_confirmation: string;
  }): Promise<void> => {
    await api.patch('/auth/password', data);
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password/reset', { email });
  },

  // Reset password with token
  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> => {
    await api.post('/auth/password/reset/confirm', data);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/email/verify', { token });
  },

  // Resend email verification
  resendEmailVerification: async (): Promise<void> => {
    await api.post('/auth/email/resend');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  // Get current user from storage
  getCurrentUser: (): User | null => {
    return storage.get<User>(STORAGE_KEYS.USER_DATA);
  },

  // Get auth token from storage
  getAuthToken: (): string | null => {
    return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Clear auth data (local logout)
  clearAuthData: (): void => {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.USER_DATA);
  },

  // Refresh token (if implemented on backend)
  refreshToken: async (): Promise<string> => {
    const response = await api.post<{ token: string }>('/auth/refresh');
    
    // Store new token
    storage.set(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    
    return response.data.token;
  },
};

export default authService; 