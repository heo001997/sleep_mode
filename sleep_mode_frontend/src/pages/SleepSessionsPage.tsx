import React, { useState } from 'react';
import { SleepSessionList } from '../components/sleep-sessions';
import type { SleepSession } from '../types';

export const SleepSessionsPage: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<SleepSession | null>(null);

  const handleSessionSelect = (session: SleepSession) => {
    setSelectedSession(session);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sleep Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your sleep session history
          </p>
        </div>
      </div>

      {/* Sleep Session List */}
      <SleepSessionList 
        onSessionSelect={handleSessionSelect}
        className="shadow-sm"
      />

      {/* TODO: Add session detail modal/sidebar when selectedSession is not null */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sleep Session Details
                </h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</h3>
                  <p className="text-gray-900 dark:text-white">{selectedSession.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</h3>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedSession.start_time).toLocaleString()}
                  </p>
                </div>
                
                {selectedSession.end_time && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time</h3>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedSession.end_time).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {selectedSession.quality_rating && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quality Rating</h3>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSession.quality_rating}/10
                    </p>
                  </div>
                )}
                
                {selectedSession.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                    <p className="text-gray-900 dark:text-white">{selectedSession.notes}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dismissal Count</h3>
                  <p className="text-gray-900 dark:text-white">{selectedSession.dismissal_count}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Dismissal Duration</h3>
                  <p className="text-gray-900 dark:text-white">{selectedSession.total_dismissal_duration} minutes</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 