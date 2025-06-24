// Toast Notification System for user feedback
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
  WifiIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'network';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  showSuccess: (title: string, message?: string, options?: Partial<Toast>) => string;
  showError: (title: string, message?: string, options?: Partial<Toast>) => string;
  showWarning: (title: string, message?: string, options?: Partial<Toast>) => string;
  showInfo: (title: string, message?: string, options?: Partial<Toast>) => string;
  showLoading: (title: string, message?: string, options?: Partial<Toast>) => string;
  showNetworkStatus: (isOnline: boolean, queueCount?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000,
      dismissible: true,
      persistent: false,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ type: 'success', title, message, ...options });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ type: 'error', title, message, duration: 7000, ...options });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ type: 'warning', title, message, duration: 6000, ...options });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ type: 'info', title, message, ...options });
  }, [showToast]);

  const showLoading = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ 
      type: 'loading', 
      title, 
      message, 
      persistent: true, 
      dismissible: false,
      ...options 
    });
  }, [showToast]);

  const showNetworkStatus = useCallback((isOnline: boolean, queueCount?: number) => {
    const title = isOnline ? 'Back Online' : 'Connection Lost';
    const message = isOnline 
      ? queueCount && queueCount > 0 
        ? `Processing ${queueCount} queued request${queueCount > 1 ? 's' : ''}`
        : 'All systems operational'
      : 'Some features may be limited';

    return showToast({
      type: 'network',
      title,
      message,
      duration: isOnline ? 4000 : 0, // Don't auto-dismiss offline notifications
      persistent: !isOnline,
    });
  }, [showToast]);

  const value: ToastContextType = {
    toasts,
    showToast,
    dismissToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showNetworkStatus,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

const ToastComponent: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { dismissToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    if (!toast.dismissible) return;
    
    setIsExiting(true);
    setTimeout(() => {
      dismissToast(toast.id);
    }, 300); // Animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'loading':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'network':
        return <WifiIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'network':
        return 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div
      className={`
        ${getColorClasses()}
        border rounded-lg shadow-lg p-4 transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        transform
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {toast.title}
          </h3>
          
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {toast.message}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        {toast.dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Hook for network status notifications
export const useNetworkToast = () => {
  const { showNetworkStatus, dismissToast } = useToast();
  const [networkToastId, setNetworkToastId] = useState<string | null>(null);

  const updateNetworkStatus = useCallback((isOnline: boolean, queueCount?: number) => {
    // Dismiss previous network toast
    if (networkToastId) {
      dismissToast(networkToastId);
    }

    // Show new network status
    const id = showNetworkStatus(isOnline, queueCount);
    setNetworkToastId(id);

    // Clear reference after auto-dismiss
    if (isOnline) {
      setTimeout(() => {
        setNetworkToastId(null);
      }, 4000);
    }
  }, [showNetworkStatus, dismissToast, networkToastId]);

  return { updateNetworkStatus };
};

// Hook for API error handling with toasts
export const useApiErrorToast = () => {
  const { showError, showWarning } = useToast();

  const handleApiError = useCallback((error: any, customMessage?: string) => {
    let title = 'Request Failed';
    let message = customMessage;

    // Check if this is an offline error
    if (error.message?.includes('queued for when connection is restored')) {
      return showWarning(
        'Request Queued',
        'You are offline. Your request will be processed when connection is restored.',
        { duration: 6000 }
      );
    }

    // Handle specific error types
    if (error.response?.status) {
      const status = error.response.status;
      switch (status) {
        case 400:
          title = 'Invalid Request';
          break;
        case 401:
          title = 'Authentication Required';
          message = 'Please log in to continue.';
          break;
        case 403:
          title = 'Access Denied';
          break;
        case 404:
          title = 'Not Found';
          break;
        case 429:
          title = 'Too Many Requests';
          message = 'Please wait a moment and try again.';
          break;
        case 500:
          title = 'Server Error';
          message = 'Our servers are experiencing issues. Please try again later.';
          break;
        case 502:
        case 503:
          title = 'Service Unavailable';
          message = 'Our service is temporarily unavailable. Please try again in a few minutes.';
          break;
      }
    }

    // Use error message if no custom message provided
    if (!message) {
      message = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    }

    return showError(title, message, { duration: 7000 });
  }, [showError, showWarning]);

  return { handleApiError };
};

// Export everything
export { ToastProvider, ToastContainer, ToastComponent }; 