// Error Fallback UI Components for different error scenarios
import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  WifiIcon, 
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  HomeIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { isOffline, processOfflineQueue, getQueueStatus } from '../../services';

// Base Error Fallback Interface
export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: any;
  onRetry?: () => void;
  onReset?: () => void;
  onContactSupport?: () => void;
  onGoHome?: () => void;
  className?: string;
}

// Generic Error Fallback - Used by ErrorBoundary
export const GenericErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  onContactSupport,
  onGoHome,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`min-h-[400px] flex items-center justify-center p-6 ${className}`}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Try Again
            </button>
          )}
          
          {onReset && (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset Application
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-wellness-600 text-white rounded-lg hover:bg-wellness-700 transition-colors"
            >
              <HomeIcon className="h-4 w-4" />
              Go to Home
            </button>
          )}

          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
              Contact Support
            </button>
          )}
        </div>

        {/* Error Details (for development) */}
        {(error || errorInfo) && (
          <div className="text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
            
            {showDetails && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs text-left">
                {error && (
                  <div className="mb-2">
                    <strong>Error:</strong>
                    <pre className="mt-1 text-red-600 dark:text-red-400">{error.message}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-gray-600 dark:text-gray-400 overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Network Error Fallback
export const NetworkErrorFallback: React.FC<{
  onRetry?: () => void;
  onViewQueue?: () => void;
  className?: string;
}> = ({ onRetry, onViewQueue, className = '' }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [queueStatus] = useState(() => getQueueStatus());

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleProcessQueue = async () => {
    setIsRetrying(true);
    try {
      await processOfflineQueue();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={`min-h-[300px] flex items-center justify-center p-6 ${className}`}>
      <div className="max-w-sm w-full text-center">
        <div className="mb-6">
          <WifiIcon className="h-12 w-12 text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connection Issue
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isOffline() 
              ? "You're currently offline. Check your internet connection."
              : "Having trouble reaching our servers. Please try again."
            }
          </p>
        </div>

        {queueStatus.total > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {queueStatus.total} request{queueStatus.total > 1 ? 's' : ''} queued for when connection is restored
            </p>
            {onViewQueue && (
              <button
                onClick={onViewQueue}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                View queued requests
              </button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>

          {queueStatus.total > 0 && (
            <button
              onClick={handleProcessQueue}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              Process Queued Requests
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// API Error Fallback
export const ApiErrorFallback: React.FC<{
  statusCode?: number;
  message?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  className?: string;
}> = ({ statusCode, message, onRetry, onContactSupport, className = '' }) => {
  const getErrorTitle = () => {
    switch (statusCode) {
      case 400:
        return 'Invalid Request';
      case 401:
        return 'Authentication Required';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      case 502:
      case 503:
        return 'Service Unavailable';
      default:
        return 'Request Failed';
    }
  };

  const getErrorMessage = () => {
    if (message) return message;
    
    switch (statusCode) {
      case 400:
        return 'The request was invalid. Please check your input and try again.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource could not be found.';
      case 429:
        return 'You\'ve made too many requests. Please wait a moment and try again.';
      case 500:
        return 'Our servers are experiencing issues. Please try again later.';
      case 502:
      case 503:
        return 'Our service is temporarily unavailable. Please try again in a few minutes.';
      default:
        return 'Something went wrong with your request. Please try again.';
    }
  };

  const canRetry = statusCode ? [408, 429, 500, 502, 503, 504].includes(statusCode) : true;

  return (
    <div className={`min-h-[250px] flex items-center justify-center p-6 ${className}`}>
      <div className="max-w-sm w-full text-center">
        <div className="mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {getErrorTitle()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-2">
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Try Again
            </button>
          )}

          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
              Contact Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Error Fallback (for failed data fetching)
export const LoadingErrorFallback: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  showEmpty?: boolean;
  className?: string;
}> = ({ 
  title = 'Failed to Load Data',
  message = 'We couldn\'t load the requested information. Please try again.',
  onRetry,
  showEmpty = false,
  className = ''
}) => {
  return (
    <div className={`min-h-[200px] flex items-center justify-center p-6 ${className}`}>
      <div className="max-w-sm w-full text-center">
        {!showEmpty ? (
          <>
            <div className="mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {message}
              </p>
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Try Again
              </button>
            )}
          </>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline Error Message (for form errors, small errors)
export const InlineErrorMessage: React.FC<{
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}> = ({ message, onDismiss, onRetry, type = 'error', className = '' }) => {
  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
      default:
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${getColorClasses()} ${className}`}>
      <p className="text-sm flex-1">{message}</p>
      <div className="flex items-center gap-2 ml-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            title="Retry"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            title="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Error State Wrapper (wraps content with error state)
export const ErrorStateWrapper: React.FC<{
  hasError: boolean;
  error?: Error;
  onRetry?: () => void;
  onReset?: () => void;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  children: React.ReactNode;
  className?: string;
}> = ({ 
  hasError, 
  error, 
  onRetry, 
  onReset, 
  fallbackComponent: FallbackComponent = GenericErrorFallback,
  children,
  className = ''
}) => {
  if (hasError) {
    return (
      <div className={className}>
        <FallbackComponent 
          error={error}
          onRetry={onRetry}
          onReset={onReset}
        />
      </div>
    );
  }

  return <>{children}</>;
}; 