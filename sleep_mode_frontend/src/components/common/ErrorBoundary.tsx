import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BugAntIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { logErrorBoundaryError } from '../../services/errorLoggingService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  level?: 'app' | 'page' | 'component';
  name?: string;
  showDetails?: boolean;
  maxRetries?: number;
}

interface ErrorDetailsProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onCopy: () => void;
}

// Error details component for development/debugging
const ErrorDetails: React.FC<ErrorDetailsProps> = ({ 
  error, 
  errorInfo, 
  errorId, 
  onCopy 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const errorData = {
    errorId,
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  return (
    <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center">
          <BugAntIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Error Details
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? 'Hide' : 'Show'} Details
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Error ID
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                {errorId}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Message
              </label>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error.message}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Stack Trace
              </label>
              <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">
                  {error.stack}
                </code>
              </pre>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Component Stack
              </label>
              <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">
                  {errorInfo.componentStack}
                </code>
              </pre>
            </div>
          </div>
          
          <button
            onClick={onCopy}
            className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
            Copy Error Data
          </button>
        </div>
      )}
    </div>
  );
};

// Main Error Boundary component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    }
    
    // Send error to logging service
    this.logErrorToService(error, errorInfo, this.state.errorId);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // Use the new error logging service
    logErrorBoundaryError(error, errorInfo);
    
    // Add additional context for this error boundary
    const boundaryName = this.props.name || 'ErrorBoundary';
    const level = this.props.level || 'component';
    
    // Log additional boundary-specific information
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      const errorData = {
        errorId,
        timestamp: new Date().toISOString(),
        message: error.message,
        boundaryName,
        level,
        retryCount: this.state.retryCount,
      };
      
      existingErrors.push(errorData);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Failed to store error boundary log:', e);
    }
  };

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorToClipboard = () => {
    if (!this.state.error || !this.state.errorInfo) return;
    
    const errorData = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
  };

  private renderFallbackUI() {
    const { level = 'component', name, showDetails = process.env.NODE_ENV === 'development' } = this.props;
    const { error, errorInfo, errorId, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;
    
    // App-level error (full screen)
    if (level === 'app') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500 dark:text-red-400" />
              <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Application Error
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Something went wrong and the application encountered an unexpected error.
              </p>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reload Application
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Go to Homepage
              </button>
            </div>
            
            {showDetails && error && errorInfo && (
              <ErrorDetails
                error={error}
                errorInfo={errorInfo}
                errorId={errorId}
                onCopy={this.copyErrorToClipboard}
              />
            )}
          </div>
        </div>
      );
    }
    
    // Page-level error (contained within layout)
    if (level === 'page') {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Page Error
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This page encountered an error and couldn't be displayed properly.
          </p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again ({maxRetries - retryCount} left)
              </button>
            )}
            
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </button>
          </div>
          
          {showDetails && error && errorInfo && (
            <ErrorDetails
              error={error}
              errorInfo={errorInfo}
              errorId={errorId}
              onCopy={this.copyErrorToClipboard}
            />
          )}
        </div>
      );
    }
    
    // Component-level error (inline)
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {name ? `${name} Error` : 'Component Error'}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              This component encountered an error and couldn't be displayed.
            </p>
            
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="mt-3 inline-flex items-center text-sm text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Try Again ({maxRetries - retryCount} left)
              </button>
            )}
          </div>
        </div>
        
        {showDetails && error && errorInfo && (
          <ErrorDetails
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            onCopy={this.copyErrorToClipboard}
          />
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Use default fallback UI
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component wrapper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}; 