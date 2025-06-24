import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  TrashIcon,
  UserCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { profileService, type ProfileActivityItem } from '../../services';

interface ActivityLogProps {
  className?: string;
}

interface ActivityLogState {
  activities: ProfileActivityItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
  isLoading: boolean;
  error: string | null;
}

export default function ActivityLog({ className = '' }: ActivityLogProps) {
  const [state, setState] = useState<ActivityLogState>({
    activities: [],
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 0,
      per_page: 20,
    },
    isLoading: true,
    error: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Load activity log
  const loadActivityLog = async (page = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await profileService.getActivityLog(page, 20);
      
      setState(prev => ({
        ...prev,
        activities: response.activities,
        pagination: response.pagination,
        isLoading: false,
      }));
      
      setCurrentPage(page);
      
    } catch (error: any) {
      console.error('Failed to load activity log:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load activity log. Please try again.',
        isLoading: false,
      }));
    }
  };

  // Load activity log on component mount
  useEffect(() => {
    loadActivityLog(1);
  }, []);

  // Get activity icon
  const getActivityIcon = (type: ProfileActivityItem['type']) => {
    switch (type) {
      case 'login':
        return DevicePhoneMobileIcon;
      case 'password_change':
        return KeyIcon;
      case 'email_change':
        return EnvelopeIcon;
      case 'profile_update':
        return UserCircleIcon;
      case 'account_deletion':
        return TrashIcon;
      default:
        return CalendarIcon;
    }
  };

  // Get activity color
  const getActivityColor = (type: ProfileActivityItem['type'], status: ProfileActivityItem['status']) => {
    if (status === 'failed') return 'text-red-600 dark:text-red-400';
    if (status === 'pending') return 'text-yellow-600 dark:text-yellow-400';
    
    switch (type) {
      case 'login':
        return 'text-green-600 dark:text-green-400';
      case 'password_change':
        return 'text-blue-600 dark:text-blue-400';
      case 'email_change':
        return 'text-purple-600 dark:text-purple-400';
      case 'profile_update':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'account_deletion':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ProfileActivityItem['status']) => {
    switch (status) {
      case 'success':
        return CheckCircleIcon;
      case 'failed':
        return XCircleIcon;
      case 'pending':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString()}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString()}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get device icon
  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return ComputerDesktopIcon;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return DevicePhoneMobileIcon;
    }
    return ComputerDesktopIcon;
  };

  // Render activity item
  const renderActivityItem = (activity: ProfileActivityItem) => {
    const Icon = getActivityIcon(activity.type);
    const StatusIcon = getStatusIcon(activity.status);
    const DeviceIcon = getDeviceIcon(activity.user_agent);
    const colorClass = getActivityColor(activity.type, activity.status);

    return (
      <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-4">
          {/* Activity Icon */}
          <div className={`flex-shrink-0 ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {/* Activity Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatTimestamp(activity.timestamp)}
                  </p>
                  {activity.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {activity.location}
                    </p>
                  )}
                </div>
                
                {/* Device and IP Info */}
                <div className="flex items-center space-x-4 mt-2">
                  {activity.user_agent && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <DeviceIcon className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-48">
                        {activity.user_agent.split(' ')[0]}
                      </span>
                    </div>
                  )}
                  {activity.ip_address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      IP: {activity.ip_address}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Status Icon */}
              <div className={`flex-shrink-0 ml-4 ${
                activity.status === 'success' ? 'text-green-600 dark:text-green-400' :
                activity.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                <StatusIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render pagination
  const renderPagination = () => {
    const { current_page, total_pages } = state.pagination;
    
    if (total_pages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, current_page - Math.floor(showPages / 2));
    let endPage = Math.min(total_pages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Showing page {current_page} of {total_pages} ({state.pagination.total_items} total activities)
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => loadActivityLog(current_page - 1)}
            disabled={current_page <= 1 || state.isLoading}
            className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          
          {/* Page Numbers */}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => loadActivityLog(page)}
              disabled={state.isLoading}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${
                page === current_page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          ))}
          
          {/* Next Button */}
          <button
            onClick={() => loadActivityLog(current_page + 1)}
            disabled={current_page >= total_pages || state.isLoading}
            className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-3 text-primary-600 dark:text-primary-400" />
            Account Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View your recent account activity and login history for security monitoring.
          </p>
        </div>

        {/* Loading State */}
        {state.isLoading && (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading activity...</span>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Activity
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {state.error}
                </p>
              </div>
            </div>
            <button
              onClick={() => loadActivityLog(currentPage)}
              className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        )}

        {/* Activity List */}
        {!state.isLoading && !state.error && (
          <>
            {state.activities.length > 0 ? (
              <div className="space-y-4">
                {state.activities.map(renderActivityItem)}
                {renderPagination()}
              </div>
            ) : (
              <div className="text-center py-12">
                <EyeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No Activity Found
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  No account activity has been recorded yet.
                </p>
              </div>
            )}
          </>
        )}

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Security Notice
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Activity logs help you monitor unauthorized access to your account</li>
            <li>• Review login activities regularly and report suspicious activity</li>
            <li>• Activities are retained for 90 days for security purposes</li>
            <li>• Failed login attempts may indicate someone is trying to access your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 