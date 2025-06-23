import React from 'react';
import {
  CalendarIcon,
  ClockIcon,
  StarIcon,
  MoonIcon,
  SunIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  BoltIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { SleepSession } from '../../types';
import { formatDate, formatTime, formatDuration } from '../../utils';

interface SleepSessionCardProps {
  session: SleepSession;
  onSelect?: (session: SleepSession) => void;
  onEdit?: (session: SleepSession) => void;
  onDelete?: (session: SleepSession) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

const SleepSessionCard: React.FC<SleepSessionCardProps> = ({
  session,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 8) return 'text-green-600 bg-green-100';
    if (quality >= 6) return 'text-yellow-600 bg-yellow-100';
    if (quality >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'active':
        return 'text-blue-700 bg-blue-100';
      case 'interrupted':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(session);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(session);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(session);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-indigo-200
        ${isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-200'}
        ${onSelect ? 'hover:bg-gray-50' : ''}
      `}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header with Date and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(session.startTime)}
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status}
            </span>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit session"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete session"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Time Range */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">Start:</span>
            <span className="ml-1 text-sm">{formatTime(session.startTime)}</span>
          </div>
          {session.endTime && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a8.949 8.949 0 008.354-5.646z" />
              </svg>
              <span className="text-sm font-medium">End:</span>
              <span className="ml-1 text-sm">{formatTime(session.endTime)}</span>
            </div>
          )}
        </div>

        {/* Duration and Quality */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Duration:</span>
              <span className="ml-1 text-sm font-semibold">
                {formatDuration(session.duration)}
              </span>
            </div>
            {session.qualityRating && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(
                    session.qualityRating
                  )}`}
                >
                  {session.qualityRating}/10
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-700 leading-relaxed">
                {session.notes.length > 120 
                  ? `${session.notes.substring(0, 120)}...`
                  : session.notes
                }
              </p>
            </div>
          </div>
        )}

        {/* Environment Info */}
        {(session.roomTemperature || session.ambientLight) && (
          <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
            {session.roomTemperature && (
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {session.roomTemperature}°F
              </div>
            )}
            {session.ambientLight && (
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {session.ambientLight} lux
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SleepSessionCard; 