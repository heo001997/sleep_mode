import React, { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  DocumentTextIcon, 
  TableCellsIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { exportSleepSessionsToCSV, exportToJSON } from '../../utils';
import type { SleepSession } from '../../types';

interface ExportButtonProps {
  sessions: SleepSession[];
  filename?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'button' | 'dropdown';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  sessions,
  filename,
  className = '',
  disabled = false,
  variant = 'dropdown'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    if (sessions.length === 0) {
      alert('No data to export');
      return;
    }

    setIsExporting(true);
    setIsOpen(false);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = filename || `sleep-sessions-${timestamp}`;

      if (format === 'csv') {
        exportSleepSessionsToCSV(sessions, `${baseFilename}.csv`);
      } else {
        exportToJSON(sessions, `${baseFilename}.json`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleExport('csv')}
        disabled={disabled || isExporting || sessions.length === 0}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
            Exporting...
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-4 w-4" />
            Export CSV
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting || sessions.length === 0}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
            Exporting...
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-4 w-4" />
            Export
            <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" />
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                <TableCellsIcon className="mr-3 h-4 w-4" />
                Export as CSV
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                <DocumentTextIcon className="mr-3 h-4 w-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 