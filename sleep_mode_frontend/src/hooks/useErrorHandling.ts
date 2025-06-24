// Comprehensive Error Handling Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  networkService,
  retryService,
  getQueueStatus,
  processOfflineQueue,
  clearOfflineQueue,
  type NetworkStatus,
  type RetryOperation
} from '../services';
import { 
  useToast,
  useNetworkToast,
  useApiErrorToast,
  type Toast
} from '../components/common/ToastNotifications';

export interface ErrorHandlingState {
  // Network status
  isOnline: boolean;
  networkStatus: NetworkStatus;
  
  // Queue status
  queuedRequests: number;
  queueByPriority: Record<string, number>;
  
  // Retry operations
  activeRetries: number;
  retryOperations: RetryOperation<any>[];
  
  // Error states
  hasNetworkError: boolean;
  lastError: Error | null;
}

export interface ErrorHandlingActions {
  // Network actions
  checkConnection: () => Promise<boolean>;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  
  // Error handling
  handleError: (error: any, context?: string) => void;
  handleApiError: (error: any, customMessage?: string) => string;
  clearLastError: () => void;
  
  // Retry actions
  retryOperation: <T>(operation: () => Promise<T>, scenario?: 'QUICK' | 'STANDARD' | 'AGGRESSIVE' | 'CONSERVATIVE') => Promise<T>;
  cancelRetryOperation: (operationId: string) => boolean;
  
  // User feedback
  showSuccessMessage: (message: string, details?: string) => string;
  showErrorMessage: (message: string, details?: string) => string;
  showWarningMessage: (message: string, details?: string) => string;
  showInfoMessage: (message: string, details?: string) => string;
  showLoadingMessage: (message: string, details?: string) => string;
}

