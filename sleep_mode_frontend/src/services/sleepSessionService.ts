import { api, buildQueryParams } from './api';
import type { SleepSession, SleepSessionCreateRequest, SleepSessionUpdateRequest, PaginatedResponse } from '../types';

export interface SleepSessionFilters {
  status?: 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  quality_min?: number;
  quality_max?: number;
  duration_min?: number; // in minutes
  duration_max?: number; // in minutes
  page?: number;
  per_page?: number;
  sort?: 'start_time' | 'end_time' | 'duration' | 'quality_rating';
  order?: 'asc' | 'desc';
}

export interface SleepSessionStats {
  total_sessions: number;
  total_sleep_time: number; // in minutes
  average_duration: number; // in minutes
  average_quality: number;
  best_quality: number;
  worst_quality: number;
  longest_session: number; // in minutes
  shortest_session: number; // in minutes
  sessions_this_week: number;
  sessions_this_month: number;
  quality_trend: 'improving' | 'declining' | 'stable';
}

export interface BulkCreateRequest {
  sessions: SleepSessionCreateRequest[];
}

export const sleepSessionService = {
  // Get all sleep sessions with optional filtering
  getSessions: async (filters?: SleepSessionFilters): Promise<PaginatedResponse<SleepSession>> => {
    const queryString = filters ? buildQueryParams(filters) : '';
    const response = await api.get<PaginatedResponse<SleepSession>>(`/sleep_sessions${queryString}`);
    return response.data;
  },

  // Get a specific sleep session by ID
  getSession: async (id: number): Promise<SleepSession> => {
    const response = await api.get<SleepSession>(`/sleep_sessions/${id}`);
    return response.data;
  },

  // Create a new sleep session
  createSession: async (sessionData: SleepSessionCreateRequest): Promise<SleepSession> => {
    const response = await api.post<SleepSession>('/sleep_sessions', sessionData);
    return response.data;
  },

  // Update an existing sleep session
  updateSession: async (id: number, sessionData: SleepSessionUpdateRequest): Promise<SleepSession> => {
    const response = await api.patch<SleepSession>(`/sleep_sessions/${id}`, sessionData);
    return response.data;
  },

  // Delete a sleep session
  deleteSession: async (id: number): Promise<void> => {
    await api.delete(`/sleep_sessions/${id}`);
  },

  // Start a new sleep session (active session)
  startSession: async (sessionData?: Partial<SleepSessionCreateRequest>): Promise<SleepSession> => {
    const startTime = new Date().toISOString();
    const defaultData: SleepSessionCreateRequest = {
      start_time: startTime,
      status: 'active',
      ...sessionData,
    };
    
    return await sleepSessionService.createSession(defaultData);
  },

  // End an active sleep session
  endSession: async (id: number, endData?: Partial<SleepSessionUpdateRequest>): Promise<SleepSession> => {
    const endTime = new Date().toISOString();
    const updateData: SleepSessionUpdateRequest = {
      end_time: endTime,
      status: 'completed',
      ...endData,
    };
    
    return await sleepSessionService.updateSession(id, updateData);
  },

  // Get current active session
  getActiveSession: async (): Promise<SleepSession | null> => {
    try {
      const response = await sleepSessionService.getSessions({ status: 'active', per_page: 1 });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      return null;
    }
  },

  // Cancel an active session
  cancelSession: async (id: number, reason?: string): Promise<SleepSession> => {
    const updateData: SleepSessionUpdateRequest = {
      status: 'cancelled',
      notes: reason || 'Session cancelled by user',
    };
    
    return await sleepSessionService.updateSession(id, updateData);
  },

  // Get sleep session statistics
  getStats: async (filters?: { start_date?: string; end_date?: string }): Promise<SleepSessionStats> => {
    const queryString = filters ? buildQueryParams(filters) : '';
    const response = await api.get<SleepSessionStats>(`/sleep_sessions/stats${queryString}`);
    return response.data;
  },

  // Bulk create multiple sleep sessions
  bulkCreate: async (sessions: SleepSessionCreateRequest[]): Promise<SleepSession[]> => {
    const response = await api.post<SleepSession[]>('/sleep_sessions/bulk_create', { sessions });
    return response.data;
  },

  // Get recent sleep sessions (last 7 days by default)
  getRecentSessions: async (days: number = 7): Promise<SleepSession[]> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const filters: SleepSessionFilters = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      sort: 'start_time',
      order: 'desc',
      per_page: 50,
    };
    
    const response = await sleepSessionService.getSessions(filters);
    return response.data;
  },

  // Get sessions by date range
  getSessionsByDateRange: async (startDate: string, endDate: string): Promise<SleepSession[]> => {
    const filters: SleepSessionFilters = {
      start_date: startDate,
      end_date: endDate,
      sort: 'start_time',
      order: 'desc',
      per_page: 100,
    };
    
    const response = await sleepSessionService.getSessions(filters);
    return response.data;
  },

  // Get sleep quality trend
  getQualityTrend: async (days: number = 30): Promise<{ date: string; quality: number }[]> => {
    const sessions = await sleepSessionService.getRecentSessions(days);
    
    return sessions
      .filter(session => session.quality_rating !== null && session.quality_rating !== undefined)
      .map(session => ({
        date: session.start_time.split('T')[0],
        quality: session.quality_rating!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Get sleep duration trend
  getDurationTrend: async (days: number = 30): Promise<{ date: string; duration: number }[]> => {
    const sessions = await sleepSessionService.getRecentSessions(days);
    
    return sessions
      .filter(session => session.end_time && session.start_time)
      .map(session => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time!);
        const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
        
        return {
          date: session.start_time.split('T')[0],
          duration,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Export sessions to CSV format
  exportSessions: async (filters?: SleepSessionFilters): Promise<string> => {
    const queryString = filters ? buildQueryParams({ ...filters, format: 'csv' }) : '?format=csv';
    const response = await api.get(`/sleep_sessions/export${queryString}`);
    return response.data;
  },

  // Import sessions from CSV data
  importSessions: async (csvData: string): Promise<{ success: number; errors: string[] }> => {
    const response = await api.post<{ success: number; errors: string[] }>('/sleep_sessions/import', {
      csv_data: csvData,
    });
    return response.data;
  },
};

export default sleepSessionService; 