import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  ErrorHandlingService, 
  getErrorHandlingService,
  GlobalErrorData,
  ErrorHandlerConfig 
} from '../services/errorHandlingService';

interface ErrorContextValue {
  // Service instance
  errorService: ErrorHandlingService;
  
  // Error reporting methods
  reportError: (error: Error | string, context?: GlobalErrorData['context']) => void;
  reportNetworkError: (error: Error, url: string, method: string, status?: number, context?: Record<string, any>) => void;
  
  // Error state
  recentErrors: GlobalErrorData[];
  hasUnreadErrors: boolean;
  
  // Error management
  clearErrors: () => void;
  markErrorsAsRead: () => void;
  getErrorStats: () => {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  
  // Configuration
  updateConfig: (config: Partial<ErrorHandlerConfig>) => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  config?: Partial<ErrorHandlerConfig>;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children, config = {} }) => {
  const { user } = useAuth();
  const [errorService] = useState(() => getErrorHandlingService(config));
  const [recentErrors, setRecentErrors] = useState<GlobalErrorData[]>([]);
  const [hasUnreadErrors, setHasUnreadErrors] = useState(false);

  // Initialize error handling when component mounts
  useEffect(() => {
    // Update user ID when user changes
    if (user?.id) {
      errorService.updateConfig({ userId: user.id.toString() });
    }

    // Initialize the service
    errorService.initialize();

    // Subscribe to new errors
    const unsubscribe = errorService.onError((errorData) => {
      setRecentErrors(prev => {
        const newErrors = [...prev, errorData].slice(-10); // Keep last 10 errors
        return newErrors;
      });
      setHasUnreadErrors(true);
    });

    // Load existing errors from storage
    const existingErrors = errorService.getStoredErrors().slice(-10);
    setRecentErrors(existingErrors);

    return () => {
      unsubscribe();
      errorService.destroy();
    };
  }, [errorService, user?.id]);

  // Report error with context
  const reportError = (error: Error | string, context?: GlobalErrorData['context']) => {
    errorService.reportError(error, context);
  };

  // Report network error
  const reportNetworkError = (
    error: Error,
    url: string,
    method: string,
    status?: number,
    context?: Record<string, any>
  ) => {
    errorService.reportNetworkError(error, url, method, status, context);
  };

  // Clear all errors
  const clearErrors = () => {
    errorService.clearStoredErrors();
    setRecentErrors([]);
    setHasUnreadErrors(false);
  };

  // Mark errors as read
  const markErrorsAsRead = () => {
    setHasUnreadErrors(false);
  };

  // Get error statistics
  const getErrorStats = () => {
    const errors = errorService.getStoredErrors();
    
    const total = errors.length;
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return { total, byType, bySeverity };
  };

  // Update service configuration
  const updateConfig = (newConfig: Partial<ErrorHandlerConfig>) => {
    errorService.updateConfig(newConfig);
  };

  const value: ErrorContextValue = {
    errorService,
    reportError,
    reportNetworkError,
    recentErrors,
    hasUnreadErrors,
    clearErrors,
    markErrorsAsRead,
    getErrorStats,
    updateConfig,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useError = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// HOC to wrap components with error reporting
export const withErrorReporting = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const { reportError } = useError();

    // Add error reporting to component props
    const enhancedProps = {
      ...props,
      reportError,
    } as P & { reportError: typeof reportError };

    return <Component {...enhancedProps} />;
  };

  WrappedComponent.displayName = `withErrorReporting(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorContext; 