// Application Configuration
export const APP_CONFIG = {
  NAME: 'Sleep Mode',
  VERSION: '1.0.0',
  DESCRIPTION: 'Track and improve your sleep quality',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  API_TIMEOUT: 30000, // 30 seconds
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
} as const;

// Sleep Session Status
export const SLEEP_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Sleep Quality Ratings
export const SLEEP_QUALITY = {
  MIN: 1,
  MAX: 10,
  LABELS: {
    1: 'Terrible',
    2: 'Very Poor',
    3: 'Poor',
    4: 'Below Average',
    5: 'Fair',
    6: 'Average',
    7: 'Good',
    8: 'Very Good',
    9: 'Excellent',
    10: 'Perfect',
  },
  COLORS: {
    1: 'bg-red-500',
    2: 'bg-red-400',
    3: 'bg-orange-500',
    4: 'bg-orange-400',
    5: 'bg-yellow-500',
    6: 'bg-yellow-400',
    7: 'bg-green-400',
    8: 'bg-green-500',
    9: 'bg-wellness-500',
    10: 'bg-wellness-600',
  },
} as const;

// Theme Configuration
export const THEME = {
  MODES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
  STORAGE_KEY: 'sleep_mode_theme',
} as const;

// Date & Time Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SLEEP_SESSIONS: '/sleep-sessions',
  SLEEP_SESSION_DETAIL: '/sleep-sessions/:id',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// API Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  REGISTER_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully.',
  SESSION_STARTED: 'Sleep session started successfully.',
  SESSION_ENDED: 'Sleep session ended successfully.',
  SESSION_DELETED: 'Sleep session deleted successfully.',
  SESSION_UPDATED: 'Sleep session updated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: 'Password must be at least 8 characters long',
    UPPERCASE: 'Password must contain at least one uppercase letter',
    LOWERCASE: 'Password must contain at least one lowercase letter',
    NUMBER: 'Password must contain at least one number',
  },
  NAME: {
    REQUIRED: 'Name is required',
    MIN_LENGTH: 'Name must be at least 2 characters long',
    MAX_LENGTH: 'Name must not exceed 50 characters',
  },
  SLEEP_QUALITY: {
    REQUIRED: 'Sleep quality rating is required',
    MIN: 'Rating must be at least 1',
    MAX: 'Rating cannot exceed 10',
  },
  NOTES: {
    MAX_LENGTH: 'Notes cannot exceed 1000 characters',
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sleep_mode_auth_token',
  USER_DATA: 'sleep_mode_user_data',
  THEME_MODE: 'sleep_mode_theme_mode',
  PREFERENCES: 'sleep_mode_preferences',
  ONBOARDING_COMPLETED: 'sleep_mode_onboarding_completed',
  LAST_ACTIVE_SESSION: 'sleep_mode_last_active_session',
} as const;

// Sleep Recommendations
export const SLEEP_RECOMMENDATIONS = {
  ADULT_HOURS: {
    MIN: 7,
    MAX: 9,
    OPTIMAL: 8,
  },
  BEDTIME_WINDOW: {
    EARLY: 21, // 9 PM
    LATE: 23, // 11 PM
  },
  WAKE_TIME_WINDOW: {
    EARLY: 6, // 6 AM
    LATE: 8, // 8 AM
  },
} as const;

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PAGE_TRANSITION: 200,
  MODAL_TRANSITION: 250,
  LOADING_SPINNER: 1000,
} as const;

// Device Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Sleep Session Types
export const SESSION_TYPES = {
  NIGHT_SLEEP: 'night_sleep',
  NAP: 'nap',
  REST: 'rest',
} as const;

// Sleep Environment Factors
export const ENVIRONMENT_FACTORS = {
  TEMPERATURE: {
    TOO_COLD: 'too_cold',
    COLD: 'cold',
    COMFORTABLE: 'comfortable',
    WARM: 'warm',
    TOO_WARM: 'too_warm',
  },
  NOISE_LEVEL: {
    SILENT: 'silent',
    QUIET: 'quiet',
    MODERATE: 'moderate',
    NOISY: 'noisy',
    VERY_NOISY: 'very_noisy',
  },
  LIGHTING: {
    DARK: 'dark',
    DIM: 'dim',
    MODERATE: 'moderate',
    BRIGHT: 'bright',
    VERY_BRIGHT: 'very_bright',
  },
} as const;

// Sleep Disturbances
export const SLEEP_DISTURBANCES = {
  NONE: 'none',
  BATHROOM: 'bathroom',
  NOISE: 'noise',
  TEMPERATURE: 'temperature',
  STRESS: 'stress',
  PAIN: 'pain',
  DREAMS: 'dreams',
  OTHER: 'other',
} as const;

// Mood Tracking
export const MOOD_OPTIONS = {
  VERY_SAD: 'very_sad',
  SAD: 'sad',
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  VERY_HAPPY: 'very_happy',
} as const;

// Energy Level Tracking
export const ENERGY_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const;

// Export types for better TypeScript support
export type SleepStatus = typeof SLEEP_STATUS[keyof typeof SLEEP_STATUS];
export type ThemeMode = typeof THEME.MODES[keyof typeof THEME.MODES];
export type SessionType = typeof SESSION_TYPES[keyof typeof SESSION_TYPES];
export type SleepDisturbance = typeof SLEEP_DISTURBANCES[keyof typeof SLEEP_DISTURBANCES];
export type MoodOption = typeof MOOD_OPTIONS[keyof typeof MOOD_OPTIONS];
export type EnergyLevel = typeof ENERGY_LEVELS[keyof typeof ENERGY_LEVELS]; 