// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  roles?: string[]; // For role-based authorization
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  token?: string;
}

// Sleep Session Types
export interface SleepSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  quality_rating?: number;
  notes?: string;
  dismissal_count: number;
  total_dismissal_duration: number;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSleepSessionRequest {
  start_time: string;
  end_time?: string;
  quality_rating?: number;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface UpdateSleepSessionRequest extends Partial<CreateSleepSessionRequest> {}

// Type aliases for service compatibility
export type SleepSessionCreateRequest = CreateSleepSessionRequest;
export type SleepSessionUpdateRequest = UpdateSleepSessionRequest;

// Pagination Types
export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface SleepSessionsResponse {
  sleep_sessions: SleepSession[];
  pagination: PaginationInfo;
  filters?: {
    start_date?: string;
    end_date?: string;
    status?: 'completed' | 'active';
    min_quality?: string;
    max_quality?: string;
  };
  sorting?: {
    sort_by: string;
    sort_direction: 'asc' | 'desc';
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormError[];
  loading: boolean;
  submitted: boolean;
}

// UI Types
export interface ThemeMode {
  mode: 'light' | 'dark' | 'system';
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

// Query Types (for React Query)
export interface QueryParams {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  status?: 'completed' | 'active';
  min_quality?: number;
  max_quality?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Dashboard Types
export interface DashboardStats {
  total_sessions: number;
  avg_sleep_duration: number;
  avg_quality_rating: number;
  sessions_this_week: number;
  quality_trend: 'up' | 'down' | 'stable';
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  name: string;
  value: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Environment Types
export interface EnvironmentConfig {
  API_BASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VERSION: string;
} 