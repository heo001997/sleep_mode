import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { APP_CONFIG, STORAGE_KEYS } from '../config/constants';
import { storage } from '../utils';
import { networkService } from './networkService';
import { retryService } from './retryService';

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: APP_CONFIG.API_BASE_URL,
    timeout: APP_CONFIG.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and offline support
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized - clear auth data and redirect to login
      if (error.response?.status === 401) {
        storage.remove(STORAGE_KEYS.AUTH_TOKEN);
        storage.remove(STORAGE_KEYS.USER_DATA);
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Handle network errors and offline scenarios
      if (!error.response) {
        const networkStatus = networkService.getNetworkStatus();
        
        if (!networkStatus.isOnline) {
          // Queue request for retry when back online
          const config = error.config;
          if (config && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
            const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
            const headers = { ...config.headers };
            
            // Remove axios-specific headers
            delete headers['Content-Length'];
            delete headers['Accept-Encoding'];
            
            networkService.queueRequest(
              fullUrl,
              config.method?.toUpperCase() || 'GET',
              config.data,
              headers,
              { priority: 'medium', maxRetries: 3 }
            );
          }
          
          error.message = 'You are currently offline. Your request will be processed when connection is restored.';
        } else {
          error.message = 'Network error. Please check your connection.';
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// API Response wrapper type
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

// Generic API methods with retry support
export const api = {
  // GET request with retry
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig & { useRetry?: boolean }
  ): Promise<ApiResponse<T>> => {
    const { useRetry = true, ...axiosConfig } = config || {};
    
    const makeRequest = async () => {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, axiosConfig);
      return response.data;
    };

    if (useRetry) {
      return await retryService.retryNetworkOperation(makeRequest);
    } else {
      return await makeRequest();
    }
  },

  // POST request with retry and offline queuing
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { useRetry?: boolean; priority?: 'low' | 'medium' | 'high' }
  ): Promise<ApiResponse<T>> => {
    const { useRetry = true, priority = 'medium', ...axiosConfig } = config || {};
    
    const makeRequest = async () => {
      // Check if offline and queue request
      const networkStatus = networkService.getNetworkStatus();
      if (!networkStatus.isOnline) {
        const fullUrl = `${APP_CONFIG.API_BASE_URL}${url}`;
        const headers = { ...axiosConfig.headers };
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        networkService.queueRequest(fullUrl, 'POST', data, headers, { priority });
        throw new Error('Request queued for when connection is restored');
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, axiosConfig);
      return response.data;
    };

    if (useRetry) {
      return await retryService.retryNetworkOperation(makeRequest);
    } else {
      return await makeRequest();
    }
  },

  // PUT request with retry and offline queuing
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { useRetry?: boolean; priority?: 'low' | 'medium' | 'high' }
  ): Promise<ApiResponse<T>> => {
    const { useRetry = true, priority = 'medium', ...axiosConfig } = config || {};
    
    const makeRequest = async () => {
      // Check if offline and queue request
      const networkStatus = networkService.getNetworkStatus();
      if (!networkStatus.isOnline) {
        const fullUrl = `${APP_CONFIG.API_BASE_URL}${url}`;
        const headers = { ...axiosConfig.headers };
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        networkService.queueRequest(fullUrl, 'PUT', data, headers, { priority });
        throw new Error('Request queued for when connection is restored');
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, axiosConfig);
      return response.data;
    };

    if (useRetry) {
      return await retryService.retryNetworkOperation(makeRequest);
    } else {
      return await makeRequest();
    }
  },

  // PATCH request with retry and offline queuing
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { useRetry?: boolean; priority?: 'low' | 'medium' | 'high' }
  ): Promise<ApiResponse<T>> => {
    const { useRetry = true, priority = 'medium', ...axiosConfig } = config || {};
    
    const makeRequest = async () => {
      // Check if offline and queue request
      const networkStatus = networkService.getNetworkStatus();
      if (!networkStatus.isOnline) {
        const fullUrl = `${APP_CONFIG.API_BASE_URL}${url}`;
        const headers = { ...axiosConfig.headers };
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        networkService.queueRequest(fullUrl, 'PATCH', data, headers, { priority });
        throw new Error('Request queued for when connection is restored');
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, axiosConfig);
      return response.data;
    };

    if (useRetry) {
      return await retryService.retryNetworkOperation(makeRequest);
    } else {
      return await makeRequest();
    }
  },

  // DELETE request with retry and offline queuing
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig & { useRetry?: boolean; priority?: 'low' | 'medium' | 'high' }
  ): Promise<ApiResponse<T>> => {
    const { useRetry = true, priority = 'high', ...axiosConfig } = config || {};
    
    const makeRequest = async () => {
      // Check if offline and queue request
      const networkStatus = networkService.getNetworkStatus();
      if (!networkStatus.isOnline) {
        const fullUrl = `${APP_CONFIG.API_BASE_URL}${url}`;
        const headers = { ...axiosConfig.headers };
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        networkService.queueRequest(fullUrl, 'DELETE', undefined, headers, { priority });
        throw new Error('Request queued for when connection is restored');
      }
      
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, axiosConfig);
      return response.data;
    };

    if (useRetry) {
      return await retryService.retryNetworkOperation(makeRequest);
    } else {
      return await makeRequest();
    }
  },
};

// Utility function to build query parameters
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(`${key}[]`, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.response?.data?.errors) {
    // Handle validation errors (array of errors)
    if (Array.isArray(error.response.data.errors)) {
      return error.response.data.errors.join(', ');
    }
    
    // Handle validation errors (object with field errors)
    if (typeof error.response.data.errors === 'object') {
      return Object.values(error.response.data.errors).flat().join(', ');
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  // Default error messages based on status code
  switch (error.response?.status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'You are not authorized to perform this action.';
    case 403:
      return 'Access denied.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Please check your input and try again.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Check if error is a network error
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

// Check if error is a client error (4xx)
export const isClientError = (error: any): boolean => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

// Check if error is a server error (5xx)
export const isServerError = (error: any): boolean => {
  return error.response && error.response.status >= 500;
};

// Network and offline utilities
export const getNetworkStatus = () => networkService.getNetworkStatus();
export const isOffline = () => !networkService.getNetworkStatus().isOnline;
export const onNetworkStatusChange = (callback: (status: any) => void) => 
  networkService.onStatusChange(callback);

// Queue management utilities  
export const getQueueStatus = () => networkService.getQueueStatus();
export const processOfflineQueue = () => networkService.processQueue();
export const clearOfflineQueue = () => networkService.clearQueue();

// Retry utilities
export const getActiveRetryCount = () => retryService.getActiveOperationsCount();
export const getAllRetryOperations = () => retryService.getAllOperations();

// Enhanced error handler with offline context
export const handleApiErrorWithContext = (error: any): string => {
  // Check if this is an offline-related error
  if (error.message?.includes('queued for when connection is restored')) {
    return 'You are offline. Your request has been saved and will be processed when connection is restored.';
  }

  // Check current network status for better error messages
  const networkStatus = networkService.getNetworkStatus();
  if (!networkStatus.isOnline && isNetworkError(error)) {
    return 'You are currently offline. Please check your internet connection.';
  }

  // Use existing error handler for other cases
  return handleApiError(error);
};

export default api; 