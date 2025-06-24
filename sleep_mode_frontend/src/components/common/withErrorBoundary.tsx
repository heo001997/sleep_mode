import React, { ComponentType, ReactNode } from 'react';
import PageErrorBoundary from './PageErrorBoundary';
import { ErrorFallbackProps } from './ErrorFallbacks';

interface WithErrorBoundaryOptions {
  // Error boundary configuration
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRecovery?: () => void;
  
  // Graceful degradation options
  enableOfflineMode?: boolean;
  offlineContent?: ReactNode;
  essentialFeatures?: string[];
  
  // Component identification
  displayName?: string;
  componentName?: string;
  
  // Recovery options
  enableRetry?: boolean;
  enableReset?: boolean;
  enableContactSupport?: boolean;
}

/**
 * Higher-Order Component that wraps a component with error boundary protection
 * and graceful degradation features.
 * 
 * @param WrappedComponent - The component to wrap with error boundary
 * @param options - Configuration options for error handling and graceful degradation
 * @returns Enhanced component with error boundary protection
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    fallback,
    onError,
    onRecovery,
    enableOfflineMode = false,
    offlineContent,
    essentialFeatures,
    displayName,
    componentName,
    enableRetry = true,
    enableReset = true,
    enableContactSupport = true,
  } = options;

  const WithErrorBoundaryComponent = (props: P) => {
    const pageName = displayName || componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      // Log component-specific error
      console.error(`Error in ${pageName}:`, error);
      
      // Call custom error handler if provided
      onError?.(error, errorInfo);
      
      // Log to error tracking service with component context
      if (typeof window !== 'undefined' && (window as any).logError) {
        (window as any).logError(error, {
          context: `Component: ${pageName}`,
          componentStack: errorInfo.componentStack,
          severity: 'medium',
          tags: ['component-error', pageName.toLowerCase()],
          additionalData: {
            componentName: pageName,
            props: Object.keys(props || {}).length,
            timestamp: new Date().toISOString(),
          }
        });
      }
    };

    const handleRecovery = () => {
      console.log(`Component ${pageName} recovered from error`);
      
      // Show recovery notification
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast({
          type: 'success',
          title: 'Recovery Successful',
          message: `${pageName} has been restored successfully.`,
          duration: 4000
        });
      }
      
      // Call custom recovery handler if provided
      onRecovery?.();
    };

    return (
      <PageErrorBoundary
        pageName={pageName}
        fallback={fallback}
        onError={handleError}
        onRecovery={handleRecovery}
        enableOfflineMode={enableOfflineMode}
        offlineContent={offlineContent}
        essentialFeatures={essentialFeatures}
      >
        <WrappedComponent {...props} />
      </PageErrorBoundary>
    );
  };

  // Set display name for debugging
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${pageName})`;

  return WithErrorBoundaryComponent;
}

// Convenience function for common use cases
export function withGracefulDegradation<P extends object>(
  WrappedComponent: ComponentType<P>,
  essentialFeatures: string[],
  offlineContent?: ReactNode
) {
  return withErrorBoundary(WrappedComponent, {
    enableOfflineMode: true,
    essentialFeatures,
    offlineContent,
    componentName: WrappedComponent.displayName || WrappedComponent.name,
  });
}

// Convenience function for critical components that need maximum error protection
export function withCriticalErrorProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return withErrorBoundary(WrappedComponent, {
    enableOfflineMode: true,
    enableRetry: true,
    enableReset: true,
    enableContactSupport: true,
    essentialFeatures: ['Basic functionality', 'Data viewing', 'Navigation'],
    onError: (error, errorInfo) => {
      // Enhanced logging for critical components
      console.error('🚨 CRITICAL COMPONENT ERROR:', {
        component: WrappedComponent.displayName || WrappedComponent.name,
        error,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
      
      // Send to monitoring service immediately
      if (typeof window !== 'undefined' && (window as any).logError) {
        (window as any).logError(error, {
          context: `CRITICAL: ${WrappedComponent.displayName || WrappedComponent.name}`,
          componentStack: errorInfo.componentStack,
          severity: 'critical',
          tags: ['critical-error', 'component-error'],
          additionalData: {
            isCritical: true,
            componentName: WrappedComponent.displayName || WrappedComponent.name,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        });
      }
      
      // Show critical error notification
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast({
          type: 'error',
          title: 'Critical Error Detected',
          message: 'A critical component encountered an error. The support team has been notified.',
          persistent: true,
          action: {
            label: 'Report Issue',
            onClick: () => {
              const errorDetails = {
                component: WrappedComponent.displayName || WrappedComponent.name,
                message: error.message,
                timestamp: new Date().toISOString(),
              };
              
              const supportUrl = `mailto:support@sleepmode.app?subject=Critical Error Report&body=${encodeURIComponent(
                `A critical error occurred:

Component: ${errorDetails.component}
Message: ${errorDetails.message}
Time: ${errorDetails.timestamp}

This error was automatically detected and logged. Please investigate immediately.`
              )}`;
              
              window.open(supportUrl);
            }
          }
        });
      }
      
      // Call custom error handler
      onError?.(error, errorInfo);
    },
    componentName: WrappedComponent.displayName || WrappedComponent.name,
  });
}

// Export the HOC as default
export default withErrorBoundary; 