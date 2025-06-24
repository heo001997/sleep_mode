// Network Status Indicator Components
import React, { useState, useEffect, useCallback } from 'react';
import { 
  WifiIcon, 
  SignalIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  networkService, 
  getQueueStatus,
  type NetworkStatus,
  type QueuedRequest
} from '../../services';
import { useNetworkToast } from './ToastNotifications';

// Network Status Badge - Small indicator for headers/navigation
export const NetworkStatusBadge: React.FC<{
  showText?: boolean;
  showQueueCount?: boolean;
  className?: string;
}> = ({ showText = false, showQueueCount = false, className = '' }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );
  const [queueStatus, setQueueStatus] = useState(() => getQueueStatus());

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange(setNetworkStatus);
    
    const interval = setInterval(() => {
      setQueueStatus(getQueueStatus());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return <SignalSlashIcon className="h-4 w-4 text-red-500" />;
    }

    // Show signal strength based on connection quality
    const { downlink, rtt } = networkStatus;
    if (downlink > 10 && rtt < 150) {
      return <SignalIcon className="h-4 w-4 text-green-500" />;
    } else if (downlink > 1 && rtt < 500) {
      return <SignalIcon className="h-4 w-4 text-yellow-500" />;
    } else {
      return <SignalIcon className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) return 'Offline';
    
    const { downlink, rtt } = networkStatus;
    if (downlink > 10 && rtt < 150) return 'Excellent';
    if (downlink > 1 && rtt < 500) return 'Good';
    return 'Poor';
  };

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return 'text-red-600 dark:text-red-400';
    
    const { downlink, rtt } = networkStatus;
    if (downlink > 10 && rtt < 150) return 'text-green-600 dark:text-green-400';
    if (downlink > 1 && rtt < 500) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        {showText && (
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        )}
      </div>
      
      {showQueueCount && queueStatus.total > 0 && (
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {queueStatus.total}
          </span>
        </div>
      )}
    </div>
  );
};

