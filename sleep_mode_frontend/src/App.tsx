import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { AppErrorBoundary, ToastProvider } from './components/common';
import { errorLoggingService } from './services/errorLoggingService';
import { router } from './router';
import './App.css'

function App() {
  // Initialize error logging service
  useEffect(() => {
    errorLoggingService.initialize({
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      buildVersion: process.env.REACT_APP_VERSION || '1.0.0',
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      apiEndpoint: process.env.REACT_APP_ERROR_REPORTING_ENDPOINT,
      apiKey: process.env.REACT_APP_ERROR_REPORTING_API_KEY,
    });

    // Cleanup on unmount
    return () => {
      errorLoggingService.dispose();
    };
  }, []);

  // Initialize theme on app start
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        initializeTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <AppErrorBoundary>
      <ErrorProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </ErrorProvider>
    </AppErrorBoundary>
  );
}

export default App
