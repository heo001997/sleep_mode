import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GenericErrorFallback, ErrorFallbackProps } from './ErrorFallbacks';
import { errorLoggingService } from '../../services';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableGracefulDegradation?: boolean;
  criticalFeatures?: string[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  gracefulMode: boolean;
}

class AppErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      gracefulMode: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our error logging service
    const errorId = errorLoggingService.logError(error, {
      context: 'App Error Boundary',
      componentStack: errorInfo.componentStack,
      severity: 'high',
      tags: ['error-boundary', 'app-level'],
      additionalData: {
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
      }
    });

    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enable graceful degradation mode if configured
    if (this.props.enableGracefulDegradation) {
      this.enableGracefulMode();
    }

    console.error('App Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
  }

  private enableGracefulMode = () => {
    this.setState({ gracefulMode: true });
    
    // Notify user about graceful mode
    this.showGracefulModeNotification();
  };

  private showGracefulModeNotification = () => {
    // This would integrate with your toast system
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'warning',
        title: 'Limited Mode Active',
        message: 'Some features may be limited while we resolve technical issues. Basic functionality remains available.',
        persistent: true,
        action: {
          label: 'Learn More',
          onClick: () => this.showGracefulModeDetails()
        }
      });
    }
  };

  private showGracefulModeDetails = () => {
    const criticalFeatures = this.props.criticalFeatures || [
      'Sleep session tracking',
      'Data synchronization',
      'Basic navigation'
    ];

    alert(`Sleep Mode is running in limited mode to ensure stability.

Available features:
${criticalFeatures.map(feature => `• ${feature}`).join('\n')}

We're working to restore full functionality. Your data is safe and will sync when the issue is resolved.`);
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      this.handleReset();
      return;
    }

    // Log retry attempt
    if (this.state.errorId) {
      errorLoggingService.addBreadcrumb({
        message: 'User initiated retry',
        data: { retryCount: this.state.retryCount + 1 },
        timestamp: Date.now()
      });
    }

    // Delay retry to prevent rapid failures
    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        gracefulMode: false,
      }));
    }, this.retryDelay * (this.state.retryCount + 1));
  };

  private handleReset = () => {
    // Clear error state and local storage if needed
    localStorage.removeItem('app-error-recovery');
    
    // Log reset action
    if (this.state.errorId) {
      errorLoggingService.addBreadcrumb({
        message: 'User initiated app reset',
        data: { 
          previousRetryCount: this.state.retryCount,
          errorId: this.state.errorId
        },
        timestamp: Date.now()
      });
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      gracefulMode: false,
    });

    // Force reload if necessary
    if (this.state.retryCount >= this.maxRetries) {
      window.location.reload();
    }
  };

  private handleContactSupport = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Open support contact with error details
    const supportUrl = `mailto:support@sleepmode.app?subject=Application Error Report&body=${encodeURIComponent(
      `I encountered an error in the Sleep Mode app:

Error ID: ${errorDetails.errorId || 'N/A'}
Message: ${errorDetails.message || 'Unknown error'}
Time: ${errorDetails.timestamp}
Page: ${errorDetails.url}

Please help me resolve this issue.`
    )}`;

    window.open(supportUrl);
  };

  private handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || GenericErrorFallback;
      
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            {this.state.gracefulMode && (
              <div className="mb-6 p-4 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Limited Mode Active</span>
                </div>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  Basic features are available while we resolve the technical issue.
                </p>
              </div>
            )}
            
            <FallbackComponent
              error={this.state.error || undefined}
              errorInfo={this.state.errorInfo || undefined}
              onRetry={this.state.retryCount < this.maxRetries ? this.handleRetry : undefined}
              onReset={this.handleReset}
              onContactSupport={this.handleContactSupport}
              onGoHome={this.handleGoHome}
            />
            
            {this.state.retryCount > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Retry attempt: {this.state.retryCount} of {this.maxRetries}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary; 