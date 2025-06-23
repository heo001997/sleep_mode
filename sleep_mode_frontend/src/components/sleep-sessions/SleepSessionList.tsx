import React, { useState, useEffect, useCallback } from 'react';
import { sleepSessionService, type SleepSessionFilters } from '../../services/sleepSessionService';
import { handleApiError } from '../../services/api';
import type { SleepSession, PaginationInfo } from '../../types';
import { LoadingSpinner, ExportButton } from '../common';
import { useRealTimeUpdates } from '../../hooks';
import { formatDate, formatDuration, formatTime } from '../../utils';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface SleepSessionListProps {
  className?: string;
  onSessionSelect?: (session: SleepSession) => void;
  showFilters?: boolean;
  defaultFilters?: Partial<SleepSessionFilters>;
  enableRealTimeUpdates?: boolean;
  enableExport?: boolean;
}

interface SortConfig {
  field: 'start_time' | 'end_time' | 'duration' | 'quality_rating';
  direction: 'asc' | 'desc';
}

export const SleepSessionList: React.FC<SleepSessionListProps> = ({
  className = '',
  onSessionSelect,
  showFilters = true,
  defaultFilters = {},
  enableRealTimeUpdates = true,
  enableExport = true,
}) => {
  // State management
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<SleepSessionFilters>({
    page: 1,
    per_page: 10,
    sort: 'start_time',
    order: 'desc',
    ...defaultFilters,
  });

  // Sort configuration
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'start_time',
    direction: 'desc',
  });

  // Real-time updates
  const { forceUpdate } = useRealTimeUpdates({
    onUpdate: fetchSessions,
    intervalMs: 30000, // 30 seconds
    enabled: enableRealTimeUpdates
  });

  // Fetch sessions with current filters
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sleepSessionService.getSessions({
        ...filters,
        sort: sortConfig.field,
        order: sortConfig.direction,
      });
      
      setSessions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig]);

  // Effect to fetch sessions when filters change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SleepSessionFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle sorting
  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Format duration helper
  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Quality rating helper
  const formatQuality = (rating?: number) => {
    if (rating === undefined || rating === null) return 'Not Rated';
    return `${rating}/10`;
  };

  // Quality color helper
  const getQualityColor = (rating?: number) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    if (rating >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  // Status color helper
  const getStatusColor = (session: SleepSession) => {
    if (!session.end_time) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  // Status text helper
  const getStatusText = (session: SleepSession) => {
    if (!session.end_time) return 'Active';
    return 'Completed';
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortConfig['field']) => {
    if (sortConfig.field !== field) return null;
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1" />
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;

    const pages = [];
    const currentPage = pagination.current_page;
    const totalPages = pagination.total_pages;
    
    // Calculate page range to show
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.has_prev_page}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.has_next_page}
            className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * pagination.per_page + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pagination.per_page, pagination.total_count)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{pagination.total_count}</span> results
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.has_prev_page}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                    page === currentPage
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_next_page}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow-sm rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Sleep Sessions
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {pagination ? `${pagination.total_count} sessions found` : 'Loading...'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {showFilters && (
              <button
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
            )}
            
            {enableRealTimeUpdates && (
              <button
                onClick={forceUpdate}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            
            {enableExport && sessions.length > 0 && (
              <ExportButton 
                sessions={sessions}
                filename={`sleep-sessions-${new Date().toISOString().split('T')[0]}`}
                className="text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filtersVisible && (
        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Quality Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Quality</label>
              <select
                value={filters.quality_min || ''}
                onChange={(e) => handleFilterChange({ quality_min: e.target.value ? Number(e.target.value) : undefined })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Quality</label>
              <select
                value={filters.quality_max || ''}
                onChange={(e) => handleFilterChange({ quality_max: e.target.value ? Number(e.target.value) : undefined })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Per Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Per Page</label>
              <select
                value={filters.per_page || 10}
                onChange={(e) => handleFilterChange({ per_page: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    per_page: 10,
                    sort: 'start_time',
                    order: 'desc',
                  });
                  setSortConfig({ field: 'start_time', direction: 'desc' });
                }}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 text-red-700 bg-red-100 border border-red-200 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sessions.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sleep sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filtersVisible ? 'Try adjusting your filters' : 'Start tracking your sleep to see sessions here'}
          </p>
        </div>
      )}

      {/* Sessions Table */}
      {!loading && !error && sessions.length > 0 && (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('start_time')}
                >
                  <div className="flex items-center">
                    Start Time
                    {renderSortIndicator('start_time')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('end_time')}
                >
                  <div className="flex items-center">
                    End Time
                    {renderSortIndicator('end_time')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quality_rating')}
                >
                  <div className="flex items-center">
                    Quality
                    {renderSortIndicator('quality_rating')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => onSessionSelect?.(session)}
                  className={`${onSessionSelect ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.start_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.end_time ? formatDate(session.end_time) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(session.start_time, session.end_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getQualityColor(session.quality_rating)}>
                      {formatQuality(session.quality_rating)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session)}`}>
                      {getStatusText(session)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {session.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}; 