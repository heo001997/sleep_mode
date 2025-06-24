import React, { useState, useRef, useCallback } from 'react';
import {
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { profileService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

interface ProfilePictureUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface ImagePreview {
  file: File;
  url: string;
}

interface UploadErrors {
  file?: string;
  upload?: string;
}

export default function ProfilePictureUpload({
  onSuccess,
  onCancel,
  className = '',
}: ProfilePictureUploadProps) {
  const { user, refreshProfile } = useAuth();
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<UploadErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation constants
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MIN_DIMENSIONS = { width: 150, height: 150 };
  const RECOMMENDED_DIMENSIONS = { width: 400, height: 400 };

  // Validate image file
  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const newErrors: UploadErrors = {};

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.file = 'Please select a valid image file (JPEG, PNG, or WebP)';
        setErrors(newErrors);
        resolve(false);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        newErrors.file = 'Image file size must be less than 5MB';
        setErrors(newErrors);
        resolve(false);
        return;
      }

      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < MIN_DIMENSIONS.width || img.height < MIN_DIMENSIONS.height) {
          newErrors.file = `Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} pixels`;
          setErrors(newErrors);
          resolve(false);
        } else {
          setErrors({});
          resolve(true);
        }
      };
      img.onerror = () => {
        newErrors.file = 'Invalid image file. Please try another file.';
        setErrors(newErrors);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setErrors({});
    setSuccessMessage(null);

    const isValid = await validateFile(file);
    if (!isValid) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
  }, []);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Clear preview
  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    setErrors({});
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload profile picture
  const handleUpload = async () => {
    if (!preview) return;

    try {
      setIsUploading(true);
      setErrors({});

      const response = await profileService.uploadProfilePicture(preview.file);
      
      // Refresh user profile to get updated avatar
      await refreshProfile();
      
      setSuccessMessage('Profile picture updated successfully!');
      clearPreview();
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Profile picture upload failed:', error);
      setErrors({
        upload: error.response?.data?.message || error.message || 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete profile picture
  const handleDelete = async () => {
    if (!user?.avatar_url) return;

    try {
      setIsDeleting(true);
      setErrors({});

      await profileService.deleteProfilePicture();
      
      // Refresh user profile to remove avatar
      await refreshProfile();
      
      setSuccessMessage('Profile picture removed successfully!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Profile picture deletion failed:', error);
      setErrors({
        upload: error.response?.data?.message || error.message || 'Failed to delete profile picture. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get file size display
  const getFileSizeDisplay = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Render current profile picture
  const renderCurrentPicture = () => {
    if (!user?.avatar_url) return null;

    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Current Profile Picture
        </h4>
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar_url}
            alt="Current profile"
            className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your current profile picture is displayed throughout the application.
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting || isUploading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render file upload area
  const renderUploadArea = () => (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
    >
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700">
        <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="mt-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          Upload Profile Picture
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Drag and drop an image file, or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          <CameraIcon className="h-4 w-4 mr-2" />
          Choose Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );

  // Render preview and upload
  const renderPreview = () => {
    if (!preview) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Image Preview
            </h4>
            <button
              onClick={clearPreview}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-start space-x-4">
            {/* Preview Image */}
            <div className="flex-shrink-0">
              <img
                src={preview.url}
                alt="Preview"
                className="h-24 w-24 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
              />
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {preview.file.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getFileSizeDisplay(preview.file.size)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preview.file.type}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={clearPreview}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <PhotoIcon className="h-4 w-4 mr-2" />
                Upload Picture
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile Picture
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a profile picture to personalize your account.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIconSolid className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Success
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {(errors.file || errors.upload) && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {errors.file || errors.upload}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Picture */}
        {renderCurrentPicture()}

        {/* Upload Section */}
        {!preview ? renderUploadArea() : renderPreview()}

        {/* Guidelines */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Image Guidelines
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Supported formats: JPEG, PNG, WebP</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Minimum dimensions: {MIN_DIMENSIONS.width}x{MIN_DIMENSIONS.height} pixels</li>
            <li>• Recommended dimensions: {RECOMMENDED_DIMENSIONS.width}x{RECOMMENDED_DIMENSIONS.height} pixels</li>
            <li>• Square images work best for profile pictures</li>
            <li>• Use clear, high-quality images for best results</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={isUploading || isDeleting}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
} 