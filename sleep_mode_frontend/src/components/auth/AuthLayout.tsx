import React from 'react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showThemeToggle?: boolean;
  backgroundVariant?: 'gradient' | 'solid' | 'pattern';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
  showThemeToggle = true,
  backgroundVariant = 'gradient',
}) => {
  // Theme toggle functionality (simplified - in real app would use theme context)
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Background classes based on variant
  const getBackgroundClasses = () => {
    switch (backgroundVariant) {
      case 'gradient':
        return 'bg-gradient-to-br from-primary-50 via-primary-100 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900';
      case 'pattern':
        return 'bg-gray-50 dark:bg-gray-900 bg-pattern-dots bg-pattern-primary-100 dark:bg-pattern-gray-800';
      case 'solid':
      default:
        return 'bg-light dark:bg-dark';
    }
  };

  return (
    <div className={`min-h-screen flex ${getBackgroundClasses()}`}>
      {/* Left Side - Branding/Info Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-primary-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl mr-3">
                <MoonIcon className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Sleep Mode</h1>
            </div>
            
            {/* Welcome Message */}
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to Better Sleep
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Track your sleep patterns, improve your rest quality, and wake up refreshed every day.
            </p>
            
            {/* Features List */}
            <div className="space-y-4">
              {[
                'Track sleep duration and quality',
                'Analyze sleep patterns over time',
                'Get personalized insights',
                'Set sleep goals and reminders'
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-primary-100">
                  <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Mobile Logo */}
            {showLogo && (
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mr-3">
                  <MoonIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sleep Mode</h1>
              </div>
            )}

            {/* Title and Subtitle */}
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {/* Auth Form Content */}
          <div className="relative">
            {children}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/help" className="hover:text-primary-600 dark:hover:text-primary-400">
                Help Center
              </Link>
              <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">
                Terms of Service
              </Link>
            </div>
            <p className="mt-4 text-xs">
              © 2024 Sleep Mode. All rights reserved.
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        {showThemeToggle && (
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized layouts for different auth pages

export const LoginLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthLayout
    title="Welcome Back"
    subtitle="Sign in to your Sleep Mode account"
    backgroundVariant="gradient"
  >
    {children}
  </AuthLayout>
);

export const RegisterLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthLayout
    title="Create Account"
    subtitle="Join Sleep Mode to start tracking your sleep"
    backgroundVariant="gradient"
  >
    {children}
  </AuthLayout>
);

export const ForgotPasswordLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthLayout
    title="Reset Password"
    subtitle="Enter your email to receive a password reset link"
    backgroundVariant="solid"
  >
    {children}
  </AuthLayout>
);

// Minimal layout for embedded auth forms
export const MinimalAuthLayout: React.FC<{ 
  children: React.ReactNode;
  title?: string;
}> = ({ children, title }) => (
  <div className="w-full max-w-md mx-auto p-6">
    {title && (
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
    )}
    {children}
  </div>
);

export default AuthLayout; 