import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import AuthContext from '../contexts/AuthContext'
import type { User, LoginCredentials, RegisterCredentials } from '../types'

// Mock auth context values type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// Create a default query client for tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
})

// Mock auth context values
export const mockAuthContextValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  refreshProfile: vi.fn().mockResolvedValue(undefined),
  error: null,
  clearError: vi.fn(),
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedAuthState?: Partial<AuthContextType>
  queryClient?: QueryClient
  initialRoute?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedAuthState,
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Merge provided state with defaults
  const authContextValue = {
    ...mockAuthContextValue,
    ...preloadedAuthState,
  }

  // Create wrapper component with all providers
  function Wrapper({ children }: { children?: ReactNode }) {
    // Set initial route if provided
    if (initialRoute !== '/') {
      window.history.pushState({}, 'Test page', initialRoute)
    }

    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authContextValue}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Simplified render function for components that don't need all providers
export function renderWithRouter(ui: ReactElement, { initialRoute = '/' } = {}) {
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute)
  }

  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
  })
}

// Helper to create a mock user for tests
export const createMockUser = (overrides = {}): User => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create mock sleep session data
export const createMockSleepSession = (overrides = {}) => ({
  id: '1',
  user_id: '1',
  start_time: '2024-01-01T22:00:00Z',
  end_time: '2024-01-02T06:00:00Z',
  dismissal_count: 0,
  total_dismissal_duration: 0,
  created_at: '2024-01-01T22:00:00Z',
  updated_at: '2024-01-02T06:00:00Z',
  ...overrides,
})

// Helper to mock fetch responses
export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  const mockResponse = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  }

  ;(global.fetch as any).mockResolvedValueOnce(mockResponse)
  return mockResponse
}

// Helper to mock fetch error
export const mockFetchError = (error = new Error('Network error')) => {
  ;(global.fetch as any).mockRejectedValueOnce(error)
}

// Helper to wait for queries to settle
export const waitForQueryToSettle = async (queryClient: QueryClient) => {
  await queryClient.getQueryCache().find()?.promise
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event' 