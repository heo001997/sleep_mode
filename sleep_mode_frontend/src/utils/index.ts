// Date and Time Utilities
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'time') {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

export const calculateSleepDuration = (startTime: string, endTime?: string): number | null => {
  if (!endTime) return null;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
};

export const getTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  
  return formatDate(dateObj);
};

export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isThisWeek = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return d >= weekStart && d <= weekEnd;
};

// Validation Utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidQualityRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 10 && Number.isInteger(rating);
};

// String Utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Number Utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const round = (value: number, decimals: number = 2): number => {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Array Utilities
export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Object Utilities
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

// Local Storage Utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle quota exceeded or other localStorage errors
      console.warn('Failed to save to localStorage');
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle localStorage errors
      console.warn('Failed to remove from localStorage');
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch {
      // Handle localStorage errors
      console.warn('Failed to clear localStorage');
    }
  },
};

// URL Utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const parseQueryString = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// Sleep Quality Utilities
export const getQualityLabel = (rating?: number): string => {
  if (!rating) return 'Not rated';
  
  if (rating >= 9) return 'Excellent';
  if (rating >= 7) return 'Good';
  if (rating >= 5) return 'Fair';
  if (rating >= 3) return 'Poor';
  return 'Very Poor';
};

export const getQualityColor = (rating?: number): string => {
  if (!rating) return 'text-gray-500';
  
  if (rating >= 8) return 'text-wellness-600';
  if (rating >= 6) return 'text-yellow-600';
  if (rating >= 4) return 'text-orange-600';
  return 'text-red-600';
};

// Error Handling Utilities
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

// Debounce Utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Theme Utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Constants
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sleep_mode_auth_token',
  USER_DATA: 'sleep_mode_user_data',
  THEME_MODE: 'sleep_mode_theme_mode',
  PREFERENCES: 'sleep_mode_preferences',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  SLEEP_SESSIONS: {
    LIST: '/sleep_sessions',
    SHOW: (id: number) => `/sleep_sessions/${id}`,
    CREATE: '/sleep_sessions',
    UPDATE: (id: number) => `/sleep_sessions/${id}`,
    DELETE: (id: number) => `/sleep_sessions/${id}`,
    BULK_CREATE: '/sleep_sessions/bulk_create',
  },
} as const;

export const QUERY_KEYS = {
  SLEEP_SESSIONS: ['sleep_sessions'],
  SLEEP_SESSION: (id: number) => ['sleep_session', id],
  USER_PROFILE: ['user_profile'],
} as const;

// Data Export Utilities
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportSleepSessionsToCSV = (sessions: any[], filename?: string): void => {
  if (sessions.length === 0) {
    console.warn('No sleep sessions to export');
    return;
  }

  // Transform sessions data for CSV export
  const csvData = sessions.map(session => ({
    'Session ID': session.id,
    'Start Time': formatDateTime(session.start_time),
    'End Time': session.end_time ? formatDateTime(session.end_time) : 'In Progress',
    'Duration (minutes)': session.end_time ? calculateDuration(session.start_time, session.end_time) : 'N/A',
    'Duration (formatted)': session.end_time ? formatDuration(calculateDuration(session.start_time, session.end_time)) : 'N/A',
    'Quality Rating': session.quality_rating || 'Not Rated',
    'Dismissal Count': session.dismissal_count || 0,
    'Status': session.end_time ? 'Completed' : 'Active',
    'Created At': formatDateTime(session.created_at),
    'Updated At': formatDateTime(session.updated_at)
  }));

  const defaultFilename = `sleep-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(csvData, filename || defaultFilename);
};

export const exportToJSON = (data: any[], filename: string): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Real-time Updates Utilities
export const createPollingInterval = (
  callback: () => void | Promise<void>,
  intervalMs: number = 30000 // Default 30 seconds
): (() => void) => {
  const interval = setInterval(async () => {
    try {
      await callback();
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
};

export const createVisibilityChangeListener = (
  onVisible: () => void,
  onHidden?: () => void
): (() => void) => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onHidden?.();
    } else {
      onVisible();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}; 