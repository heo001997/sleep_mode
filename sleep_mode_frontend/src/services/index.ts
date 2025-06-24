// Export all services
export { default as api } from './api';
export { default as authService } from './authService';
export { default as sleepSessionService } from './sleepSessionService';
export { default as settingsService } from './settingsService';
export { default as profileService } from './profileService';
export { networkService } from './networkService';
export { retryService } from './retryService';
export { errorLoggingService } from './errorLoggingService';

// Export types
export type { User, LoginCredentials, RegisterCredentials } from './authService';
export type { SleepSession, SleepSessionCreateRequest, SleepSessionUpdateRequest, SleepSessionFilters } from './sleepSessionService';
export type { 
  UserSettings, 
  SleepScheduleSettings, 
  NotificationSettings, 
  SettingsUpdateRequest 
} from './settingsService';

export type { ChangePasswordRequest, UpdateProfileRequest, UpdateEmailRequest, ProfileActivityItem, PrivacySettings } from './profileService';

// Error Handling Service
export { 
  default as ErrorHandlingService,
  getErrorHandlingService,
  initializeGlobalErrorHandling,
  reportGlobalError,
  reportNetworkError
} from './errorHandlingService';
export type { 
  GlobalErrorData,
  ErrorHandlerConfig,
  ErrorReportCallback
} from './errorHandlingService';

// Network and Retry Services
export type { 
  NetworkStatus, 
  QueuedRequest, 
  RetryOptions 
} from './networkService';
export type { 
  RetryConfig, 
  RetryResult, 
  RetryOperation 
} from './retryService';

// Error Logging Service
export type {
  ErrorLogEntry,
  ErrorBreadcrumb,
  ErrorReportingConfig,
  RemoteErrorReport
} from './errorLoggingService';
export {
  logErrorBoundaryError,
  logApiCall,
  logNavigation,
  logUserAction
} from './errorLoggingService';

// Additional types from main types file
export type { APIResponse } from '../types'; 