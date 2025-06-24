import { ErrorInfo } from 'react';
import { errorLoggingService } from './errorLoggingService';

// Error types and interfaces
export interface GlobalErrorData {
  errorId: string;
  timestamp: string;
  type: 'javascript' | 'promise' | 'network' | 'component' | 'api';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    component?: string;
    action?: string;
    route?: string;
    [key: string]: any;
  };
}

export interface ErrorHandlerConfig {
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  maxLocalErrors: number;
  reportingEndpoint?: string;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  userId?: string;
}

// Error reporting callback type
export type ErrorReportCallback = (error: GlobalErrorData) => void;

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableLocalStorage: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  maxLocalErrors: 50,
  environment: (process.env.NODE_ENV as any) || 'development',
};

class ErrorHandlingService {
  private config: ErrorHandlerConfig;
  private sessionId: string;
  private errorCallbacks: ErrorReportCallback[] = [];
  private isInitialized = false;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
  }

  // Initialize global error handling
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('ErrorHandlingService is already initialized');
      return;
    }

    // Handle uncaught JavaScript errors
    window.addEventListener('error', this.handleJavaScriptError);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    
    // Handle resource loading errors (images, scripts, etc.)
    window.addEventListener('error', this.handleResourceError, true);

    this.isInitialized = true;
    
    if (this.config.enableConsoleLogging) {
      console.log('🛡️ Global error handling initialized');
    }
  }

  // Clean up event listeners
  public destroy(): void {
    if (!this.isInitialized) return;

    window.removeEventListener('error', this.handleJavaScriptError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    window.removeEventListener('error', this.handleResourceError, true);
    
    this.isInitialized = false;
    this.errorCallbacks = [];
  }

  // Add callback for error reporting
  public onError(callback: ErrorReportCallback): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Manually report an error
  public reportError(
    error: Error | string,
    context?: GlobalErrorData['context'],
    severity: GlobalErrorData['severity'] = 'medium'
  ): void {
    const errorData = this.createErrorData({
      type: 'javascript',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      severity,
      context,
    });

    this.processError(errorData);
  }

  // Report React component errors (from ErrorBoundary)
  public reportComponentError(
    error: Error,
    errorInfo: ErrorInfo,
    componentName?: string,
    errorId?: string
  ): void {
    const errorData = this.createErrorData({
      type: 'component',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        component: componentName,
        componentStack: errorInfo.componentStack,
      },
      metadata: {
        errorId,
        reactErrorInfo: errorInfo,
      },
    });

    this.processError(errorData);
  }

  // Report API/Network errors
  public reportNetworkError(
    error: Error,
    url: string,
    method: string,
    status?: number,
    context?: Record<string, any>
  ): void {
    const errorData = this.createErrorData({
      type: 'network',
      message: error.message,
      stack: error.stack,
      severity: status && status >= 500 ? 'high' : 'medium',
      context: {
        action: 'api_request',
        url,
        method,
        status,
        ...context,
      },
    });

    this.processError(errorData);
  }

  // Get stored errors from localStorage
  public getStoredErrors(): GlobalErrorData[] {
    if (!this.config.enableLocalStorage) return [];

    try {
      const stored = localStorage.getItem('error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to retrieve stored errors:', e);
      return [];
    }
  }

  // Clear stored errors
  public clearStoredErrors(): void {
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('error_logs');
    }
  }

  // Update configuration
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle JavaScript errors
  private handleJavaScriptError = (event: ErrorEvent): void => {
    const errorData = this.createErrorData({
      type: 'javascript',
      message: event.message,
      stack: event.error?.stack,
      severity: 'high',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });

    this.processError(errorData);
  };

  // Handle promise rejections
  private handlePromiseRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason;
    const message = typeof error === 'string' ? error : error?.message || 'Unhandled promise rejection';
    const stack = typeof error === 'object' ? error?.stack : undefined;

    const errorData = this.createErrorData({
      type: 'promise',
      message,
      stack,
      severity: 'high',
      context: {
        rejectionReason: error,
      },
    });

    this.processError(errorData);
    
    // Prevent the default browser behavior (console error)
    event.preventDefault();
  };

  // Handle resource loading errors
  private handleResourceError = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // Only handle resource errors, not JavaScript errors
    if (target && target !== window && target.tagName) {
      const errorData = this.createErrorData({
        type: 'network',
        message: `Failed to load resource: ${target.tagName}`,
        severity: 'medium',
        context: {
          action: 'resource_load',
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
        },
      });

      this.processError(errorData);
    }
  };

  // Create standardized error data object
  private createErrorData(partial: Partial<GlobalErrorData>): GlobalErrorData {
    return {
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      userId: this.config.userId,
      type: 'javascript',
      severity: 'medium',
      message: 'Unknown error',
      ...partial,
    };
  }

  // Process and report error
  private processError(errorData: GlobalErrorData): void {
    // Use the new error logging service for comprehensive logging
    const error = new Error(errorData.message);
    if (errorData.stack) {
      error.stack = errorData.stack;
    }

    // Map to new logging service
    errorLoggingService.logError(error, {
      source: this.mapErrorType(errorData.type),
      userAction: errorData.context?.action,
      route: errorData.context?.route,
      additionalData: {
        severity: errorData.severity,
        globalErrorId: errorData.errorId,
        ...errorData.metadata,
        ...errorData.context,
      }
    });

    // Console logging (legacy support)
    if (this.config.enableConsoleLogging) {
      const logMethod = errorData.severity === 'critical' || errorData.severity === 'high' 
        ? console.error 
        : console.warn;
      
      logMethod('🚨 Global Error Captured:', errorData);
    }

    // Local storage (legacy support)
    if (this.config.enableLocalStorage) {
      this.storeErrorLocally(errorData);
    }

    // Call registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorData);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
  }

  // Map legacy error types to new logging service types
  private mapErrorType(type: GlobalErrorData['type']): 'javascript' | 'promise' | 'network' | 'component' | 'api' | 'user' {
    switch (type) {
      case 'api':
        return 'api';
      case 'network':
        return 'network';
      case 'component':
        return 'component';
      case 'promise':
        return 'promise';
      case 'javascript':
      default:
        return 'javascript';
    }
  }

  // Store error in localStorage
  private storeErrorLocally(errorData: GlobalErrorData): void {
    try {
      const existing = this.getStoredErrors();
      existing.push(errorData);
      
      // Keep only the most recent errors
      if (existing.length > this.config.maxLocalErrors) {
        existing.splice(0, existing.length - this.config.maxLocalErrors);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to store error locally:', e);
    }
  }

  // Send error to remote logging service
  private async reportErrorRemotely(errorData: GlobalErrorData): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status}`);
      }
    } catch (e) {
      // Silently fail remote reporting to avoid recursive errors
      if (this.config.enableConsoleLogging) {
        console.warn('Failed to report error remotely:', e);
      }
    }
  }
}

// Singleton instance
let errorHandlingService: ErrorHandlingService | null = null;

// Initialize and get global error handling service
export const getErrorHandlingService = (config?: Partial<ErrorHandlerConfig>): ErrorHandlingService => {
  if (!errorHandlingService) {
    errorHandlingService = new ErrorHandlingService(config);
  }
  return errorHandlingService;
};

// Convenience functions
export const initializeGlobalErrorHandling = (config?: Partial<ErrorHandlerConfig>): ErrorHandlingService => {
  const service = getErrorHandlingService(config);
  service.initialize();
  return service;
};

export const reportGlobalError = (error: Error | string, context?: GlobalErrorData['context']): void => {
  if (errorHandlingService) {
    errorHandlingService.reportError(error, context);
  }
};

export const reportNetworkError = (
  error: Error,
  url: string,
  method: string,
  status?: number,
  context?: Record<string, any>
): void => {
  if (errorHandlingService) {
    errorHandlingService.reportNetworkError(error, url, method, status, context);
  }
};

export default ErrorHandlingService; 