import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon as ExclamationTriangleIconSolid } from '@heroicons/react/24/solid';
import { profileService } from '../../services';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  userEmail?: string;
  className?: string;
}

interface DeletionFormData {
  password: string;
  confirmationText: string;
  reason: string;
  dataExportRequested: boolean;
}

// Deletion steps
enum DeletionStep {
  Warning = 'warning',
  Confirmation = 'confirmation',
  Password = 'password',
  Processing = 'processing',
  Success = 'success',
}

// Deletion reasons
const DELETION_REASONS = [
  { value: 'not_using', label: 'Not using the app anymore' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'temporary_break', label: 'Taking a temporary break' },
  { value: 'other', label: 'Other (please specify)' },
];

export default function AccountDeletionModal({
  isOpen,
  onClose,
  onDeleted,
  userEmail = '',
  className = '',
}: AccountDeletionModalProps) {
  const [currentStep, setCurrentStep] = useState<DeletionStep>(DeletionStep.Warning);
  const [formData, setFormData] = useState<DeletionFormData>({
    password: '',
    confirmationText: '',
    reason: '',
    dataExportRequested: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  // Required confirmation text
  const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

  // Reset modal state when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(DeletionStep.Warning);
      setFormData({
        password: '',
        confirmationText: '',
        reason: '',
        dataExportRequested: false,
      });
      setShowPassword(false);
      setIsSubmitting(false);
      setError(null);
      setCustomReason('');
    }
  }, [isOpen]);

  // Handle form input changes
  const handleInputChange = (field: keyof DeletionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle data export request
  const handleDataExport = async () => {
    try {
      setIsSubmitting(true);
      await profileService.requestDataExport();
      handleInputChange('dataExportRequested', true);
      // Show success message
      alert('Data export request submitted. You will receive an email with your data within 24 hours.');
    } catch (error: any) {
      console.error('Data export failed:', error);
      setError(error.response?.data?.message || 'Failed to request data export. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    try {
      setIsSubmitting(true);
      setCurrentStep(DeletionStep.Processing);
      setError(null);

      const deletionReason = formData.reason === 'other' ? customReason : formData.reason;

      await profileService.deleteAccount(formData.password, deletionReason);
      
      setCurrentStep(DeletionStep.Success);
      
      // Call deletion callback after a short delay
      setTimeout(() => {
        onDeleted?.();
        onClose();
      }, 3000);
      
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      setError(error.response?.data?.message || error.message || 'Failed to delete account. Please try again.');
      setCurrentStep(DeletionStep.Password);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    switch (currentStep) {
      case DeletionStep.Warning:
        setCurrentStep(DeletionStep.Confirmation);
        break;
      case DeletionStep.Confirmation:
        setCurrentStep(DeletionStep.Password);
        break;
      case DeletionStep.Password:
        handleAccountDeletion();
        break;
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    switch (currentStep) {
      case DeletionStep.Confirmation:
        setCurrentStep(DeletionStep.Warning);
        break;
      case DeletionStep.Password:
        setCurrentStep(DeletionStep.Confirmation);
        break;
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case DeletionStep.Warning:
        return true;
      case DeletionStep.Confirmation:
        return formData.reason && 
               (formData.reason !== 'other' || customReason.trim().length > 0);
      case DeletionStep.Password:
        return formData.password.length > 0 && 
               formData.confirmationText === CONFIRMATION_TEXT;
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case DeletionStep.Warning:
        return (
          <div className="space-y-6">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
              <ExclamationTriangleIconSolid className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            {/* Warning Content */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Delete Your Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. Please review what will happen when you delete your account.
              </p>
            </div>

            {/* Data Loss Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
                What will be permanently deleted:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  All your sleep session data and history
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Your profile information and settings
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  All stored preferences and customizations
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Account statistics and achievements
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Any connected device data and sync history
                </li>
              </ul>
            </div>

            {/* Data Export Option */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Export Your Data
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Before deleting your account, you can export your data to keep a local copy.
                  </p>
                  {formData.dataExportRequested ? (
                    <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Data export requested. Check your email for the download link.
                    </div>
                  ) : (
                    <button
                      onClick={handleDataExport}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Request Data Export
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case DeletionStep.Confirmation:
        return (
          <div className="space-y-6">
            {/* Step Header */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tell Us Why You're Leaving
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your feedback helps us improve our service.
              </p>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Reason for deletion (optional)
              </label>
              <div className="space-y-2">
                {DELETION_REASONS.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="deletion_reason"
                      value={reason.value}
                      checked={formData.reason === reason.value}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-white">
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom reason input */}
              {formData.reason === 'other' && (
                <div className="mt-3">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please tell us more..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Final Warning */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Last Chance to Reconsider
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Once deleted, your account and all data cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case DeletionStep.Password:
        return (
          <div className="space-y-6">
            {/* Step Header */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Final Confirmation Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your password and confirmation text to proceed.
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmation Text Input */}
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="font-bold text-red-600 dark:text-red-400">"{CONFIRMATION_TEXT}"</span> to confirm
              </label>
              <input
                type="text"
                id="confirmation"
                value={formData.confirmationText}
                onChange={(e) => handleInputChange('confirmationText', e.target.value)}
                placeholder={CONFIRMATION_TEXT}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {formData.confirmationText && formData.confirmationText !== CONFIRMATION_TEXT && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Confirmation text does not match. Please type exactly: {CONFIRMATION_TEXT}
                </p>
              )}
            </div>

            {/* Final Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIconSolid className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    This action is irreversible
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Your account <strong>{userEmail}</strong> and all associated data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case DeletionStep.Processing:
        return (
          <div className="text-center py-8">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Deleting Your Account
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we process your request...
            </p>
          </div>
        );

      case DeletionStep.Success:
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Account Deleted Successfully
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your account and all associated data have been permanently removed.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thank you for using Sleep Mode. You will be logged out shortly.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: DeletionStep.Warning, label: 'Warning' },
      { key: DeletionStep.Confirmation, label: 'Confirmation' },
      { key: DeletionStep.Password, label: 'Verification' },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : isCompleted 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400 font-medium' 
                  : isCompleted 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="ml-4 h-px w-12 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all ${className}`}>
                {/* Header */}
                {currentStep !== DeletionStep.Processing && currentStep !== DeletionStep.Success && (
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h2" className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                      Delete Account
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                )}

                {/* Step Indicator */}
                {currentStep !== DeletionStep.Processing && currentStep !== DeletionStep.Success && (
                  renderStepIndicator()
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                {renderStepContent()}

                {/* Footer Actions */}
                {currentStep !== DeletionStep.Processing && currentStep !== DeletionStep.Success && (
                  <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {/* Primary Action */}
                    <button
                      onClick={handleNextStep}
                      disabled={!isStepValid() || isSubmitting}
                      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        currentStep === DeletionStep.Password
                          ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                          : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : currentStep === DeletionStep.Password ? (
                        <>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete My Account
                        </>
                      ) : (
                        'Continue'
                      )}
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex gap-3">
                      {currentStep !== DeletionStep.Warning && (
                        <button
                          onClick={handlePreviousStep}
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
                        >
                          Back
                        </button>
                      )}
                      
                      <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 