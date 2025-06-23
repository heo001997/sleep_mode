import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import { ProtectedRoute, AuthLayout, LoginForm, RegisterForm } from '../components/auth';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Import page components
import {
  DashboardPage,
  SleepSessionsPage,
  SleepSessionDetailPage,
  AnalyticsPage,
  ProfilePage,
  SettingsPage,
  HelpPage,
  DocsPage,
  NotFoundPage,
} from '../pages';

// Loading component for route transitions
const RouteLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="large" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Error boundary wrapper for pages
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<RouteLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Authentication pages wrapper
const AuthPageWrapper: React.FC<{ children: React.ReactNode; title?: string; subtitle?: string }> = ({ 
  children, 
  title, 
  subtitle 
}) => (
  <AuthLayout title={title} subtitle={subtitle}>
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  </AuthLayout>
);

export const router = createBrowserRouter([
  // Authentication Routes
  {
    path: '/login',
    element: (
      <AuthPageWrapper 
        title="Welcome back" 
        subtitle="Sign in to your Sleep Mode account"
      >
        <LoginForm />
      </AuthPageWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthPageWrapper 
        title="Create account" 
        subtitle="Start tracking your sleep patterns today"
      >
        <RegisterForm />
      </AuthPageWrapper>
    ),
  },
  
  // Protected Dashboard Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      // Redirect root to dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      
      // Main Dashboard
      {
        path: 'dashboard',
        element: (
          <PageWrapper>
            <DashboardPage />
          </PageWrapper>
        ),
      },
      
      // Sleep Sessions
      {
        path: 'sleep-sessions',
        children: [
          {
            index: true,
            element: (
              <PageWrapper>
                <SleepSessionsPage />
              </PageWrapper>
            ),
          },
          {
            path: ':sessionId',
            element: (
              <PageWrapper>
                <SleepSessionDetailPage />
              </PageWrapper>
            ),
          },
        ],
      },
      
      // Analytics
      {
        path: 'analytics',
        element: (
          <PageWrapper>
            <AnalyticsPage />
          </PageWrapper>
        ),
      },
      
      // User Profile
      {
        path: 'profile',
        element: (
          <PageWrapper>
            <ProfilePage />
          </PageWrapper>
        ),
      },
      
      // Settings
      {
        path: 'settings',
        element: (
          <PageWrapper>
            <SettingsPage />
          </PageWrapper>
        ),
      },
      
      // Help & Support
      {
        path: 'help',
        element: (
          <PageWrapper>
            <HelpPage />
          </PageWrapper>
        ),
      },
      
      // Documentation
      {
        path: 'docs',
        element: (
          <PageWrapper>
            <DocsPage />
          </PageWrapper>
        ),
      },
    ],
  },
  
  // Catch-all 404 route
  {
    path: '*',
    element: (
      <PageWrapper>
        <NotFoundPage />
      </PageWrapper>
    ),
  },
]);

export default router; 