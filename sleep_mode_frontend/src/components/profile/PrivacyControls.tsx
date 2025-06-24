import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  ClockIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { profileService, type PrivacySettings } from '../../services';

interface PrivacyControlsProps {
  className?: string;
}

interface PrivacyFormData {
  profile_visibility: 'public' | 'private' | 'friends_only';
  activity_visibility: 'public' | 'private' | 'friends_only';
  data_sharing_analytics: boolean;
  data_sharing_marketing: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  data_retention_period: number; // days
}

interface PrivacyControlsState {
  settings: PrivacySettings | null;
  formData: PrivacyFormData;
  isLoading: boolean;
  isSaving: boolean;
  isExporting: boolean;
  error: string | null;
  successMessage: string | null;
}

export default function PrivacyControls({ className = '' }: PrivacyControlsProps) {
  const [state, setState] = useState<PrivacyControlsState>({
    settings: null,
    formData: {
      profile_visibility: 'private',
      activity_visibility: 'private',
      data_sharing_analytics: false,
      data_sharing_marketing: false,
      email_notifications: true,
      push_notifications: true,
      data_retention_period: 365,
    },
    isLoading: true,
    isSaving: false,
    isExporting: false,
    error: null,
    successMessage: null,
  });

  // Load privacy settings
  const loadPrivacySettings = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const settings = await profileService.getPrivacySettings();
      
      setState(prev => ({
        ...prev,
        settings,
        formData: {
          profile_visibility: settings.profile_visibility,
          activity_visibility: settings.activity_visibility,
          data_sharing_analytics: settings.data_sharing_analytics,
          data_sharing_marketing: settings.data_sharing_marketing,
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          data_retention_period: settings.data_retention_period,
        },
        isLoading: false,
      }));
      
    } catch (error: any) {
      console.error('Failed to load privacy settings:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load privacy settings. Please try again.',
        isLoading: false,
      }));
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  // Handle form changes
  const handleFormChange = (field: keyof PrivacyFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
    }));
  };

  // Save privacy settings
  const handleSave = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null, successMessage: null }));
      
      await profileService.updatePrivacySettings(state.formData);
      
      setState(prev => ({
        ...prev,
        successMessage: 'Privacy settings updated successfully!',
        isSaving: false,
      }));
      
      // Clear success message after delay
      setTimeout(() => {
        setState(prev => ({ ...prev, successMessage: null }));
      }, 5000);
      
    } catch (error: any) {
      console.error('Failed to update privacy settings:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to update privacy settings. Please try again.',
        isSaving: false,
      }));
    }
  };

  // Export user data
  const handleDataExport = async () => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));
      
      const blob = await profileService.exportUserData();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setState(prev => ({
        ...prev,
        successMessage: 'User data exported successfully!',
        isExporting: false,
      }));
      
      // Clear success message after delay
      setTimeout(() => {
        setState(prev => ({ ...prev, successMessage: null }));
      }, 5000);
      
    } catch (error: any) {
      console.error('Failed to export user data:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to export user data. Please try again.',
        isExporting: false,
      }));
    }
  };

  // Render visibility option
  const renderVisibilityOption = (
    field: 'profile_visibility' | 'activity_visibility',
    title: string,
    description: string
  ) => {
    const value = state.formData[field];
    
    const options = [
      {
        value: 'public',
        label: 'Public',
        description: 'Visible to everyone',
        icon: GlobeAltIcon,
        color: 'text-green-600 dark:text-green-400',
      },
      {
        value: 'friends_only',
        label: 'Friends Only',
        description: 'Visible to your friends',
        icon: UserGroupIcon,
        color: 'text-blue-600 dark:text-blue-400',
      },
      {
        value: 'private',
        label: 'Private',
        description: 'Visible only to you',
        icon: LockClosedIcon,
        color: 'text-gray-600 dark:text-gray-400',
      },
    ];

    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        
        <div className="space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleFormChange(field, option.value)}
                className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`flex-shrink-0 ${option.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className={`text-sm font-medium ${
                    isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </p>
                  <p className={`text-xs ${
                    isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircleIconSolid className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render toggle option
  const renderToggleOption = (
    field: keyof PrivacyFormData,
    title: string,
    description: string,
    icon: React.ComponentType<any>
  ) => {
    const Icon = icon;
    const value = state.formData[field] as boolean;
    
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <button
              onClick={() => handleFormChange(field, !value)}
              className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
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
            <ShieldCheckIcon className="h-6 w-6 mr-3 text-primary-600 dark:text-primary-400" />
            Privacy & Data Controls
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your privacy settings, data sharing preferences, and account visibility.
          </p>
        </div>

        {/* Success Message */}
        {state.successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIconSolid className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Success
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {state.successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {state.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {state.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading privacy settings...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Visibility Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Visibility Settings
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderVisibilityOption(
                  'profile_visibility',
                  'Profile Visibility',
                  'Control who can see your profile information'
                )}
                {renderVisibilityOption(
                  'activity_visibility',
                  'Activity Visibility',
                  'Control who can see your sleep activity and statistics'
                )}
              </div>
            </div>

            {/* Data Sharing Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Data Sharing Preferences
              </h3>
              
              <div className="space-y-6">
                {renderToggleOption(
                  'data_sharing_analytics',
                  'Analytics Data Sharing',
                  'Allow anonymous usage data to help improve the application',
                  InformationCircleIcon
                )}
                {renderToggleOption(
                  'data_sharing_marketing',
                  'Marketing Data Sharing',
                  'Allow data to be used for personalized marketing and recommendations',
                  InformationCircleIcon
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Notification Preferences
              </h3>
              
              <div className="space-y-6">
                {renderToggleOption(
                  'email_notifications',
                  'Email Notifications',
                  'Receive important updates and notifications via email',
                  InformationCircleIcon
                )}
                {renderToggleOption(
                  'push_notifications',
                  'Push Notifications',
                  'Receive real-time notifications on your device',
                  InformationCircleIcon
                )}
              </div>
            </div>

            {/* Data Retention Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Data Retention
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Retention Period: {state.formData.data_retention_period} days
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="730"
                    step="30"
                    value={state.formData.data_retention_period}
                    onChange={(e) => handleFormChange('data_retention_period', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>30 days</span>
                    <span>2 years</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How long we keep your activity data. Older data will be automatically deleted.
                </p>
              </div>
            </div>

            {/* Data Export */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export Your Data
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Download a copy of all your personal data including profile information, sleep sessions, and activity history.
              </p>
              <button
                onClick={handleDataExport}
                disabled={state.isExporting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.isExporting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </button>
            </div>

            {/* Save Changes */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={loadPrivacySettings}
                disabled={state.isSaving}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={state.isSaving}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.isSaving ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
            Privacy Information
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Your privacy settings are applied immediately after saving</li>
            <li>• Data export includes all your personal information in JSON format</li>
            <li>• Analytics data helps us improve the application but remains anonymous</li>
            <li>• You can change these settings at any time</li>
            <li>• Deleting your account will permanently remove all data</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 