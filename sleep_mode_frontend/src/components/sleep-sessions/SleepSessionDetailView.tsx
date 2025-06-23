import React, { useState, useEffect } from 'react';
import type { SleepSession } from '../../types';
import { formatDate, formatTime, formatDuration } from '../../utils';
import { sleepSessionService } from '../../services/sleepSessionService';
import { handleApiError } from '../../utils/api';
import {
  CalendarIcon,
  ClockIcon,
  StarIcon,
  SunIcon,
  MoonIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface SleepSessionDetailViewProps {
  sessionId: string;
  onClose?: () => void;
  onEdit?: (session: SleepSession) => void;
  onDelete?: (sessionId: string) => void;
  onSessionUpdate?: (session: SleepSession) => void;
  className?: string;
}

export const SleepSessionDetailView: React.FC<SleepSessionDetailViewProps> = ({
  sessionId,
  onClose,
  onEdit,
  onDelete,
  onSessionUpdate,
  className = ''
}) => {
  const [session, setSession] = useState<SleepSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedQuality, setEditedQuality] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionData = await sleepSessionService.getSession(sessionId);
        setSession(sessionData);
        setEditedNotes(sessionData.notes || '');
        setEditedQuality(sessionData.quality_rating || null);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Calculate session metrics
  const sessionMetrics = React.useMemo(() => {
    if (!session) return null;

    const startTime = new Date(session.start_time);
    const endTime = session.end_time ? new Date(session.end_time) : null;
    const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : null;
    
    return {
      duration,
      isActive: !session.end_time,
      startHour: startTime.getHours(),
      sleepType: startTime.getHours() >= 6 && startTime.getHours() < 18 ? 'nap' : 'sleep'
    };
  }, [session]);

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!session) return;

    try {
      setSaving(true);
      const updatedSession = await sleepSessionService.updateSession(session.id, {
        notes: editedNotes,
        quality_rating: editedQuality
      });
      
      setSession(updatedSession);
      setIsEditing(false);
      
      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedNotes(session?.notes || '');
    setEditedQuality(session?.quality_rating || null);
    setIsEditing(false);
  };

  // Handle delete session
  const handleDeleteSession = async () => {
    if (!session) return;
    
    if (window.confirm('Are you sure you want to delete this sleep session? This action cannot be undone.')) {
      try {
        await sleepSessionService.deleteSession(session.id);
        if (onDelete) {
          onDelete(session.id);
        }
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!session || !sessionMetrics?.isActive) return;

    try {
      const updatedSession = await sleepSessionService.endSession(session.id);
      setSession(updatedSession);
      
      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  // Render quality stars
  const renderQualityStars = (rating?: number, editable = false, size = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    const currentRating = editable ? editedQuality : rating;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => editable && setEditedQuality(star)}
            disabled={!editable}
            className={`${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            {currentRating && star <= currentRating ? (
              <StarSolidIcon className={`${sizeClass} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClass} text-gray-300 ${editable ? 'hover:text-yellow-300' : ''}`} />
            )}
          </button>
        ))}
        {currentRating && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {currentRating}/5
          </span>
        )}
      </div>
    );
  };

  // Get quality color and label
  const getQualityInfo = (rating?: number) => {
    if (!rating) return { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700', label: 'No rating' };
    
    if (rating >= 4) return { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900', label: 'Excellent' };
    if (rating >= 3) return { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900', label: 'Good' };
    if (rating >= 2) return { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900', label: 'Fair' };
    return { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900', label: 'Poor' };
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Session
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const qualityInfo = getQualityInfo(session.quality_rating);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {sessionMetrics?.isActive ? (
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
                  <BoltIcon className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
                  <MoonIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold">
                {formatDate(session.start_time)}
              </h2>
              <p className="text-indigo-100">
                {sessionMetrics?.sleepType === 'nap' ? 'Nap Session' : 'Sleep Session'} #{session.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {sessionMetrics?.isActive && (
              <button
                onClick={handleEndSession}
                className="flex items-center space-x-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <StopIcon className="h-4 w-4" />
                <span className="text-sm">End Session</span>
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            sessionMetrics?.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-white/20 text-white'
          }`}>
            {sessionMetrics?.isActive ? (
              <>
                <BoltIcon className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <CheckIcon className="h-3 w-3 mr-1" />
                Completed
              </>
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <SunIcon className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatTime(session.start_time)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <MoonIcon className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {session.end_time ? formatTime(session.end_time) : 'In progress'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <ClockIcon className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {sessionMetrics?.duration ? formatDuration(sessionMetrics.duration) : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.dismissal_count || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Dismissals</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.total_dismissal_duration ? `${Math.round(session.total_dismissal_duration / 60)}m` : '0m'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Interruption Time</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className={`text-2xl font-bold ${qualityInfo.color}`}>
              {session.quality_rating || 'N/A'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Quality Rating</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {sessionMetrics?.sleepType === 'nap' ? 'Nap' : 'Sleep'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Session Type</div>
          </div>
        </div>

        {/* Quality Rating Section */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sleep Quality Rating
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="text-sm">Edit</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {renderQualityStars(session.quality_rating, isEditing, 'lg')}
              {session.quality_rating && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${qualityInfo.bgColor} ${qualityInfo.color}`}>
                  {qualityInfo.label}
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm"
                >
                  <CheckIcon className="h-3 w-3" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  <XMarkIcon className="h-3 w-3" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Notes
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="text-sm">Edit</span>
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add notes about your sleep session..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {editedNotes.length}/500 characters
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm"
                  >
                    <CheckIcon className="h-3 w-3" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                  >
                    <XMarkIcon className="h-3 w-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {session.notes ? (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {session.notes}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No notes added for this session
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dismissal Information */}
        {(session.dismissal_count > 0 || session.total_dismissal_duration > 0) && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  Session Interruptions
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  This session had {session.dismissal_count} dismissal{session.dismissal_count !== 1 ? 's' : ''} 
                  {session.total_dismissal_duration > 0 && (
                    <span> totaling {Math.round(session.total_dismissal_duration / 60)} minutes of interruption time</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created: {formatDate(session.created_at)} at {formatTime(session.created_at)}
            {session.updated_at && session.updated_at !== session.created_at && (
              <span className="block">
                Updated: {formatDate(session.updated_at)} at {formatTime(session.updated_at)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(session)}
                className="flex items-center space-x-1 px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            
            <button
              onClick={handleDeleteSession}
              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 