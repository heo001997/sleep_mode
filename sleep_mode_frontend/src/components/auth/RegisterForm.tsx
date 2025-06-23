import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { RegisterCredentials } from '../../types';
import { validateEmail, validatePassword } from '../../utils';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    password_confirmation: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    // Password confirmation validation
    if (!credentials.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required';
    } else if (credentials.password !== credentials.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof RegisterCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear password confirmation error when password changes
    if (field === 'password' && errors.password_confirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: undefined }));
    }
  };

  // Handle input blur (for validation feedback)
  const handleInputBlur = (field: keyof RegisterCredentials) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate individual field on blur
    const newErrors: FormErrors = { ...errors };
    
    if (field === 'email') {
      if (!credentials.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(credentials.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }
    
    if (field === 'password') {
      if (!credentials.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordValidation = validatePassword(credentials.password);
        if (!passwordValidation.isValid) {
          newErrors.password = passwordValidation.message;
        } else {
          delete newErrors.password;
        }
      }
    }
    
    if (field === 'password_confirmation') {
      if (!credentials.password_confirmation) {
        newErrors.password_confirmation = 'Password confirmation is required';
      } else if (credentials.password !== credentials.password_confirmation) {
        newErrors.password_confirmation = 'Passwords do not match';
      } else {
        delete newErrors.password_confirmation;
      }
    }
    
    setErrors(newErrors);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      password_confirmation: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      await register(credentials);
      
      // Success callback
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (registerError) {
      // Error is handled by the AuthContext
      console.error('Registration failed:', registerError);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    let label = 'Very Weak';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength >= 4) label = 'Strong';
    else if (strength >= 3) label = 'Good';
    else if (strength >= 2) label = 'Fair';
    else if (strength >= 1) label = 'Weak';
    
    return { strength, label };
  };

  const passwordStrength = getPasswordStrength(credentials.password);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join Sleep Mode to track your sleep journey
          </p>
        </div>

        {/* General Error Message */}
        {(error || errors.general) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || errors.general}
            </p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={credentials.email}
              onChange={handleInputChange('email')}
              onBlur={handleInputBlur('email')}
              className={`input-field ${
                errors.email && touched.email ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={credentials.password}
                onChange={handleInputChange('password')}
                onBlur={handleInputBlur('password')}
                className={`input-field pr-10 ${
                  errors.password && touched.password ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Create a strong password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {credentials.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength >= 4
                          ? 'bg-green-500'
                          : passwordStrength.strength >= 3
                          ? 'bg-yellow-500'
                          : passwordStrength.strength >= 2
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
            
            {errors.password && touched.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Password Confirmation Field */}
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="password_confirmation"
                value={credentials.password_confirmation}
                onChange={handleInputChange('password_confirmation')}
                onBlur={handleInputBlur('password_confirmation')}
                className={`input-field pr-10 ${
                  errors.password_confirmation && touched.password_confirmation ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password_confirmation && touched.password_confirmation && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password_confirmation}
              </p>
            )}
          </div>

          {/* Terms and Privacy */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 