export const useErrorHandling = (): ErrorHandlingState & ErrorHandlingActions => {
  // State
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );
  const [queueStatus, setQueueStatus] = useState(() => getQueueStatus());
  const [retryOperations, setRetryOperations] = useState<RetryOperation<any>[]>([]);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Refs for cleanup
  const networkUnsubscribe = useRef<(() => void) | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Toast hooks
  const toast = useToast();
  const { updateNetworkStatus } = useNetworkToast();
  const { handleApiError: handleApiErrorToast } = useApiErrorToast();

  // Initialize network monitoring
  useEffect(() => {
    // Subscribe to network status changes
    networkUnsubscribe.current = networkService.onStatusChange((status) => {
      const wasOnline = networkStatus.isOnline;
      setNetworkStatus(status);
      
      // Show network status change notification
      if (wasOnline !== status.isOnline) {
        updateNetworkStatus(status.isOnline, queueStatus.total);
      }
      
      // Update queue status when back online
      if (status.isOnline && !wasOnline) {
        setTimeout(() => {
          setQueueStatus(getQueueStatus());
        }, 1000);
      }
    });

    // Periodic status updates
    statusCheckInterval.current = setInterval(() => {
      setQueueStatus(getQueueStatus());
      setRetryOperations(retryService.getAllOperations());
    }, 5000);

    return () => {
      if (networkUnsubscribe.current) {
        networkUnsubscribe.current();
      }
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Derived state
  const errorHandlingState: ErrorHandlingState = {
    isOnline: networkStatus.isOnline,
    networkStatus,
    queuedRequests: queueStatus.total,
    queueByPriority: queueStatus.byPriority,
    activeRetries: retryService.getActiveOperationsCount(),
    retryOperations,
    hasNetworkError: !networkStatus.isOnline || lastError?.name === 'NetworkError',
    lastError,
  };

  // Actions
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/health', { method: 'HEAD' });
      const isOnline = response.ok;
      
      if (isOnline !== networkStatus.isOnline) {
        setNetworkStatus(prev => ({ ...prev, isOnline }));
        updateNetworkStatus(isOnline, queueStatus.total);
      }
      
      return isOnline;
    } catch (error) {
      console.error('Connection check failed:', error);
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
      updateNetworkStatus(false, queueStatus.total);
      return false;
    }
  }, [networkStatus.isOnline, queueStatus.total, updateNetworkStatus]);

  const processQueue = useCallback(async (): Promise<void> => {
    try {
      await processOfflineQueue();
      setQueueStatus(getQueueStatus());
      
      toast.showSuccess(
        'Queue Processed',
        'All queued requests have been processed successfully.'
      );
    } catch (error) {
      console.error('Failed to process queue:', error);
      toast.showError(
        'Queue Processing Failed',
        'Some queued requests could not be processed. They will be retried later.'
      );
    }
  }, [toast]);

  const clearQueue = useCallback((): void => {
    clearOfflineQueue();
    setQueueStatus(getQueueStatus());
    
    toast.showInfo(
      'Queue Cleared',
      'All queued requests have been cleared.'
    );
  }, [toast]);

  const handleError = useCallback((error: any, context?: string): void => {
    console.error(`Error in ${context || 'application'}:`, error);
    setLastError(error instanceof Error ? error : new Error(String(error)));
    
    // Show appropriate error notification
    if (error.name === 'NetworkError' || !error.response) {
      if (!networkStatus.isOnline) {
        toast.showWarning(
          'Connection Issue',
          'You are currently offline. Your actions will be saved and processed when connection is restored.'
        );
      } else {
        toast.showError(
          'Network Error',
          'Unable to connect to our servers. Please check your internet connection.'
        );
      }
    } else {
      // Use API error handler for HTTP errors
      handleApiErrorToast(error, context ? `Error in ${context}` : undefined);
    }
  }, [networkStatus.isOnline, toast, handleApiErrorToast]);

  const handleApiError = useCallback((error: any, customMessage?: string): string => {
    setLastError(error instanceof Error ? error : new Error(String(error)));
    return handleApiErrorToast(error, customMessage);
  }, [handleApiErrorToast]);

  const clearLastError = useCallback((): void => {
    setLastError(null);
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    scenario: 'QUICK' | 'STANDARD' | 'AGGRESSIVE' | 'CONSERVATIVE' = 'STANDARD'
  ): Promise<T> => {
    try {
      const result = await retryService.retryApiCall(operation, scenario);
      setRetryOperations(retryService.getAllOperations());
      return result;
    } catch (error) {
      setRetryOperations(retryService.getAllOperations());
      setLastError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, []);

  const cancelRetryOperation = useCallback((operationId: string): boolean => {
    const result = retryService.cancelOperation(operationId);
    setRetryOperations(retryService.getAllOperations());
    return result;
  }, []);

  // Toast convenience methods
  const showSuccessMessage = useCallback((message: string, details?: string): string => {
    return toast.showSuccess(message, details);
  }, [toast]);

  const showErrorMessage = useCallback((message: string, details?: string): string => {
    return toast.showError(message, details);
  }, [toast]);

  const showWarningMessage = useCallback((message: string, details?: string): string => {
    return toast.showWarning(message, details);
  }, [toast]);

  const showInfoMessage = useCallback((message: string, details?: string): string => {
    return toast.showInfo(message, details);
  }, [toast]);

  const showLoadingMessage = useCallback((message: string, details?: string): string => {
    return toast.showLoading(message, details);
  }, [toast]);

  const errorHandlingActions: ErrorHandlingActions = {
    checkConnection,
    processQueue,
    clearQueue,
    handleError,
    handleApiError,
    clearLastError,
    retryOperation,
    cancelRetryOperation,
    showSuccessMessage,
    showErrorMessage,
    showWarningMessage,
    showInfoMessage,
    showLoadingMessage,
  };

  return {
    ...errorHandlingState,
    ...errorHandlingActions,
  };
};

// Specialized hooks for specific use cases

// Hook for API operations with automatic error handling
export const useApiOperation = <T>() => {
  const { handleApiError, retryOperation, showLoadingMessage, showSuccessMessage } = useErrorHandling();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      loadingMessage?: string;
      useRetry?: boolean;
      retryScenario?: 'QUICK' | 'STANDARD' | 'AGGRESSIVE' | 'CONSERVATIVE';
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    let loadingToastId: string | undefined;
    
    try {
      if (options?.loadingMessage) {
        loadingToastId = showLoadingMessage(options.loadingMessage);
      }

      const result = options?.useRetry !== false
        ? await retryOperation(operation, options?.retryScenario)
        : await operation();

      if (options?.successMessage) {
        showSuccessMessage(options.successMessage);
      }

      return result;
    } catch (err) {
      setError(err);
      handleApiError(err);
      return null;
    } finally {
      setIsLoading(false);
      // Note: Loading toast is dismissed automatically by the toast system
    }
  }, [handleApiError, retryOperation, showLoadingMessage, showSuccessMessage]);

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Hook for form submissions with error handling
export const useFormSubmission = <T>() => {
  const { handleApiError, showSuccessMessage } = useErrorHandling();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await operation();
      
      if (successMessage) {
        showSuccessMessage(successMessage);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [handleApiError, showSuccessMessage]);

  return {
    submit,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
};

export default useErrorHandling; 