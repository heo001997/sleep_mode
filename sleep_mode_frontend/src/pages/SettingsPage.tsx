import React, { useState, useEffect } from 'react';
import { DashboardPageLayout } from '../components/layout';
import { TimePicker, type TimeValue } from '../components/common';
import { Switch } from '@headlessui/react';
import { settingsService, type UserSettings, type SleepScheduleSettings, type NotificationSettings } from '../services';
import {
  Cog6ToothIcon,
  ClockIcon,
  BellIcon,
  UserCircleIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
  SyncIcon,
  ArrowPathIcon,
  BellAlertIcon,
  DevicePhoneMobileIcon as PhoneIcon,
  EnvelopeIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import {
  Cog6ToothIcon as Cog6ToothIconSolid,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>;
}

interface SyncStatus {
  lastSync: Date | null;
  isConnected: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Local interfaces extending the imported types for compatibility
interface LocalNotificationSettings extends NotificationSettings {
  // All properties are inherited from the imported NotificationSettings type
}

interface ValidationErrors {
  sleepSchedule?: string;
  bedtime?: string;
  wakeTime?: string;
  notifications?: string;
  reminderTime?: string;
}

interface FormState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'sleep-schedule',
    title: 'Sleep Schedule',
    description: 'Configure bedtime, wake time, and sleep mode settings',
    icon: ClockIcon,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage notification preferences and timing',
    icon: BellIcon,
  },
  {
    id: 'app-settings',
    title: 'App Settings',
    description: 'Dark mode, theme preferences, and app behavior',
    icon: MoonIcon,
  },
  {
    id: 'sync-settings',
    title: 'Sync & Data',
    description: 'Data synchronization and backup settings',
    icon: SyncIcon,
  },
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Profile information and account management',
    icon: UserCircleIcon,
  },
  {
    id: 'device-settings',
    title: 'Device Integration',
    description: 'Mobile app connection and device-specific settings',
    icon: DevicePhoneMobileIcon,
  },
];

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('sleep-schedule');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isConnected: true,
    isLoading: false,
    hasError: false,
  });
  
  // Sleep schedule state
  const [bedtime, setBedtime] = useState<TimeValue>({ hour: 10, minute: 30, period: 'PM' });
  const [wakeTime, setWakeTime] = useState<TimeValue>({ hour: 7, minute: 0, period: 'AM' });
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>('12');
  const [sleepScheduleEnabled, setSleepScheduleEnabled] = useState(true);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    bedtimeReminders: true,
    wakeUpAlarms: true,
    sleepGoalAlerts: false,
    weeklyReports: true,
    appUpdates: false,
    soundEnabled: true,
    vibrationEnabled: true,
    doNotDisturb: false,
    reminderTime: 30, // 30 minutes before bedtime
  });

  // Form validation state
  const [formState, setFormState] = useState<FormState>({
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    errors: {},
  });

  // API loading states
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastSavedState, setLastSavedState] = useState<{
    sleepSchedule: SleepScheduleSettings;
    notifications: NotificationSettings;
  } | null>(null);

  // Reset and sync states
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetType, setResetType] = useState<'all' | 'sleep-schedule' | 'notifications' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        setApiError(null);
        
        const userSettings = await settingsService.getUserSettings();
        
        // Update sleep schedule state
        setSleepScheduleEnabled(userSettings.sleepSchedule.enabled);
        setBedtime(userSettings.sleepSchedule.bedtime);
        setWakeTime(userSettings.sleepSchedule.wakeTime);
        setTimeFormat(userSettings.sleepSchedule.timeFormat);
        
        // Update notification settings state
        setNotificationSettings(userSettings.notifications);
        
        // Store current state as last saved state for rollback
        setLastSavedState({
          sleepSchedule: userSettings.sleepSchedule,
          notifications: userSettings.notifications,
        });
        
      } catch (error) {
        console.error('Failed to load settings:', error);
        setApiError('Failed to load settings. Please refresh the page and try again.');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Validate form when relevant state changes
  useEffect(() => {
    if (formState.isDirty) {
      validateForm();
    }
  }, [sleepScheduleEnabled, bedtime, wakeTime, notificationSettings]);

  // Enhanced sync function using settings API
  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, isLoading: true, hasError: false }));
    setApiError(null);
    
    try {
      // Test settings connectivity
      await settingsService.testSettingsSync();
      
      // Reload settings from API
      const userSettings = await settingsService.getUserSettings();
      
      // Update local state with fresh data
      setSleepScheduleEnabled(userSettings.sleepSchedule.enabled);
      setBedtime(userSettings.sleepSchedule.bedtime);
      setWakeTime(userSettings.sleepSchedule.wakeTime);
      setTimeFormat(userSettings.sleepSchedule.timeFormat);
      setNotificationSettings(userSettings.notifications);
      
      // Update last saved state
      setLastSavedState({
        sleepSchedule: userSettings.sleepSchedule,
        notifications: userSettings.notifications,
      });
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        isConnected: true,
      }));
      
      // Clear dirty state since we have fresh data
      setFormState(prev => ({ ...prev, isDirty: false }));
      
    } catch (error: any) {
      console.error('Failed to sync settings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync settings';
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage,
      }));
      setApiError(errorMessage);
    }
  };

  // Reset settings functionality
  const handleResetSettings = async (type: 'all' | 'sleep-schedule' | 'notifications') => {
    setResetType(type);
    setShowResetConfirmation(true);
  };

  const confirmResetSettings = async () => {
    if (!resetType) return;
    
    setIsResetting(true);
    setApiError(null);
    
    try {
      if (resetType === 'all') {
        // Reset all settings
        const defaultSettings = await settingsService.resetSettings();
        
        // Update all local state
        setSleepScheduleEnabled(defaultSettings.sleepSchedule.enabled);
        setBedtime(defaultSettings.sleepSchedule.bedtime);
        setWakeTime(defaultSettings.sleepSchedule.wakeTime);
        setTimeFormat(defaultSettings.sleepSchedule.timeFormat);
        setNotificationSettings(defaultSettings.notifications);
        
        setLastSavedState({
          sleepSchedule: defaultSettings.sleepSchedule,
          notifications: defaultSettings.notifications,
        });
        
      } else {
        // Reset specific section by getting defaults and updating
        const defaultSettings = await settingsService.resetSettings();
        
        if (resetType === 'sleep-schedule') {
          await settingsService.updateSleepSchedule(defaultSettings.sleepSchedule);
          setSleepScheduleEnabled(defaultSettings.sleepSchedule.enabled);
          setBedtime(defaultSettings.sleepSchedule.bedtime);
          setWakeTime(defaultSettings.sleepSchedule.wakeTime);
          setTimeFormat(defaultSettings.sleepSchedule.timeFormat);
          
          setLastSavedState(prev => prev ? {
            ...prev,
            sleepSchedule: defaultSettings.sleepSchedule,
          } : null);
          
        } else if (resetType === 'notifications') {
          await settingsService.updateNotificationSettings(defaultSettings.notifications);
          setNotificationSettings(defaultSettings.notifications);
          
          setLastSavedState(prev => prev ? {
            ...prev,
            notifications: defaultSettings.notifications,
          } : null);
        }
      }
      
      // Clear dirty and error states
      setFormState(prev => ({ 
        ...prev, 
        isDirty: false, 
        errors: {} 
      }));
      
      console.log(`Successfully reset ${resetType} settings to defaults`);
      
    } catch (error: any) {
      console.error(`Failed to reset ${resetType} settings:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset settings';
      setApiError(errorMessage);
    } finally {
      setIsResetting(false);
      setShowResetConfirmation(false);
      setResetType(null);
    }
  };

  const cancelResetSettings = () => {
    setShowResetConfirmation(false);
    setResetType(null);
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.isLoading) {
      return <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (syncStatus.hasError) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }
    if (syncStatus.isConnected) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
  };

  // Validation functions
  const validateTimeValue = (timeValue: TimeValue | null, fieldName: string): string | null => {
    if (!timeValue) {
      return `${fieldName} is required`;
    }
    
    if (timeValue.hour < 1 || timeValue.hour > 12) {
      return `${fieldName} hour must be between 1 and 12`;
    }
    
    if (timeValue.minute < 0 || timeValue.minute > 59) {
      return `${fieldName} minute must be between 0 and 59`;
    }
    
    return null;
  };

  const validateSleepSchedule = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (sleepScheduleEnabled) {
      // Validate bedtime
      const bedtimeError = validateTimeValue(bedtime, 'Bedtime');
      if (bedtimeError) {
        errors.bedtime = bedtimeError;
      }
      
      // Validate wake time
      const wakeTimeError = validateTimeValue(wakeTime, 'Wake time');
      if (wakeTimeError) {
        errors.wakeTime = wakeTimeError;
      }
      
      // Validate sleep duration (should be reasonable)
      if (bedtime && wakeTime && !bedtimeError && !wakeTimeError) {
        const bedtimeMinutes = (bedtime.hour % 12) * 60 + bedtime.minute + (bedtime.period === 'PM' ? 12 * 60 : 0);
        const wakeTimeMinutes = (wakeTime.hour % 12) * 60 + wakeTime.minute + (wakeTime.period === 'PM' ? 12 * 60 : 0);
        
        let sleepDuration = wakeTimeMinutes - bedtimeMinutes;
        if (sleepDuration <= 0) {
          sleepDuration += 24 * 60; // Add 24 hours if wake time is next day
        }
        
        if (sleepDuration < 4 * 60) { // Less than 4 hours
          errors.sleepSchedule = 'Sleep duration should be at least 4 hours';
        } else if (sleepDuration > 12 * 60) { // More than 12 hours
          errors.sleepSchedule = 'Sleep duration should not exceed 12 hours';
        }
      }
    }
    
    return errors;
  };

  const validateNotificationSettings = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Validate reminder time
    if (notificationSettings.bedtimeReminders && 
        (notificationSettings.reminderTime < 5 || notificationSettings.reminderTime > 120)) {
      errors.reminderTime = 'Reminder time must be between 5 and 120 minutes';
    }
    
    // Check for conflicting settings
    if (notificationSettings.doNotDisturb && notificationSettings.bedtimeReminders) {
      errors.notifications = 'Do Not Disturb mode conflicts with bedtime reminders';
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const sleepErrors = validateSleepSchedule();
    const notificationErrors = validateNotificationSettings();
    
    const allErrors = { ...sleepErrors, ...notificationErrors };
    const isValid = Object.keys(allErrors).length === 0;
    
    setFormState(prev => ({
      ...prev,
      errors: allErrors,
      isValid,
    }));
    
    return isValid;
  };

  const markFormDirty = () => {
    setFormState(prev => ({ ...prev, isDirty: true }));
  };

  const resetValidation = () => {
    setFormState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  };

  // Enhanced event handlers with validation
  const handleBedtimeChange = (newBedtime: TimeValue) => {
    setBedtime(newBedtime);
    markFormDirty();
    // Validate after a short delay to avoid constant validation while typing
    setTimeout(() => validateForm(), 300);
  };

  const handleWakeTimeChange = (newWakeTime: TimeValue) => {
    setWakeTime(newWakeTime);
    markFormDirty();
    setTimeout(() => validateForm(), 300);
  };

  const handleSleepScheduleToggle = (enabled: boolean) => {
    setSleepScheduleEnabled(enabled);
    markFormDirty();
    if (!enabled) {
      resetValidation(); // Clear errors when disabled
    } else {
      setTimeout(() => validateForm(), 100);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean | number) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    markFormDirty();
    setTimeout(() => validateForm(), 300);
  };

  const handleSaveSettings = async (section: string) => {
    if (formState.isSubmitting) return;
    
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    setApiError(null);
    
    const isValid = validateForm();
    if (!isValid) {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      return;
    }
    
    // Store current state for potential rollback
    const currentState = {
      sleepSchedule: {
        enabled: sleepScheduleEnabled,
        bedtime,
        wakeTime,
        timeFormat,
      },
      notifications: notificationSettings,
    };
    
    try {
      let updatedSettings: UserSettings;
      
      if (section === 'sleep-schedule') {
        // Update sleep schedule via API
        const sleepScheduleUpdate = {
          enabled: sleepScheduleEnabled,
          bedtime,
          wakeTime,
          timeFormat,
        };
        
        await settingsService.updateSleepSchedule(sleepScheduleUpdate);
        // Get full updated settings
        updatedSettings = await settingsService.getUserSettings();
        
      } else if (section === 'notifications') {
        // Update notification settings via API
        await settingsService.updateNotificationSettings(notificationSettings);
        // Get full updated settings
        updatedSettings = await settingsService.getUserSettings();
        
      } else {
        throw new Error(`Unknown section: ${section}`);
      }
      
      // Update last saved state for future rollbacks
      setLastSavedState({
        sleepSchedule: updatedSettings.sleepSchedule,
        notifications: updatedSettings.notifications,
      });
      
      // Success feedback
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        isDirty: false,
      }));
      
      console.log(`Successfully saved ${section} settings`);
      
    } catch (error: any) {
      console.error(`Failed to save ${section} settings:`, error);
      
      // Rollback to last saved state
      if (lastSavedState) {
        setSleepScheduleEnabled(lastSavedState.sleepSchedule.enabled);
        setBedtime(lastSavedState.sleepSchedule.bedtime);
        setWakeTime(lastSavedState.sleepSchedule.wakeTime);
        setTimeFormat(lastSavedState.sleepSchedule.timeFormat);
        setNotificationSettings(lastSavedState.notifications);
      }
      
      // Set error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save settings. Please try again.';
      setApiError(errorMessage);
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { ...prev.errors, general: errorMessage },
      }));
    }
  };

  // Error display component
  const ErrorMessage: React.FC<{ error?: string }> = ({ error }) => {
    if (!error) return null;
    
    return (
      <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
        <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
        {error}
      </div>
    );
  };

  // Loading component
  const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center py-12">
      <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
      <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading settings...</span>
    </div>
  );

  // Reset confirmation modal
  const ResetConfirmationModal: React.FC = () => {
    if (!showResetConfirmation || !resetType) return null;

    const getResetTitle = () => {
      switch (resetType) {
        case 'all': return 'Reset All Settings';
        case 'sleep-schedule': return 'Reset Sleep Schedule';
        case 'notifications': return 'Reset Notifications';
        default: return 'Reset Settings';
      }
    };

    const getResetDescription = () => {
      switch (resetType) {
        case 'all': 
          return 'This will reset all your settings to their default values. All sleep schedule preferences, notification settings, and other customizations will be lost.';
        case 'sleep-schedule': 
          return 'This will reset your sleep schedule settings (bedtime, wake time, and time format) to their default values.';
        case 'notifications': 
          return 'This will reset all notification preferences to their default values.';
        default: 
          return 'This will reset the selected settings to their default values.';
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelResetSettings} />
          
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  {getResetTitle()}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getResetDescription()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={confirmResetSettings}
                disabled={isResetting}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
              >
                {isResetting ? (
                  <div className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  'Reset'
                )}
              </button>
              <button
                type="button"
                onClick={cancelResetSettings}
                disabled={isResetting}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'sleep-schedule':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Sleep Schedule Configuration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configure your bedtime and wake time preferences. These settings will sync with your mobile app.
              </p>
              
              {/* Schedule Enable Toggle */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Sleep Schedule
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable automatic sleep mode enforcement
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSleepScheduleToggle(!sleepScheduleEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      sleepScheduleEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sleepScheduleEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Time Format Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Time Format
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setTimeFormat('12')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      timeFormat === '12'
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    12-hour (AM/PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFormat('24')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      timeFormat === '24'
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    24-hour
                  </button>
                </div>
              </div>
              
              {/* Time Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <TimePicker
                    label="Bedtime"
                    value={bedtime}
                    onChange={handleBedtimeChange}
                    format={timeFormat}
                    disabled={!sleepScheduleEnabled}
                    placeholder="Select bedtime"
                  />
                  <ErrorMessage error={formState.errors.bedtime} />
                </div>
                <div>
                  <TimePicker
                    label="Wake Time"
                    value={wakeTime}
                    onChange={handleWakeTimeChange}
                    format={timeFormat}
                    disabled={!sleepScheduleEnabled}
                    placeholder="Select wake time"
                  />
                  <ErrorMessage error={formState.errors.wakeTime} />
                </div>
              </div>
              
              {/* Sleep Schedule Validation Error */}
              <ErrorMessage error={formState.errors.sleepSchedule} />
              
              {/* Sleep Duration Display */}
              {sleepScheduleEnabled && bedtime && wakeTime && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Sleep Duration
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Approximately 8-9 hours of sleep time
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => handleResetSettings('sleep-schedule')}
                  disabled={formState.isSubmitting || isResetting}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings('sleep-schedule')}
                  disabled={!sleepScheduleEnabled || formState.isSubmitting || !formState.isValid}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {formState.isSubmitting ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    'Save Sleep Schedule'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Notification Preferences
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage when and how you receive notifications from the Sleep Mode app.
              </p>
              
              {/* Sleep-related Notifications */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MoonIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Sleep Notifications
                  </h4>
                  <div className="space-y-4">
                    {/* Bedtime Reminders */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Bedtime Reminders
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Get notified {notificationSettings.reminderTime} minutes before bedtime
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.bedtimeReminders}
                        onChange={(value) => handleNotificationChange('bedtimeReminders', value)}
                        className={`${
                          notificationSettings.bedtimeReminders ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.bedtimeReminders ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Wake Up Alarms */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <BellAlertIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Wake Up Alarms
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Receive wake-up notifications and alarms
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.wakeUpAlarms}
                        onChange={(value) => handleNotificationChange('wakeUpAlarms', value)}
                        className={`${
                          notificationSettings.wakeUpAlarms ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.wakeUpAlarms ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Sleep Goal Alerts */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Sleep Goal Alerts
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Notifications about your sleep goals and achievements
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.sleepGoalAlerts}
                        onChange={(value) => handleNotificationChange('sleepGoalAlerts', value)}
                        className={`${
                          notificationSettings.sleepGoalAlerts ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.sleepGoalAlerts ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>

                {/* App Notifications */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                    App Notifications
                  </h4>
                  <div className="space-y-4">
                    {/* Weekly Reports */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Weekly Reports
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Receive weekly sleep analysis and progress reports
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyReports}
                        onChange={(value) => handleNotificationChange('weeklyReports', value)}
                        className={`${
                          notificationSettings.weeklyReports ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* App Updates */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <ArrowPathIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            App Updates
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Notifications about new features and app updates
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.appUpdates}
                        onChange={(value) => handleNotificationChange('appUpdates', value)}
                        className={`${
                          notificationSettings.appUpdates ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.appUpdates ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <SpeakerWaveIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Notification Behavior
                  </h4>
                  <div className="space-y-4">
                    {/* Sound Enabled */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <SpeakerWaveIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Sound Enabled
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Play notification sounds for alerts
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.soundEnabled}
                        onChange={(value) => handleNotificationChange('soundEnabled', value)}
                        className={`${
                          notificationSettings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Vibration Enabled */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Vibration Enabled
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enable vibration for mobile notifications
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.vibrationEnabled}
                        onChange={(value) => handleNotificationChange('vibrationEnabled', value)}
                        className={`${
                          notificationSettings.vibrationEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Do Not Disturb */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <MoonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Do Not Disturb
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Silence notifications during sleep hours
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.doNotDisturb}
                        onChange={(value) => handleNotificationChange('doNotDisturb', value)}
                        className={`${
                          notificationSettings.doNotDisturb ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            notificationSettings.doNotDisturb ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>

                {/* Reminder Timing */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Reminder Timing
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Bedtime Reminder Time
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={notificationSettings.reminderTime}
                        onChange={(e) => handleNotificationChange('reminderTime', parseInt(e.target.value))}
                        disabled={!notificationSettings.bedtimeReminders}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[80px]">
                        {notificationSettings.reminderTime} min
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      How many minutes before bedtime should we remind you?
                    </p>
                    <ErrorMessage error={formState.errors.reminderTime} />
                  </div>
                </div>

                {/* General notification errors */}
                <ErrorMessage error={formState.errors.notifications} />

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => handleResetSettings('notifications')}
                    disabled={formState.isSubmitting || isResetting}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    Reset to Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings('notifications')}
                    disabled={formState.isSubmitting || !formState.isValid}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {formState.isSubmitting ? (
                      <div className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      'Save Notification Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'app-settings':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MoonIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                App Preferences
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Customize the appearance and behavior of the Sleep Mode dashboard.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  Theme and app preference toggles will be implemented here
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'sync-settings':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <SyncIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Data Synchronization
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage how your sleep data synchronizes between devices and the cloud.
              </p>
              
              {/* Sync Status */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sync Status
                  </span>
                  <div className="flex items-center space-x-2">
                    {getSyncStatusIcon()}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {syncStatus.isLoading ? 'Syncing...' : 
                       syncStatus.hasError ? 'Error' : 
                       syncStatus.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last sync: {formatLastSync(syncStatus.lastSync)}
                  </span>
                  <button
                    onClick={handleSync}
                    disabled={syncStatus.isLoading}
                    className="px-3 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncStatus.isLoading ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
                {syncStatus.hasError && syncStatus.errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    {syncStatus.errorMessage}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  Sync preferences and data management options will be implemented here
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Account Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your account details and security settings.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  Account management forms will be implemented here
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'device-settings':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Device Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure how the dashboard connects with your mobile Sleep Mode app.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  Device connection and mobile app settings will be implemented here
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardPageLayout
      title="Settings"
      subtitle="Manage your Sleep Mode preferences and configuration"
      actions={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleResetSettings('all')}
            disabled={isLoadingSettings || isResetting || formState.isSubmitting}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Reset All
          </button>
          <button
            onClick={handleSync}
            disabled={syncStatus.isLoading || isLoadingSettings}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
            {syncStatus.isLoading ? 'Syncing...' : 'Sync Settings'}
          </button>
        </div>
      }
    >
      {/* Global API Error Display */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Settings Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingSettings ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Cog6ToothIconSolid className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                Settings Sections
              </h3>
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      disabled={formState.isSubmitting}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-2 border-primary-600 dark:border-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon 
                          className={`h-4 w-4 mr-3 flex-shrink-0 ${
                            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                          }`} 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{section.title}</p>
                          <p className={`text-xs truncate ${
                            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderSettingsContent()}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ResetConfirmationModal />
    </DashboardPageLayout>
  );
};

export default SettingsPage; 