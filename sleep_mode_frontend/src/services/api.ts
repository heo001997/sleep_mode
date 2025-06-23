import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { APP_CONFIG, STORAGE_KEYS } from '../config/constants';
import { storage } from '../utils';

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

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 Unauthorized - clear auth data and redirect to login
      if (error.response?.status === 401) {
        storage.remove(STORAGE_KEYS.AUTH_TOKEN);
        storage.remove(STORAGE_KEYS.USER_DATA);
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Handle network errors
      if (!error.response) {
        error.message = 'Network error. Please check your connection.';
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

// Generic API methods
export const api = {
  // GET request
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
    return response.data;
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

export default api; 