// Network Status Banner - Full-width notification for significant status changes
export const NetworkStatusBanner: React.FC<{
  onDismiss?: () => void;
  showQueue?: boolean;
  className?: string;
}> = ({ onDismiss, showQueue = true, className = '' }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );
  const [queueStatus, setQueueStatus] = useState(() => getQueueStatus());
  const [isVisible, setIsVisible] = useState(!networkStatus.isOnline);
  const [lastOnlineState, setLastOnlineState] = useState(networkStatus.isOnline);

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange((status) => {
      const wasOnline = lastOnlineState;
      setNetworkStatus(status);
      setLastOnlineState(status.isOnline);
      
      // Show banner when going offline or when coming back online (briefly)
      if (!status.isOnline) {
        setIsVisible(true);
      } else if (!wasOnline && status.isOnline) {
        setIsVisible(true);
        // Auto-hide when back online after 4 seconds
        setTimeout(() => setIsVisible(false), 4000);
      }
    });

    const interval = setInterval(() => {
      setQueueStatus(getQueueStatus());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [lastOnlineState]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const getBannerContent = () => {
    if (!networkStatus.isOnline) {
      return {
        icon: <WifiIcon className="h-5 w-5 text-orange-600" />,
        title: 'You are offline',
        message: 'Some features may be limited. Your changes will be saved and synced when connection is restored.',
        bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
        textColor: 'text-orange-800 dark:text-orange-200'
      };
    } else {
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
        title: 'Back online',
        message: queueStatus.total > 0 
          ? `Processing ${queueStatus.total} queued action${queueStatus.total > 1 ? 's' : ''}...`
          : 'All systems operational',
        bgColor: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-200'
      };
    }
  };

  const { icon, title, message, bgColor, textColor } = getBannerContent();

  return (
    <div className={`${bgColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${textColor} opacity-90`}>
            {message}
          </p>
          
          {showQueue && queueStatus.total > 0 && (
            <div className="mt-2">
              <QueueStatusDisplay queueStatus={queueStatus} compact />
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Detailed Network Status Panel - For settings or debug views
export const NetworkStatusPanel: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );
  const [queueStatus, setQueueStatus] = useState(() => getQueueStatus());

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange(setNetworkStatus);
    
    const interval = setInterval(() => {
      setQueueStatus(getQueueStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Network Status
      </h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <div className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Connection Type */}
        {networkStatus.connectionType && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Connection Type</span>
            <span className="text-sm text-gray-900 dark:text-white capitalize">
              {networkStatus.connectionType}
            </span>
          </div>
        )}

        {/* Network Quality Metrics */}
        {networkStatus.isOnline && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Downlink Speed</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {networkStatus.downlink ? `${networkStatus.downlink} Mbps` : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Round Trip Time</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {networkStatus.rtt ? `${networkStatus.rtt}ms` : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Data Saver</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {networkStatus.saveData ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </>
        )}

        {/* Queue Status */}
        {queueStatus.total > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <QueueStatusDisplay queueStatus={queueStatus} />
          </div>
        )}
      </div>
    </div>
  );
};

// Queue Status Display Component
export const QueueStatusDisplay: React.FC<{
  queueStatus: any;
  compact?: boolean;
  className?: string;
}> = ({ queueStatus, compact = false, className = '' }) => {
  if (queueStatus.total === 0) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <ClockIcon className="h-3 w-3 text-blue-500" />
        <span className="text-blue-600 dark:text-blue-400">
          {queueStatus.total} queued request{queueStatus.total > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Queued Requests ({queueStatus.total})
      </h4>
      
      <div className="space-y-2">
        {Object.entries(queueStatus.byPriority).map(([priority, count]) => (
          count > 0 && (
            <div key={priority} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {priority} Priority
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {count}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// Connection Quality Indicator
export const ConnectionQualityIndicator: React.FC<{
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ showLabel = false, size = 'md', className = '' }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange(setNetworkStatus);
    return unsubscribe;
  }, []);

  const getQualityLevel = () => {
    if (!networkStatus.isOnline) return 0;
    
    const { downlink, rtt } = networkStatus;
    if (downlink > 10 && rtt < 150) return 4; // Excellent
    if (downlink > 5 && rtt < 300) return 3;  // Good
    if (downlink > 1 && rtt < 500) return 2;  // Fair
    if (downlink > 0.5) return 1;            // Poor
    return 0; // No connection
  };

  const getQualityLabel = (level: number) => {
    switch (level) {
      case 4: return 'Excellent';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'No Connection';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-1 h-2';
      case 'lg': return 'w-2 h-6';
      default: return 'w-1.5 h-4';
    }
  };

  const qualityLevel = getQualityLevel();
  const barClasses = getSizeClasses();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`
              ${barClasses}
              rounded-sm transition-colors duration-300
              ${bar <= qualityLevel 
                ? qualityLevel >= 3 
                  ? 'bg-green-500' 
                  : qualityLevel >= 2 
                    ? 'bg-yellow-500' 
                    : 'bg-orange-500'
                : 'bg-gray-300 dark:bg-gray-600'
              }
            `}
          />
        ))}
      </div>
      
      {showLabel && (
        <span className={`text-xs font-medium ${
          qualityLevel >= 3 
            ? 'text-green-600 dark:text-green-400'
            : qualityLevel >= 2 
              ? 'text-yellow-600 dark:text-yellow-400'
              : qualityLevel >= 1
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-red-600 dark:text-red-400'
        }`}>
          {getQualityLabel(qualityLevel)}
        </span>
      )}
    </div>
  );
};

// Custom Hook for Network Status
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => 
    networkService.getNetworkStatus()
  );
  const [queueStatus, setQueueStatus] = useState(() => getQueueStatus());
  const { updateNetworkStatus } = useNetworkToast();

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange((status) => {
      const wasOnline = networkStatus.isOnline;
      setNetworkStatus(status);
      
      // Trigger toast notification on status change
      if (wasOnline !== status.isOnline) {
        updateNetworkStatus(status.isOnline, queueStatus.total);
      }
    });

    const interval = setInterval(() => {
      setQueueStatus(getQueueStatus());
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [networkStatus.isOnline, queueStatus.total, updateNetworkStatus]);

  return {
    networkStatus,
    queueStatus,
    isOnline: networkStatus.isOnline,
    hasQueuedRequests: queueStatus.total > 0,
  };
};

export default NetworkStatusBadge; 