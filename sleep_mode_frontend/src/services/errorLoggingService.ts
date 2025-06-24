// Error Logging Service for monitoring and debugging
import { networkService, type NetworkStatus } from './networkService';

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: 'javascript' | 'promise' | 'network' | 'component' | 'api' | 'user';
  stack?: string;
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    buildVersion?: string;
    environment: string;
    networkStatus?: NetworkStatus;
    componentStack?: string;
    errorBoundary?: string;
    route?: string;
    userAction?: string;
    additionalData?: Record<string, any>;
  };
  tags?: string[];
  fingerprint?: string;
  breadcrumbs: ErrorBreadcrumb[];
}

export interface ErrorBreadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'api' | 'dom' | 'console' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  maxBreadcrumbs: number;
  maxLocalLogs: number;
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  enableRemoteReporting: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  // Sentry integration
  sentryDsn?: string;
  sentryEnabled?: boolean;
  // Sampling rates
  sampleRate: number;
  errorSampleRate: number;
}

export interface RemoteErrorReport {
  errors: ErrorLogEntry[];
  metadata: {
    timestamp: number;
    sessionId: string;
    userId?: string;
    buildVersion?: string;
    environment: string;
    userAgent: string;
    url: string;
  };
}

class ErrorLoggingService {
  private config: ErrorReportingConfig;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private localLogs: ErrorLogEntry[] = [];
  private sessionId: string;
  private isInitialized = false;
  private reportQueue: ErrorLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
  }

  // Initialize the error logging service
  initialize(config: Partial<ErrorReportingConfig> = {}): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up periodic flushing
    if (this.config.enableRemoteReporting) {
      this.setupPeriodicFlush();
    }

    // Load existing breadcrumbs from storage
    this.loadBreadcrumbsFromStorage();

    // Add initial breadcrumb
    this.addBreadcrumb({
      category: 'navigation',
      message: 'Error logging service initialized',
      level: 'info',
      data: { 
        config: this.sanitizeConfig(),
        sessionId: this.sessionId 
      }
    });

    console.log('Error logging service initialized', {
      environment: this.config.environment,
      remoteReporting: this.config.enableRemoteReporting,
      sessionId: this.sessionId
    });
  }

  // Log an error with full context
  logError(error: Error | string, context: Partial<ErrorLogEntry['context']> = {}): void {
    if (!this.isInitialized) {
      console.warn('Error logging service not initialized');
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level: 'error',
      message: errorMessage,
      source: context.componentStack ? 'component' : 'javascript',
      stack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        sessionId: this.sessionId,
        buildVersion: this.config.buildVersion,
        environment: this.config.environment,
        networkStatus: networkService.getNetworkStatus(),
        route: window.location.pathname,
        ...context
      },
      breadcrumbs: [...this.breadcrumbs],
      fingerprint: this.generateFingerprint(errorMessage, stack),
      tags: ['error', this.config.environment]
    };

    this.processLogEntry(logEntry);
  }

  // Log a warning
  logWarning(message: string, context: Partial<ErrorLogEntry['context']> = {}): void {
    if (!this.isInitialized) return;

    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level: 'warning',
      message,
      source: 'user',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        sessionId: this.sessionId,
        buildVersion: this.config.buildVersion,
        environment: this.config.environment,
        networkStatus: networkService.getNetworkStatus(),
        route: window.location.pathname,
        ...context
      },
      breadcrumbs: [...this.breadcrumbs],
      tags: ['warning', this.config.environment]
    };

    this.processLogEntry(logEntry);
  }

  // Log API errors
  logApiError(error: any, endpoint: string, method: string, context: Record<string, any> = {}): void {
    const errorMessage = error.response?.data?.message || error.message || 'API request failed';
    const statusCode = error.response?.status;
    const responseData = error.response?.data;

    this.logError(new Error(errorMessage), {
      source: 'api',
      userAction: `${method.toUpperCase()} ${endpoint}`,
      additionalData: {
        endpoint,
        method,
        statusCode,
        responseData,
        ...context
      }
    });

    // Add API breadcrumb
    this.addBreadcrumb({
      category: 'api',
      message: `API ${method.toUpperCase()} ${endpoint} failed`,
      level: 'error',
      data: {
        endpoint,
        method,
        statusCode,
        error: errorMessage
      }
    });
  }

  // Log network errors
  logNetworkError(error: any, context: Record<string, any> = {}): void {
    this.logError(error, {
      source: 'network',
      additionalData: {
        networkStatus: networkService.getNetworkStatus(),
        ...context
      }
    });

    this.addBreadcrumb({
      category: 'error',
      message: 'Network error occurred',
      level: 'error',
      data: context
    });
  }

  // Add a breadcrumb for tracking user actions
  addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: ErrorBreadcrumb = {
      timestamp: Date.now(),
      ...breadcrumb
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Save to storage
    if (this.config.enableLocalStorage) {
      this.saveBreadcrumbsToStorage();
    }
  }

  // Get all logged errors
  getLocalLogs(): ErrorLogEntry[] {
    return [...this.localLogs];
  }

  // Get recent breadcrumbs
  getBreadcrumbs(): ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  // Clear local logs
  clearLocalLogs(): void {
    this.localLogs = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('errorLogs');
    }
  }

  // Clear breadcrumbs
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('errorBreadcrumbs');
    }
  }

  // Manually flush errors to remote service
  async flushErrors(): Promise<void> {
    if (!this.config.enableRemoteReporting || this.reportQueue.length === 0) {
      return;
    }

    const errorsToReport = [...this.reportQueue];
    this.reportQueue = [];

    try {
      await this.sendErrorsToRemote(errorsToReport);
      console.log(`Successfully reported ${errorsToReport.length} errors`);
    } catch (error) {
      // Add errors back to queue if reporting fails
      this.reportQueue.unshift(...errorsToReport);
      console.error('Failed to report errors:', error);
    }
  }

  // Set user context
  setUserContext(userId: string, additionalData: Record<string, any> = {}): void {
    this.config.userId = userId;
    
    this.addBreadcrumb({
      category: 'user',
      message: 'User context updated',
      level: 'info',
      data: { userId, ...additionalData }
    });
  }

  // Set custom tag
  setTag(key: string, value: string): void {
    // This would be used with external services like Sentry
    this.addBreadcrumb({
      category: 'user',
      message: `Tag set: ${key}=${value}`,
      level: 'info',
      data: { tag: { [key]: value } }
    });
  }

  // Get service statistics
  getStatistics(): {
    totalErrors: number;
    totalWarnings: number;
    breadcrumbCount: number;
    queuedReports: number;
    sessionId: string;
    isRemoteReportingEnabled: boolean;
  } {
    const errorCount = this.localLogs.filter(log => log.level === 'error').length;
    const warningCount = this.localLogs.filter(log => log.level === 'warning').length;

    return {
      totalErrors: errorCount,
      totalWarnings: warningCount,
      breadcrumbCount: this.breadcrumbs.length,
      queuedReports: this.reportQueue.length,
      sessionId: this.sessionId,
      isRemoteReportingEnabled: this.config.enableRemoteReporting
    };
  }

  // Dispose service and cleanup
  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Remove global error handlers
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isInitialized = false;
  }

  // Private methods
  private getDefaultConfig(): ErrorReportingConfig {
    return {
      enabled: true,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      maxBreadcrumbs: 50,
      maxLocalLogs: 100,
      enableConsoleLogging: process.env.NODE_ENV !== 'production',
      enableLocalStorage: true,
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      sampleRate: 1.0,
      errorSampleRate: 1.0,
      sessionId: this.sessionId,
      buildVersion: process.env.REACT_APP_VERSION || 'unknown'
    };
  }

  private setupGlobalErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    this.logError(new Error(event.message), {
      source: 'javascript',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.logError(error, {
      source: 'promise',
      additionalData: {
        reason: event.reason
      }
    });
  };

  private processLogEntry(entry: ErrorLogEntry): void {
    // Add to local logs
    this.localLogs.push(entry);

    // Limit local logs
    if (this.localLogs.length > this.config.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(-this.config.maxLocalLogs);
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      const logMethod = entry.level === 'error' ? console.error : 
                       entry.level === 'warning' ? console.warn : console.log;
      logMethod(`[ErrorLogging] ${entry.message}`, entry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.saveLogsToStorage();
    }

    // Queue for remote reporting
    if (this.config.enableRemoteReporting && this.shouldSample()) {
      this.reportQueue.push(entry);
    }

    // Add error breadcrumb
    this.addBreadcrumb({
      category: 'error',
      message: entry.message,
      level: entry.level,
      data: {
        source: entry.source,
        fingerprint: entry.fingerprint
      }
    });
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(message: string, stack?: string): string {
    const content = stack || message;
    // Simple hash function for fingerprinting
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private setupPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushErrors();
      }
    }, 30000); // Flush every 30 seconds
  }

  private async sendErrorsToRemote(errors: ErrorLogEntry[]): Promise<void> {
    if (!this.config.apiEndpoint) {
      throw new Error('No API endpoint configured for error reporting');
    }

    const report: RemoteErrorReport = {
      errors,
      metadata: {
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.config.userId,
        buildVersion: this.config.buildVersion,
        environment: this.config.environment,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(report)
    });

    if (!response.ok) {
      throw new Error(`Failed to report errors: ${response.status} ${response.statusText}`);
    }
  }

  private saveLogsToStorage(): void {
    try {
      localStorage.setItem('errorLogs', JSON.stringify(this.localLogs.slice(-20))); // Keep last 20
    } catch (error) {
      console.warn('Failed to save error logs to localStorage:', error);
    }
  }

  private saveBreadcrumbsToStorage(): void {
    try {
      localStorage.setItem('errorBreadcrumbs', JSON.stringify(this.breadcrumbs.slice(-30))); // Keep last 30
    } catch (error) {
      console.warn('Failed to save breadcrumbs to localStorage:', error);
    }
  }

  private loadBreadcrumbsFromStorage(): void {
    try {
      const stored = localStorage.getItem('errorBreadcrumbs');
      if (stored) {
        this.breadcrumbs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load breadcrumbs from localStorage:', error);
    }
  }

  private sanitizeConfig(): Partial<ErrorReportingConfig> {
    const { apiKey, sentryDsn, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Create singleton instance
export const errorLoggingService = new ErrorLoggingService();

// React Error Boundary integration
export const logErrorBoundaryError = (error: Error, errorInfo: { componentStack: string }): void => {
  errorLoggingService.logError(error, {
    source: 'component',
    componentStack: errorInfo.componentStack,
    errorBoundary: 'React Error Boundary'
  });
};

// API integration helper
export const logApiCall = (method: string, endpoint: string, success: boolean, data?: any): void => {
  errorLoggingService.addBreadcrumb({
    category: 'api',
    message: `${method.toUpperCase()} ${endpoint}`,
    level: success ? 'info' : 'warning',
    data: {
      method,
      endpoint,
      success,
      ...(data && { response: data })
    }
  });
};

// Navigation tracking
export const logNavigation = (from: string, to: string): void => {
  errorLoggingService.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
    data: { from, to }
  });
};

// User action tracking
export const logUserAction = (action: string, target: string, data?: any): void => {
  errorLoggingService.addBreadcrumb({
    category: 'user',
    message: `User ${action} on ${target}`,
    level: 'info',
    data: { action, target, ...data }
  });
};

export default errorLoggingService; 