import React, { createContext, useContext, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterCredentials } from '../types';
import { handleApiError } from '../utils';
import { useAuthState } from '../hooks/useAuthState';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    clearError,
    clearAuth,
  } = useAuthState();

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await authService.register(credentials);
      setUser(response.user);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      await authService.logout();
      clearAuth();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      // Even if logout fails, clear local state
      clearAuth();
      authService.clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      clearError();
      
      if (!authService.isAuthenticated()) {
        return;
      }

      const freshProfile = await authService.getProfile();
      setUser(freshProfile);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      // If refresh fails with auth error, logout user
      if (error.response?.status === 401) {
        clearAuth();
        authService.clearAuthData();
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for authentication requirements
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

export default AuthContext; 