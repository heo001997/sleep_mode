import React, { useState } from 'react';
import {
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { profileService } from '../../services';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
}

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function ChangePasswordForm({
  onSuccess,
  onCancel,
  className = '',
}: ChangePasswordFormProps) {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Password validation logic
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === formData.confirmPassword,
    };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const confirmPasswordMatch = formData.newPassword === formData.confirmPassword;

  // Handle input changes
  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  // Handle input blur for validation
  const handleInputBlur = (field: keyof PasswordFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation display
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Validate form
    if (!formData.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet security requirements');
      return;
    }

    if (!confirmPasswordMatch) {
      setError('Password confirmation does not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Use real profileService
      await profileService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Password change failed:', error);
      setError(error.response?.data?.message || error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render password validation indicators
  const renderPasswordRequirements = () => {
    if (!formData.newPassword || !touched.newPassword) return null;

    const requirements = [
      { key: 'minLength', label: 'At least 8 characters', valid: passwordValidation.minLength },
      { key: 'hasUppercase', label: 'One uppercase letter', valid: passwordValidation.hasUppercase },
      { key: 'hasLowercase', label: 'One lowercase letter', valid: passwordValidation.hasLowercase },
      { key: 'hasNumber', label: 'One number', valid: passwordValidation.hasNumber },
      { key: 'hasSpecialChar', label: 'One special character', valid: passwordValidation.hasSpecialChar },
    ];

    return (
      <div className="mt-3 space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Password Requirements:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {requirements.map((req) => (
            <div key={req.key} className="flex items-center text-sm">
              {req.valid ? (
                <CheckCircleIconSolid className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 rounded-full mr-2 flex-shrink-0" />
              )}
              <span className={req.valid ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Input field component
  const PasswordInput = ({
    label,
    field,
    placeholder,
    autoComplete,
  }: {
    label: string;
    field: keyof PasswordFormData;
    placeholder: string;
    autoComplete: string;
  }) => {
    const showPassword = showPasswords[field as keyof typeof showPasswords];
    const hasError = touched[field] && (
      field === 'currentPassword' ? !formData[field] :
      field === 'newPassword' ? !isPasswordValid :
      field === 'confirmPassword' ? !confirmPasswordMatch : false
    );

    return (
      <div>
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id={field}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            onBlur={() => handleInputBlur(field)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors ${
              hasError
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility(field as keyof typeof showPasswords)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center ${className}`}>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircleIconSolid className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Password Changed Successfully
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your password has been updated. Please use your new password for future logins.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 mr-3">
          <KeyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Change Password
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Password Change Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <PasswordInput
          label="Current Password"
          field="currentPassword"
          placeholder="Enter your current password"
          autoComplete="current-password"
        />

        {/* New Password */}
        <div>
          <PasswordInput
            label="New Password"
            field="newPassword"
            placeholder="Enter your new password"
            autoComplete="new-password"
          />
          {renderPasswordRequirements()}
        </div>

        {/* Confirm New Password */}
        <div>
          <PasswordInput
            label="Confirm New Password"
            field="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
          {touched.confirmPassword && formData.confirmPassword && !confirmPasswordMatch && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Passwords do not match
            </p>
          )}
          {touched.confirmPassword && formData.confirmPassword && confirmPasswordMatch && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircleIconSolid className="h-4 w-4 mr-1" />
              Passwords match
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Password Security Tips
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Use a unique password that you don't use elsewhere</li>
            <li>• Consider using a password manager</li>
            <li>• Avoid personal information like names or birthdays</li>
            <li>• Update your password regularly</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting || !formData.currentPassword || !isPasswordValid || !confirmPasswordMatch}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <KeyIcon className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 