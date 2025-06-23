import { useEffect, useRef, useCallback } from 'react';
import { createPollingInterval, createVisibilityChangeListener } from '../utils';

interface UseRealTimeUpdatesOptions {
  onUpdate: () => void | Promise<void>;
  intervalMs?: number;
  enableVisibilityPolling?: boolean;
  enabled?: boolean;
}

export const useRealTimeUpdates = ({
  onUpdate,
  intervalMs = 30000, // 30 seconds default
  enableVisibilityPolling = true,
  enabled = true
}: UseRealTimeUpdatesOptions) => {
  const cleanupPolling = useRef<(() => void) | null>(null);
  const cleanupVisibility = useRef<(() => void) | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());

  const handleUpdate = useCallback(async () => {
    const now = Date.now();
    // Prevent too frequent updates (minimum 5 seconds between updates)
    if (now - lastUpdateTime.current < 5000) {
      return;
    }
    
    lastUpdateTime.current = now;
    await onUpdate();
  }, [onUpdate]);

  const startPolling = useCallback(() => {
    if (!enabled) return;
    
    // Clean up existing polling
    if (cleanupPolling.current) {
      cleanupPolling.current();
    }
    
    // Start new polling
    cleanupPolling.current = createPollingInterval(handleUpdate, intervalMs);
  }, [handleUpdate, intervalMs, enabled]);

  const stopPolling = useCallback(() => {
    if (cleanupPolling.current) {
      cleanupPolling.current();
      cleanupPolling.current = null;
    }
  }, []);

  const startVisibilityListener = useCallback(() => {
    if (!enabled || !enableVisibilityPolling) return;
    
    // Clean up existing listener
    if (cleanupVisibility.current) {
      cleanupVisibility.current();
    }
    
    // Start new visibility listener
    cleanupVisibility.current = createVisibilityChangeListener(
      handleUpdate, // Refresh when tab becomes visible
      stopPolling   // Stop polling when tab is hidden
    );
  }, [handleUpdate, stopPolling, enabled, enableVisibilityPolling]);

  // Initialize polling and visibility listener
  useEffect(() => {
    if (enabled) {
      startPolling();
      startVisibilityListener();
    } else {
      stopPolling();
      if (cleanupVisibility.current) {
        cleanupVisibility.current();
        cleanupVisibility.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
      if (cleanupVisibility.current) {
        cleanupVisibility.current();
      }
    };
  }, [enabled, startPolling, startVisibilityListener, stopPolling]);

  // Update polling interval when it changes
  useEffect(() => {
    if (enabled) {
      startPolling();
    }
  }, [intervalMs, startPolling, enabled]);

  return {
    startPolling,
    stopPolling,
    forceUpdate: handleUpdate
  };
}; 