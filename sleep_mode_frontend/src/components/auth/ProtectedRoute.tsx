import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
  requiredRoles = [],
  fallback,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirecting after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // If authentication is not required but user is authenticated (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Get the original destination from state, or default to dashboard
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Check role-based permissions if roles are specified
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

// Higher-order component version for backward compatibility
export const withProtectedRoute = (
  Component: React.ComponentType<any>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const ProtectedComponent = (props: any) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

// Specific route guards for common use cases

// Require authentication (default behavior)
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);

// Block authenticated users (for login/register pages)
export const GuestGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

// Admin-only access
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requiredRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

// Custom loading component for protected routes
export const ProtectedRouteWithCustomLoader: React.FC<ProtectedRouteProps & { 
  loadingComponent?: React.ReactNode 
}> = ({ loadingComponent, ...props }) => (
  <ProtectedRoute
    {...props}
    fallback={
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Loading Sleep Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Preparing your sleep tracking experience...
            </p>
          </div>
        </div>
      )
    }
  />
);

export default ProtectedRoute; 