import React, { useState, useEffect } from 'react';
import { DashboardPageLayout } from '../components/layout';
import { authService } from '../services';
import type { User } from '../types';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  KeyIcon,
  TrashIcon,
  ShieldCheckIcon,
  EyeIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  PhotoIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  UserCircleIcon as UserCircleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from '@heroicons/react/24/solid';

// Extended User interface for profile display
interface ExtendedUser extends User {
  name?: string;
  phone?: string;
  timezone?: string;
  avatar_url?: string;
  email_verified_at?: string;
  last_login_at?: string;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    sleep_goal_hours?: number;
    bedtime_reminder?: boolean;
    wake_up_reminder?: boolean;
  };
}

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant?: 'default' | 'danger';
}

export default function ProfilePage() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get user from storage first, then fetch from API
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser as ExtendedUser);
        }
        
        // Fetch fresh data from API
        const freshUser = await authService.getProfile();
        setUser(freshUser as ExtendedUser);
        
      } catch (error: any) {
        console.error('Failed to load user profile:', error);
        setError(error.response?.data?.message || 'Failed to load profile. Please try again.');
        
        // Fallback to stored user data if API fails
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser as ExtendedUser);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Profile sections configuration
  const profileSections: ProfileSection[] = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Update your basic profile information and preferences',
      icon: UserCircleIcon,
      action: () => setActiveSection('personal-info'),
    },
    {
      id: 'change-password',
      title: 'Change Password',
      description: 'Update your account password for better security',
      icon: KeyIcon,
      action: () => setActiveSection('change-password'),
    },
    {
      id: 'profile-picture',
      title: 'Profile Picture',
      description: 'Upload or update your profile picture',
      icon: PhotoIcon,
      action: () => setActiveSection('profile-picture'),
    },
    {
      id: 'email-settings',
      title: 'Email Settings',
      description: 'Manage your email address and verification status',
      icon: EnvelopeIcon,
      action: () => setActiveSection('email-settings'),
    },
    {
      id: 'activity-log',
      title: 'Account Activity',
      description: 'View your recent account activity and login history',
      icon: CalendarIcon,
      action: () => setActiveSection('activity-log'),
    },
    {
      id: 'privacy-controls',
      title: 'Privacy & Data',
      description: 'Manage your privacy settings and data preferences',
      icon: ShieldCheckIcon,
      action: () => setActiveSection('privacy-controls'),
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      description: 'Permanently delete your account and all associated data',
      icon: TrashIcon,
      action: () => setActiveSection('delete-account'),
      variant: 'danger',
    },
  ];

  // Quick stats for profile overview
  const getQuickStats = () => {
    if (!user) return [];
    
    return [
      {
        label: 'Account Created',
        value: new Date(user.created_at).toLocaleDateString(),
        icon: CalendarIcon,
      },
      {
        label: 'Last Login',
        value: user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Unknown',
        icon: ClockIcon,
      },
      {
        label: 'Email Status',
        value: user.email_verified_at ? 'Verified' : 'Unverified',
        icon: user.email_verified_at ? CheckCircleIconSolid : ExclamationTriangleIcon,
        status: user.email_verified_at ? 'success' : 'warning',
      },
    ];
  };

  // Profile overview section
  const renderProfileOverview = () => {
    if (!user) return null;

    const quickStats = getQuickStats();

    return (
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || user.email}
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 border-4 border-primary-100 dark:border-primary-900 flex items-center justify-center">
                  <UserCircleIconSolid className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {user.name || 'No Name Set'}
                </h2>
                {user.email_verified_at && (
                  <div className="flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                    <CheckCircleIconSolid className="h-3 w-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              {user.phone && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                  <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                  {user.phone}
                </p>
              )}
              {user.timezone && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {user.timezone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${
                    stat.status === 'success' ? 'text-green-600 dark:text-green-400' :
                    stat.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {stat.label}
                    </p>
                    <p className={`text-sm truncate ${
                      stat.status === 'success' ? 'text-green-600 dark:text-green-400' :
                      stat.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Profile Management Sections */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Profile Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileSections.map((section) => {
              const Icon = section.icon;
              const isDanger = section.variant === 'danger';
              
              return (
                <button
                  key={section.id}
                  onClick={section.action}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    isDanger
                      ? 'border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 ${
                      isDanger ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h4 className={`text-sm font-medium ${
                        isDanger ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {section.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isDanger ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {section.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Placeholder for other sections
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderProfileOverview();
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20">
              <Cog6ToothIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Feature Coming Soon
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This feature is currently under development and will be available soon.
            </p>
            <button
              onClick={() => setActiveSection('overview')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardPageLayout
        title="Profile"
        subtitle="Manage your account information and preferences"
      >
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
          <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading profile...</span>
        </div>
      </DashboardPageLayout>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <DashboardPageLayout
        title="Profile"
        subtitle="Manage your account information and preferences"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Unable to Load Profile
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Profile"
      subtitle="Manage your account information and preferences"
      actions={
        activeSection !== 'overview' ? (
          <button
            onClick={() => setActiveSection('overview')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Back to Overview
          </button>
        ) : undefined
      }
    >
      {/* Global Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Profile Warning
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderSectionContent()}
    </DashboardPageLayout>
  );
} 