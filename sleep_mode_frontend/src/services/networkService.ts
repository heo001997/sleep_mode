// Network Service for offline detection and connectivity monitoring
import { storage } from '../utils';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  priority: 'low' | 'medium' | 'high';
}

class NetworkService {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'network_request_queue';
  private readonly CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TEST_URL = '/api/v1/health'; // Health check endpoint

  constructor() {
    this.initializeEventListeners();
    this.loadQueueFromStorage();
    this.startConnectionMonitoring();
  }

  private initializeEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);

    // Listen for connection type changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }
  }

  private handleOnlineStatusChange = (): void => {
    const status = this.getNetworkStatus();
    this.notifyListeners(status);

    if (status.isOnline) {
      this.processQueue();
    }
  };

  private handleConnectionChange = (): void => {
    const status = this.getNetworkStatus();
    this.notifyListeners(status);
  };

  private startConnectionMonitoring(): void {
    // Periodic connection quality check
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectionQuality();
    }, this.CONNECTION_CHECK_INTERVAL);
  }

  private async checkConnectionQuality(): Promise<void> {
    try {
      const startTime = performance.now();
      const response = await fetch(this.CONNECTION_TEST_URL, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = performance.now();
      
      if (response.ok) {
        const latency = endTime - startTime;
        console.log('Connection quality check:', { latency, status: 'ok' });
      }
    } catch (error) {
      console.log('Connection quality check failed:', error);
      // If health check fails but we think we're online, we might have limited connectivity
      if (navigator.onLine) {
        this.notifyListeners({ 
          ...this.getNetworkStatus(), 
          isOnline: false // Override since we can't reach our API
        });
      }
    }
  }

  public getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }

  public onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.getNetworkStatus());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(callback => callback(status));
  }

  public queueRequest(
    url: string,
    method: string,
    data?: any,
    headers?: Record<string, string>,
    options: Partial<RetryOptions> = {}
  ): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedRequest: QueuedRequest = {
      id: requestId,
      url,
      method: method.toUpperCase(),
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'medium',
    };

    this.requestQueue.push(queuedRequest);
    this.sortQueueByPriority();
    this.saveQueueToStorage();

    // Try to process immediately if online
    if (this.getNetworkStatus().isOnline) {
      this.processQueue();
    }

    return requestId;
  }

  private sortQueueByPriority(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    this.requestQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    if (!this.getNetworkStatus().isOnline) {
      console.log('Cannot process queue: offline');
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing ${this.requestQueue.length} queued requests`);

    const requests = [...this.requestQueue];
    const processedIds: string[] = [];

    for (const request of requests) {
      try {
        await this.executeQueuedRequest(request);
        processedIds.push(request.id);
        console.log(`Successfully processed request ${request.id}`);
      } catch (error) {
        console.error(`Failed to process request ${request.id}:`, error);
        
        request.retryCount++;
        if (request.retryCount >= request.maxRetries) {
          console.log(`Request ${request.id} exceeded max retries, removing from queue`);
          processedIds.push(request.id);
        }
      }

      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Remove processed requests from queue
    this.requestQueue = this.requestQueue.filter(req => !processedIds.includes(req.id));
    this.saveQueueToStorage();
    this.isProcessingQueue = false;

    console.log(`Queue processing complete. ${this.requestQueue.length} requests remaining.`);
  }

  private async executeQueuedRequest(request: QueuedRequest): Promise<any> {
    const { url, method, data, headers } = request;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public removeFromQueue(requestId: string): boolean {
    const initialLength = this.requestQueue.length;
    this.requestQueue = this.requestQueue.filter(req => req.id !== requestId);
    
    if (this.requestQueue.length < initialLength) {
      this.saveQueueToStorage();
      return true;
    }
    
    return false;
  }

  public getQueueStatus(): {
    total: number;
    byPriority: Record<string, number>;
    oldestTimestamp: number | null;
  } {
    const byPriority = { high: 0, medium: 0, low: 0 };
    let oldestTimestamp: number | null = null;

    for (const request of this.requestQueue) {
      byPriority[request.priority]++;
      
      if (oldestTimestamp === null || request.timestamp < oldestTimestamp) {
        oldestTimestamp = request.timestamp;
      }
    }

    return {
      total: this.requestQueue.length,
      byPriority,
      oldestTimestamp,
    };
  }

  public clearQueue(): void {
    this.requestQueue = [];
    this.saveQueueToStorage();
  }

  private saveQueueToStorage(): void {
    try {
      storage.set(this.STORAGE_KEY, this.requestQueue);
    } catch (error) {
      console.error('Failed to save request queue to storage:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const saved = storage.get<QueuedRequest[]>(this.STORAGE_KEY);
      if (Array.isArray(saved)) {
        this.requestQueue = saved;
        this.sortQueueByPriority();
        console.log(`Loaded ${this.requestQueue.length} requests from storage`);
      }
    } catch (error) {
      console.error('Failed to load request queue from storage:', error);
      this.requestQueue = [];
    }
  }

  public dispose(): void {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleConnectionChange);
    }

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    this.listeners.clear();
  }
}

// Create and export singleton instance
export const networkService = new NetworkService();

// Export types
export type { NetworkStatus, QueuedRequest, RetryOptions }; 