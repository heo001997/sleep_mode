import React, { useState, useEffect, useCallback } from 'react';
import { sleepSessionService, type SleepSessionFilters } from '../../services/sleepSessionService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SleepSessionCard } from './SleepSessionCard';
import type { SleepSession, PaginatedResponse } from '../../types';
import { 
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface SleepSessionGridProps {
  onSessionClick?: (session: SleepSession) => void;
  className?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export const SleepSessionGrid: React.FC<SleepSessionGridProps> = ({
  onSessionClick,
  className = '',
  viewMode = 'grid',
  onViewModeChange
}) => {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 12,
    total_pages: 1,
    total_count: 0,
    has_next_page: false,
    has_prev_page: false
  });

  // Filter states
  const [filters, setFilters] = useState<SleepSessionFilters>({
    page: 1,
    per_page: 12,
    sort: 'start_time',
    order: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch sessions with current filters
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sleepSessionService.getSessions(filters);
      setSessions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep sessions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Effect to fetch sessions when filters change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SleepSessionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Load more sessions (for infinite scroll)
  const loadMoreSessions = async () => {
    if (!pagination.has_next_page || loading) return;
    
    try {
      const nextPageFilters = { ...filters, page: pagination.current_page + 1 };
      const response = await sleepSessionService.getSessions(nextPageFilters);
      setSessions(prev => [...prev, ...response.data]);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more sessions');
    }
  };

  // Quick filter component
  const QuickFilters = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => handleFilterChange({ start_date: undefined, end_date: undefined })}
        className={`px-3 py-1 rounded-full text-sm ${
          !filters.start_date && !filters.end_date
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        All Time
      </button>
      <button
        onClick={() => {
          const today = new Date();
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          handleFilterChange({
            start_date: lastWeek.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0]
          });
        }}
        className={`px-3 py-1 rounded-full text-sm ${
          filters.start_date && filters.end_date
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        Last Week
      </button>
      <button
        onClick={() => {
          const today = new Date();
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          handleFilterChange({
            start_date: lastMonth.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0]
          });
        }}
        className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
      >
        Last Month
      </button>
    </div>
  );

  // Pagination component
  const Pagination = () => (
    <div className="flex justify-center mt-8">
      <nav className="flex gap-2">
        <button
          onClick={() => handlePageChange(pagination.current_page - 1)}
          disabled={!pagination.has_prev_page}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          Page {pagination.current_page} of {pagination.total_pages}
        </span>
        
        <button
          onClick={() => handlePageChange(pagination.current_page + 1)}
          disabled={!pagination.has_next_page}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </nav>
    </div>
  );

  if (loading && sessions.length === 0) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sleep Sessions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.total_count} sessions found
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <QuickFilters />

      {/* Detailed Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  handleFilterChange({ sort: sort as any, order: order as 'asc' | 'desc' });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="start_time-desc">Newest First</option>
                <option value="start_time-asc">Oldest First</option>
                <option value="quality_rating-desc">Best Quality</option>
                <option value="quality_rating-asc">Worst Quality</option>
                <option value="duration-desc">Longest Duration</option>
                <option value="duration-asc">Shortest Duration</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => setFilters({ page: 1, per_page: 12, sort: 'start_time', order: 'desc' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sessions.map((session) => (
          <SleepSessionCard
            key={session.id}
            session={session}
            onClick={onSessionClick}
            showDetails={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {sessions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            No sleep sessions found. Try adjusting your filters or create a new session.
          </div>
          <button
            onClick={() => setFilters({ page: 1, per_page: 12, sort: 'start_time', order: 'desc' })}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {sessions.length > 0 && pagination.total_pages > 1 && <Pagination />}

      {/* Load More Button (Alternative to pagination) */}
      {sessions.length > 0 && pagination.has_next_page && (
        <div className="text-center mt-8">
          <button
            onClick={loadMoreSessions}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More Sessions'}
          </button>
        </div>
      )}
    </div>
  );
}; 