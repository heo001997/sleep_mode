import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GenericErrorFallback, LoadingErrorFallback, ErrorFallbackProps } from './ErrorFallbacks';
import { errorLoggingService, isOffline, getQueueStatus } from '../../services';

interface Props {
  children: ReactNode;
  pageName: string;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  enableOfflineMode?: boolean;
  offlineContent?: ReactNode;
  essentialFeatures?: string[];
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isOffline: boolean;
  retryCount: number;
  lastErrorTime: number;
  recoveryMode: 'normal' | 'offline' | 'degraded';
}

class PageErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;
  private errorCooldown = 5000; // 5 seconds
  private networkCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isOffline: isOffline(),
      retryCount: 0,
      lastErrorTime: 0,
      recoveryMode: 'normal',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with page context
    const errorId = errorLoggingService.logError(error, {
      context: `Page: ${this.props.pageName}`,
      componentStack: errorInfo.componentStack,
      severity: 'medium',
      tags: ['error-boundary', 'page-level', this.props.pageName],
      additionalData: {
        pageName: this.props.pageName,
        retryCount: this.state.retryCount,
        isOffline: this.state.isOffline,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }
    });

    this.setState({
      errorInfo,
      errorId,
    });

    // Determine recovery mode
    this.determineRecoveryMode();

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    console.error(`Page Error (${this.props.pageName}):`, error);
  }

  componentDidMount() {
    // Monitor network status for recovery
    this.startNetworkMonitoring();
  }

  componentWillUnmount() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
    }
  }

  private startNetworkMonitoring = () => {
    this.networkCheckInterval = setInterval(() => {
      const currentOfflineStatus = isOffline();
      if (currentOfflineStatus !== this.state.isOffline) {
        this.setState({ isOffline: currentOfflineStatus });
        
        // If back online and in error state, suggest retry
        if (!currentOfflineStatus && this.state.hasError && this.state.recoveryMode === 'offline') {
          this.suggestRetryAfterRecovery();
        }
      }
    }, 3000);
  };

  private determineRecoveryMode = () => {
    const isNetworkError = this.state.error?.name === 'NetworkError' || 
                          this.state.error?.message?.includes('fetch');
    
    if (this.state.isOffline || isNetworkError) {
      this.setState({ recoveryMode: 'offline' });
    } else if (this.state.retryCount >= this.maxRetries) {
      this.setState({ recoveryMode: 'degraded' });
    } else {
      this.setState({ recoveryMode: 'normal' });
    }
  };

  private suggestRetryAfterRecovery = () => {
    // Show notification about recovery opportunity
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'info',
        title: 'Connection Restored',
        message: `The ${this.props.pageName} page is ready to retry loading.`,
        action: {
          label: 'Retry Now',
          onClick: this.handleRetry
        },
        duration: 8000
      });
    }
  };

  private handleRetry = () => {
    // Check if we're in cooldown period
    const timeSinceLastError = Date.now() - this.state.lastErrorTime;
    if (timeSinceLastError < this.errorCooldown && this.state.retryCount > 0) {
      this.showCooldownMessage();
      return;
    }

    // Log retry attempt
    if (this.state.errorId) {
      errorLoggingService.addBreadcrumb({
        message: `Page retry attempted: ${this.props.pageName}`,
        data: { 
          retryCount: this.state.retryCount + 1,
          recoveryMode: this.state.recoveryMode,
          timeSinceError: timeSinceLastError
        },
        timestamp: Date.now()
      });
    }

    // Clear error state
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      recoveryMode: 'normal',
    }));

    // Call recovery callback
    this.props.onRecovery?.();
  };

  private showCooldownMessage = () => {
    const remainingTime = Math.ceil((this.errorCooldown - (Date.now() - this.state.lastErrorTime)) / 1000);
    
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'warning',
        title: 'Please Wait',
        message: `Please wait ${remainingTime} more seconds before retrying.`,
        duration: 3000
      });
    }
  };

  private handleOfflineMode = () => {
    this.setState({ recoveryMode: 'offline' });
    
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'info',
        title: 'Offline Mode',
        message: `${this.props.pageName} is now running in offline mode with limited features.`,
        persistent: true
      });
    }
  };

  private handleRefresh = () => {
    // Clear any cached data for this page
    if ('caches' in window) {
      caches.delete(`page-cache-${this.props.pageName.toLowerCase()}`);
    }
    
    // Force page refresh
    window.location.reload();
  };

  private renderOfflineMode = () => {
    if (!this.props.enableOfflineMode) {
      return null;
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="h-16 w-16 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Offline Mode
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {this.props.pageName} is running with limited functionality
            </p>
          </div>

          {this.props.essentialFeatures && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Available Features:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {this.props.essentialFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Queue Status */}
          {(() => {
            const queueStatus = getQueueStatus();
            return queueStatus.total > 0 ? (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  {queueStatus.total} action{queueStatus.total > 1 ? 's' : ''} queued for when online
                </p>
              </div>
            ) : null;
          })()}

          <div className="space-y-3">
            <button
              onClick={this.handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check Connection
            </button>
          </div>

          {this.props.offlineContent && (
            <div className="mt-8">
              {this.props.offlineContent}
            </div>
          )}
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Show offline mode if enabled and appropriate
      if (this.state.recoveryMode === 'offline' && this.props.enableOfflineMode) {
        return this.renderOfflineMode();
      }

      const FallbackComponent = this.props.fallback || GenericErrorFallback;
      
      return (
        <div className="min-h-[400px]">
          {/* Recovery mode indicator */}
          {this.state.recoveryMode === 'degraded' && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Degraded Mode</span>
              </div>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                The {this.props.pageName} page experienced multiple errors. Some features may be limited.
              </p>
            </div>
          )}

          <FallbackComponent
            error={this.state.error || undefined}
            errorInfo={this.state.errorInfo || undefined}
            onRetry={this.state.retryCount < this.maxRetries ? this.handleRetry : undefined}
            onReset={this.handleRefresh}
            onContactSupport={() => {
              const errorDetails = {
                pageName: this.props.pageName,
                errorId: this.state.errorId,
                message: this.state.error?.message,
                recoveryMode: this.state.recoveryMode,
              };
              
              const supportUrl = `mailto:support@sleepmode.app?subject=Page Error: ${this.props.pageName}&body=${encodeURIComponent(
                `I encountered an error on the ${this.props.pageName} page:

Error ID: ${errorDetails.errorId || 'N/A'}
Message: ${errorDetails.message || 'Unknown error'}
Recovery Mode: ${errorDetails.recoveryMode}
Time: ${new Date().toISOString()}

Please help me resolve this issue.`
              )}`;
              
              window.open(supportUrl);
            }}
          />
          
          {this.state.retryCount > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Retry attempt: {this.state.retryCount} of {this.maxRetries}
              {this.state.retryCount >= this.maxRetries && (
                <span className="block mt-1 text-orange-600 dark:text-orange-400">
                  Consider refreshing the page if issues persist
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary; 