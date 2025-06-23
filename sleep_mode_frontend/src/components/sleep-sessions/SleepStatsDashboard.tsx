import React, { useState, useEffect } from 'react';
import type { SleepSession } from '../../types';
import { sleepSessionService } from '../../services/sleepSessionService';
import { handleApiError } from '../../utils/api';
import { formatDuration } from '../../utils';
import { ExportButton } from '../common';
import { useRealTimeUpdates } from '../../hooks';
import {
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MoonIcon,
  SunIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SleepStatsData {
  totalSessions: number;
  averageDuration: number;
  averageQuality: number;
  totalSleepTime: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekSessions: number;
  lastWeekSessions: number;
  thisMonthSessions: number;
  lastMonthSessions: number;
  averageBedtime: string;
  averageWakeTime: string;
  totalDismissals: number;
  averageDismissals: number;
}

interface SleepStatsDashboardProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
  enableRealTimeUpdates?: boolean;
  enableExport?: boolean;
}

export const SleepStatsDashboard: React.FC<SleepStatsDashboardProps> = ({
  dateRange,
  className = '',
  enableRealTimeUpdates = true,
  enableExport = true
}) => {
  const [stats, setStats] = useState<SleepStatsData | null>(null);
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Fetch statistics data
  const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get sessions for the selected period or date range
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
            case 'year':
              startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default:
              startDate = new Date(0); // All time
          }
        }

        const response = await sleepSessionService.getSessions({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000 // Get all sessions for calculations
        });

        // Store sessions for export
        setSessions(response.sessions);
        
        // Calculate statistics
        const calculatedStats = calculateStats(response.sessions);
        setStats(calculatedStats);

      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

  // Real-time updates
  const { forceUpdate } = useRealTimeUpdates({
    onUpdate: fetchStats,
    intervalMs: 60000, // 1 minute for stats
    enabled: enableRealTimeUpdates
  });

  // Effect to fetch stats when period or date range changes
  useEffect(() => {
    fetchStats();
  }, [selectedPeriod, dateRange]);

  // Calculate statistics from sessions
  const calculateStats = (sessions: SleepSession[]): SleepStatsData => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageDuration: 0,
        averageQuality: 0,
        totalSleepTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisWeekSessions: 0,
        lastWeekSessions: 0,
        thisMonthSessions: 0,
        lastMonthSessions: 0,
        averageBedtime: '--:--',
        averageWakeTime: '--:--',
        totalDismissals: 0,
        averageDismissals: 0
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Filter completed sessions only for most calculations
    const completedSessions = sessions.filter(s => s.end_time);

    // Calculate durations and total sleep time
    let totalDuration = 0;
    let totalQuality = 0;
    let qualityCount = 0;
    let totalDismissals = 0;
    const bedtimes: number[] = [];
    const wakeTimes: number[] = [];

    completedSessions.forEach(session => {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time!);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      totalDuration += duration;
      
      if (session.quality_rating) {
        totalQuality += session.quality_rating;
        qualityCount++;
      }

      totalDismissals += session.dismissal_count || 0;

      // Calculate bedtime and wake time
      bedtimes.push(start.getHours() * 60 + start.getMinutes());
      wakeTimes.push(end.getHours() * 60 + end.getMinutes());
    });

    // Calculate averages
    const averageDuration = completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0;
    const averageQuality = qualityCount > 0 ? Math.round((totalQuality / qualityCount) * 10) / 10 : 0;
    const averageDismissals = completedSessions.length > 0 ? Math.round((totalDismissals / completedSessions.length) * 10) / 10 : 0;

    // Calculate average bedtime and wake time
    const avgBedtimeMinutes = bedtimes.length > 0 ? Math.round(bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length) : 0;
    const avgWakeTimeMinutes = wakeTimes.length > 0 ? Math.round(wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length) : 0;

    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '--:--';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    // Calculate streaks
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Simplified streak calculation (consecutive days with sessions)
    const sessionDates = new Set(sortedSessions.map(s => 
      new Date(s.start_time).toDateString()
    ));

    let currentDate = new Date();
    while (sessionDates.has(currentDate.toDateString())) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, sessionDates.size);

    // Calculate period comparisons
    const thisWeekSessions = sessions.filter(s => 
      new Date(s.start_time) >= weekAgo
    ).length;

    const lastWeekSessions = sessions.filter(s => {
      const date = new Date(s.start_time);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length;

    const thisMonthSessions = sessions.filter(s => 
      new Date(s.start_time) >= monthAgo
    ).length;

    const lastMonthSessions = sessions.filter(s => {
      const date = new Date(s.start_time);
      return date >= twoMonthsAgo && date < monthAgo;
    }).length;

    return {
      totalSessions: sessions.length,
      averageDuration,
      averageQuality,
      totalSleepTime: totalDuration,
      currentStreak,
      longestStreak,
      thisWeekSessions,
      lastWeekSessions,
      thisMonthSessions,
      lastMonthSessions,
      averageBedtime: formatTime(avgBedtimeMinutes),
      averageWakeTime: formatTime(avgWakeTimeMinutes),
      totalDismissals,
      averageDismissals
    };
  };

  // Calculate trend indicators
  const getTrendIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    
    if (Math.abs(change) < 5) return null; // No significant change
    
    return {
      isPositive: change > 0,
      percentage: Math.abs(Math.round(change))
    };
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
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
            Error Loading Statistics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const weekTrend = getTrendIndicator(stats.thisWeekSessions, stats.lastWeekSessions);
  const monthTrend = getTrendIndicator(stats.thisMonthSessions, stats.lastMonthSessions);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Sleep Statistics
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {enableRealTimeUpdates && (
              <button
                onClick={forceUpdate}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            
            {enableExport && sessions.length > 0 && (
              <ExportButton 
                sessions={sessions}
                filename={`sleep-statistics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}`}
                variant="button"
                className="text-sm"
              />
            )}
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            {(['week', 'month', 'year', 'all'] as const).map((period) => (
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
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Sessions */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
            <MoonIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Average Duration</p>
              <p className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-green-200" />
          </div>
        </div>

        {/* Average Quality */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Average Quality</p>
              <p className="text-2xl font-bold">{stats.averageQuality}/5</p>
            </div>
            <StarIcon className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">{stats.currentStreak} days</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Sleep Time */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Sleep Time</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(stats.totalSleepTime)}
              </p>
            </div>
            <ClockIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Longest Streak</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.longestStreak} days
              </p>
            </div>
            <TrendingUpIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Average Dismissals */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Avg. Dismissals</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.averageDismissals}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Trends and Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activity Trends
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.thisWeekSessions} sessions
                </span>
                {weekTrend && (
                  <div className={`flex items-center space-x-1 ${
                    weekTrend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {weekTrend.isPositive ? (
                      <TrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <TrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs">{weekTrend.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.thisMonthSessions} sessions
                </span>
                {monthTrend && (
                  <div className={`flex items-center space-x-1 ${
                    monthTrend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {monthTrend.isPositive ? (
                      <TrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <TrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs">{monthTrend.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sleep Schedule */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sleep Schedule
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MoonIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Bedtime</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.averageBedtime}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SunIcon className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Wake Time</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.averageWakeTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 