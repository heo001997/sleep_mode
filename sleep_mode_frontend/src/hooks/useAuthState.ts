import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';
import { handleApiError, STORAGE_KEYS } from '../utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthState = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Check for existing authentication
        if (authService.isAuthenticated()) {
          const storedUser = authService.getCurrentUser();
          
          if (storedUser) {
            setState(prev => ({
              ...prev,
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
            }));

            // Attempt to refresh user profile in background
            try {
              const freshProfile = await authService.getProfile();
              setState(prev => ({
                ...prev,
                user: freshProfile,
              }));
            } catch (refreshError) {
              // If refresh fails, continue with stored user data
              console.warn('Profile refresh failed:', refreshError);
            }
          } else {
            // Clear invalid auth state
            authService.clearAuthData();
            setState(prev => ({
              ...prev,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        authService.clearAuthData();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: handleApiError(error),
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.AUTH_TOKEN || e.key === STORAGE_KEYS.USER_DATA) {
        // Auth data changed in another tab
        if (!e.newValue) {
          // Token was removed - logout
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } else if (e.key === STORAGE_KEYS.USER_DATA && e.newValue) {
          // User data was updated
          try {
            const newUser = JSON.parse(e.newValue);
            setState(prev => ({
              ...prev,
              user: newUser,
              isAuthenticated: true,
            }));
          } catch (parseError) {
            console.error('Failed to parse user data from storage:', parseError);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearAuth = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    setUser,
    setLoading,
    setError,
    clearError,
    clearAuth,
  };
}; 