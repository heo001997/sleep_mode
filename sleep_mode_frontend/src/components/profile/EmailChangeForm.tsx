import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { profileService, type UpdateEmailRequest } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

interface EmailChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface EmailFormData {
  newEmail: string;
  password: string;
}

interface EmailFormErrors {
  newEmail?: string;
  password?: string;
  form?: string;
}

// Email change states
enum EmailChangeState {
  Form = 'form',
  VerificationPending = 'verification_pending',
  Success = 'success',
}

export default function EmailChangeForm({
  onSuccess,
  onCancel,
  className = '',
}: EmailChangeFormProps) {
  const { user, refreshProfile } = useAuth();
  const [state, setState] = useState<EmailChangeState>(EmailChangeState.Form);
  const [formData, setFormData] = useState<EmailFormData>({
    newEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<EmailFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: EmailFormErrors = {};

    // Email validation
    if (!formData.newEmail.trim()) {
      newErrors.newEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    } else if (formData.newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      newErrors.newEmail = 'New email must be different from current email';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: keyof EmailFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear form error
    if (errors.form) {
      setErrors(prev => ({ ...prev, form: undefined }));
    }
  };

  // Handle email change submission
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      const emailData: UpdateEmailRequest = {
        email: formData.newEmail.trim(),
        password: formData.password,
      };

      const response = await profileService.updateEmail(emailData);
      
      if (response.requires_verification) {
        setPendingEmail(formData.newEmail);
        setState(EmailChangeState.VerificationPending);
      } else {
        // Email changed immediately (if verification not required)
        await refreshProfile();
        setState(EmailChangeState.Success);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Email change failed:', error);
      setErrors({
        form: error.response?.data?.message || error.message || 'Failed to change email. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      // Re-submit the email change request to resend verification
      await profileService.updateEmail({
        email: pendingEmail,
        password: formData.password,
      });
      // Show success message (you might want to add a state for this)
      alert('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Failed to resend verification:', error);
      setErrors({
        form: error.response?.data?.message || 'Failed to resend verification email. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Handle back to form
  const handleBackToForm = () => {
    setState(EmailChangeState.Form);
    setFormData({ newEmail: '', password: '' });
    setErrors({});
    setPendingEmail('');
  };

  // Render form state
  const renderFormState = () => (
    <form onSubmit={handleEmailChange} className="space-y-6">
      {/* Current Email Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Email
        </label>
        <div className="flex items-center">
          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-900 dark:text-white">
            {user?.email || 'No email set'}
          </span>
        </div>
      </div>

      {/* New Email Input */}
      <div>
        <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          New Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            id="newEmail"
            value={formData.newEmail}
            onChange={(e) => handleInputChange('newEmail', e.target.value)}
            placeholder="Enter new email address"
            autoComplete="email"
            className={`block w-full px-3 py-2 pl-10 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.newEmail 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.newEmail && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.newEmail}
          </p>
        )}
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
            placeholder="Enter your current password"
            autoComplete="current-password"
            className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.password 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Email Change Security
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• A verification email will be sent to your new email address</li>
              <li>• Your email will not change until you verify the new address</li>
              <li>• You will continue to receive notifications at your current email</li>
              <li>• If you don't verify within 24 hours, the request will expire</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errors.form}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Updating Email...
            </>
          ) : (
            <>
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Update Email
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Cancel
        </button>
      </div>
    </form>
  );

  // Render verification pending state
  const renderVerificationPending = () => (
    <div className="text-center space-y-6">
      {/* Pending Icon */}
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20">
        <ClockIcon className="h-10 w-10 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Verification Email Sent
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We've sent a verification email to:
        </p>
        <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-6">
          {pendingEmail}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
          Next Steps:
        </h4>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
          <li>Check your email inbox for a verification message</li>
          <li>Click the verification link in the email</li>
          <li>Your email address will be updated automatically</li>
          <li>You can close this window and continue using the app</li>
        </ol>
      </div>

      {/* Resend Option */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Didn't receive the email? Check your spam folder or:
        </p>
        <button
          onClick={handleResendVerification}
          disabled={isResending}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Resend Verification Email
            </>
          )}
        </button>
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errors.form}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBackToForm}
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors border border-gray-300 dark:border-gray-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Change Email Address
        </button>
        
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Render success state
  const renderSuccessState = () => (
    <div className="text-center py-8">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
        <CheckCircleIconSolid className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Email Updated Successfully
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Your email address has been changed to:
      </p>
      <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-6">
        {pendingEmail || formData.newEmail}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You will now receive all notifications at your new email address.
      </p>
    </div>
  );

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Change Email Address
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Update your email address for account notifications and login.
          </p>
        </div>

        {/* State-based Content */}
        {state === EmailChangeState.Form && renderFormState()}
        {state === EmailChangeState.VerificationPending && renderVerificationPending()}
        {state === EmailChangeState.Success && renderSuccessState()}
      </div>
    </div>
  );
} 