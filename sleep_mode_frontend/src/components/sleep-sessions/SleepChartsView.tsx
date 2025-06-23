import React, { useState, useEffect, useMemo } from 'react';
import type { SleepSession } from '../../types';
import { sleepSessionService } from '../../services/sleepSessionService';
import { handleApiError } from '../../utils/api';
import { formatDuration } from '../../utils';
import { ExportButton } from '../common';
import { useRealTimeUpdates } from '../../hooks';
import {
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ChartData {
  date: string;
  duration: number;
  quality: number;
  dismissals: number;
  sessions: number;
}

interface SleepChartsViewProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
  enableRealTimeUpdates?: boolean;
  enableExport?: boolean;
}

export const SleepChartsView: React.FC<SleepChartsViewProps> = ({
  dateRange,
  className = '',
  enableRealTimeUpdates = true,
  enableExport = true
}) => {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'duration' | 'quality' | 'trends' | 'patterns'>('duration');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fetch sessions data
  const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDate = dateRange?.end || new Date();
        let startDate = dateRange?.start;
        
        if (!startDate) {
          switch (selectedPeriod) {
            case 'week':
              startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'quarter':
              startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
          }
        }

        const response = await sleepSessionService.getSessions({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        });

        setSessions(response.sessions);

      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [selectedPeriod, dateRange]);

  // Real-time updates
  useRealTimeUpdates(fetchSessions, { 
    interval: 60000, // Update every minute
    enabled: enableRealTimeUpdates 
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (sessions.length === 0) return [];

    // Group sessions by day
    const dailyData = new Map<string, ChartData>();

    sessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          duration: 0,
          quality: 0,
          dismissals: 0,
          sessions: 0
        });
      }

      const dayData = dailyData.get(date)!;
      dayData.sessions++;
      dayData.dismissals += session.dismissal_count || 0;

      if (session.end_time) {
        const duration = Math.round(
          (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60)
        );
        dayData.duration += duration;
      }

      if (session.quality_rating) {
        dayData.quality += session.quality_rating;
      }
    });

    // Calculate averages and sort by date
    return Array.from(dailyData.values())
      .map(day => ({
        ...day,
        quality: day.quality > 0 ? Math.round((day.quality / day.sessions) * 10) / 10 : 0,
        dismissals: Math.round((day.dismissals / day.sessions) * 10) / 10
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions]);

  // Chart rendering functions
  const renderBarChart = (data: ChartData[], metric: 'duration' | 'quality' | 'dismissals') => {
    if (data.length === 0) return null;

    const values = data.map(d => {
      switch (metric) {
        case 'duration': return d.duration;
        case 'quality': return d.quality;
        case 'dismissals': return d.dismissals;
        default: return 0;
      }
    });

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const getColor = (value: number) => {
      switch (metric) {
        case 'duration':
          return value > 420 ? 'bg-green-500' : value > 300 ? 'bg-yellow-500' : 'bg-red-500';
        case 'quality':
          return value >= 4 ? 'bg-green-500' : value >= 2.5 ? 'bg-yellow-500' : 'bg-red-500';
        case 'dismissals':
          return value <= 2 ? 'bg-green-500' : value <= 5 ? 'bg-yellow-500' : 'bg-red-500';
        default:
          return 'bg-blue-500';
      }
    };

    const formatValue = (value: number) => {
      switch (metric) {
        case 'duration': return formatDuration(value);
        case 'quality': return `${value}/5`;
        case 'dismissals': return `${value}`;
        default: return `${value}`;
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Min: {formatValue(minValue)}</span>
          <span>Max: {formatValue(maxValue)}</span>
        </div>
        
        <div className="space-y-1">
          {data.map((item, index) => {
            const value = values[index];
            const height = ((value - minValue) / range) * 100;
            
            return (
              <div key={item.date} className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                
                <div className="flex-1 relative bg-gray-200 dark:bg-gray-700 rounded h-6">
                  <div
                    className={`absolute left-0 top-0 h-full rounded transition-all duration-300 ${getColor(value)}`}
                    style={{ width: `${Math.max(height, 5)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatValue(value)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    if (chartData.length === 0) return null;

    // Calculate 7-day moving averages
    const movingAverages = chartData.map((item, index) => {
      const start = Math.max(0, index - 3);
      const end = Math.min(chartData.length, index + 4);
      const window = chartData.slice(start, end);
      
      const avgDuration = window.reduce((sum, d) => sum + d.duration, 0) / window.length;
      const avgQuality = window.reduce((sum, d) => sum + d.quality, 0) / window.length;
      
      return {
        date: item.date,
        avgDuration: Math.round(avgDuration),
        avgQuality: Math.round(avgQuality * 10) / 10
      };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Duration Trend</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Quality Trend</span>
          </div>
        </div>

        <div className="relative h-48 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <svg className="w-full h-full" viewBox="0 0 400 150">
            {/* Duration trend line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={movingAverages.map((item, index) => {
                const x = (index / (movingAverages.length - 1)) * 380 + 10;
                const y = 140 - (item.avgDuration / 600) * 120; // Assuming max 10 hours
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Quality trend line (scaled) */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              points={movingAverages.map((item, index) => {
                const x = (index / (movingAverages.length - 1)) * 380 + 10;
                const y = 140 - (item.avgQuality / 5) * 120; // Quality is 0-5
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Data points */}
            {movingAverages.map((item, index) => {
              const x = (index / (movingAverages.length - 1)) * 380 + 10;
              const durationY = 140 - (item.avgDuration / 600) * 120;
              const qualityY = 140 - (item.avgQuality / 5) * 120;
              
              return (
                <g key={item.date}>
                  <circle cx={x} cy={durationY} r="3" fill="#3B82F6" />
                  <circle cx={x} cy={qualityY} r="3" fill="#10B981" />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          7-day moving average trends
        </div>
      </div>
    );
  };

  const renderPatternsAnalysis = () => {
    if (sessions.length === 0) return null;

    // Analyze patterns by day of week and hour
    const dayPatterns = new Map<string, { count: number; totalDuration: number; totalQuality: number }>();
    const hourPatterns = new Map<number, { count: number; type: 'start' | 'end' }>();

    sessions.forEach(session => {
      const start = new Date(session.start_time);
      const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });
      const startHour = start.getHours();

      // Day patterns
      if (!dayPatterns.has(dayOfWeek)) {
        dayPatterns.set(dayOfWeek, { count: 0, totalDuration: 0, totalQuality: 0 });
      }
      const dayData = dayPatterns.get(dayOfWeek)!;
      dayData.count++;

      if (session.end_time) {
        const duration = Math.round(
          (new Date(session.end_time).getTime() - start.getTime()) / (1000 * 60)
        );
        dayData.totalDuration += duration;

        const endHour = new Date(session.end_time).getHours();
        
        // End hour patterns
        if (!hourPatterns.has(endHour)) {
          hourPatterns.set(endHour, { count: 0, type: 'end' });
        }
        hourPatterns.get(endHour)!.count++;
      }

      if (session.quality_rating) {
        dayData.totalQuality += session.quality_rating;
      }

      // Start hour patterns
      if (!hourPatterns.has(startHour)) {
        hourPatterns.set(startHour, { count: 0, type: 'start' });
      }
      hourPatterns.get(startHour)!.count++;
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const maxCount = Math.max(...Array.from(dayPatterns.values()).map(d => d.count));

    return (
      <div className="space-y-6">
        {/* Day of week patterns */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Sessions by Day of Week
          </h4>
          <div className="space-y-2">
            {daysOfWeek.map(day => {
              const data = dayPatterns.get(day) || { count: 0, totalDuration: 0, totalQuality: 0 };
              const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
              const avgDuration = data.count > 0 ? Math.round(data.totalDuration / data.count) : 0;
              const avgQuality = data.count > 0 ? Math.round((data.totalQuality / data.count) * 10) / 10 : 0;

              return (
                <div key={day} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{day.slice(0, 3)}</span>
                  <div className="flex-1 relative bg-gray-200 dark:bg-gray-700 rounded h-6">
                    <div
                      className="absolute left-0 top-0 h-full bg-indigo-500 rounded transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {data.count} sessions
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 w-24">
                    {avgDuration > 0 && `${formatDuration(avgDuration)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hour patterns */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Most Common Sleep Hours
          </h4>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, hour) => {
              const count = hourPatterns.get(hour)?.count || 0;
              const maxHourCount = Math.max(...Array.from(hourPatterns.values()).map(h => h.count));
              const intensity = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0;
              
              return (
                <div
                  key={hour}
                  className={`h-8 rounded text-xs flex items-center justify-center transition-all duration-200 ${
                    intensity > 70 ? 'bg-indigo-600 text-white' :
                    intensity > 40 ? 'bg-indigo-400 text-white' :
                    intensity > 10 ? 'bg-indigo-200 text-gray-800' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                  title={`${hour}:00 - ${count} sessions`}
                >
                  {hour}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Darker colors indicate more frequent sleep/wake times
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            Error Loading Charts
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start tracking your sleep sessions to see charts and analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Sleep Analytics
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Button */}
            {enableExport && (
              <ExportButton
                data={sessions}
                filename={`sleep-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}`}
                variant="button"
              />
            )}
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {[
          { key: 'duration', label: 'Duration', icon: ClockIcon },
          { key: 'quality', label: 'Quality', icon: StarIcon },
          { key: 'trends', label: 'Trends', icon: ChartBarIcon },
          { key: 'patterns', label: 'Patterns', icon: CalendarIcon }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedChart(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === key
                ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="min-h-[300px]">
        {selectedChart === 'duration' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sleep Duration Over Time
            </h3>
            {renderBarChart(chartData, 'duration')}
          </div>
        )}

        {selectedChart === 'quality' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sleep Quality Ratings
            </h3>
            {renderBarChart(chartData, 'quality')}
          </div>
        )}

        {selectedChart === 'trends' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sleep Trends Analysis
            </h3>
            {renderTrendChart()}
          </div>
        )}

        {selectedChart === 'patterns' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sleep Patterns
            </h3>
            {renderPatternsAnalysis()}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sessions.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(
                sessions
                  .filter(s => s.end_time)
                  .reduce((sum, s) => {
                    const duration = Math.round(
                      (new Date(s.end_time!).getTime() - new Date(s.start_time).getTime()) / (1000 * 60)
                    );
                    return sum + duration;
                  }, 0)
              )}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sleep Time</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {sessions.filter(s => s.quality_rating).length > 0
                ? Math.round(
                    (sessions
                      .filter(s => s.quality_rating)
                      .reduce((sum, s) => sum + s.quality_rating!, 0) /
                      sessions.filter(s => s.quality_rating).length) * 10
                  ) / 10
                : 0
              }/5
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Quality</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 