import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface TimeValue {
  hour: number;
  minute: number;
  period?: 'AM' | 'PM'; // Only used in 12-hour format
}

interface TimePickerProps {
  value?: TimeValue;
  onChange: (value: TimeValue) => void;
  format?: '12' | '24';
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

const generateHours = (format: '12' | '24'): number[] => {
  if (format === '12') {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }
  return Array.from({ length: 24 }, (_, i) => i);
};

const generateMinutes = (): number[] => {
  return Array.from({ length: 60 }, (_, i) => i);
};

const formatTime = (time: TimeValue | undefined, format: '12' | '24'): string => {
  if (!time) return '';
  
  const { hour, minute, period } = time;
  const paddedMinute = minute.toString().padStart(2, '0');
  
  if (format === '12') {
    return `${hour}:${paddedMinute} ${period || 'AM'}`;
  }
  
  const paddedHour = hour.toString().padStart(2, '0');
  return `${paddedHour}:${paddedMinute}`;
};

const parseTimeInput = (input: string, format: '12' | '24'): TimeValue | null => {
  if (!input.trim()) return null;
  
  const timeRegex = format === '12' 
    ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    : /^(\d{1,2}):(\d{2})$/;
  
  const match = input.trim().match(timeRegex);
  if (!match) return null;
  
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = format === '12' ? (match[3]?.toUpperCase() as 'AM' | 'PM') : undefined;
  
  // Validation
  if (format === '12') {
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  } else {
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  }
  
  return { hour, minute, period };
};

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  format = '12',
  disabled = false,
  label,
  placeholder = 'Select time',
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [tempValue, setTempValue] = useState<TimeValue>(
    value || { hour: format === '12' ? 12 : 0, minute: 0, period: format === '12' ? 'AM' : undefined }
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hours = generateHours(format);
  const minutes = generateMinutes();
  
  useEffect(() => {
    if (value) {
      setInputValue(formatTime(value, format));
      setTempValue(value);
    }
  }, [value, format]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const parsed = parseTimeInput(newValue, format);
    if (parsed) {
      setTempValue(parsed);
      onChange(parsed);
    }
  };
  
  const handleInputBlur = () => {
    if (value) {
      setInputValue(formatTime(value, format));
    }
  };
  
  const handleTimeSelect = () => {
    onChange(tempValue);
    setInputValue(formatTime(tempValue, format));
    setIsOpen(false);
  };
  
  const incrementValue = (type: 'hour' | 'minute', amount: number) => {
    setTempValue(prev => {
      let newValue = { ...prev };
      
      if (type === 'hour') {
        if (format === '12') {
          newValue.hour = ((prev.hour - 1 + amount + 12) % 12) + 1;
        } else {
          newValue.hour = (prev.hour + amount + 24) % 24;
        }
      } else {
        newValue.minute = (prev.minute + amount + 60) % 60;
      }
      
      return newValue;
    });
  };
  
  const togglePeriod = () => {
    if (format === '12') {
      setTempValue(prev => ({
        ...prev,
        period: prev.period === 'AM' ? 'PM' : 'AM'
      }));
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            error 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled 
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-800'
          } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
        />
        
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between space-x-4">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Hour
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => incrementValue('hour', 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <select
                    value={tempValue.hour}
                    onChange={(e) => setTempValue(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                    className="block w-full px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>
                        {format === '24' ? hour.toString().padStart(2, '0') : hour}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => incrementValue('hour', -1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 self-end pb-1">
                :
              </div>
              
              {/* Minute Selector */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Minute
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => incrementValue('minute', 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <select
                    value={tempValue.minute}
                    onChange={(e) => setTempValue(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                    className="block w-full px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {minutes.map(minute => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => incrementValue('minute', -1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* AM/PM Toggle for 12-hour format */}
              {format === '12' && (
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Period
                  </label>
                  <button
                    type="button"
                    onClick={togglePeriod}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-medium text-gray-900 dark:text-white transition-colors"
                  >
                    {tempValue.period || 'AM'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTimeSelect}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker; 