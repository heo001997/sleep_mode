// Retry Service for handling failed operations with exponential backoff
import { networkService, type NetworkStatus } from './networkService';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryOn: (error: any) => boolean;
  abortSignal?: AbortSignal;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export interface RetryOperation<T> {
  id: string;
  operation: () => Promise<T>;
  config: RetryConfig;
  startTime: number;
  attempts: number;
  status: 'pending' | 'retrying' | 'success' | 'failed' | 'aborted';
  lastError?: any;
}

class RetryService {
  private operations: Map<string, RetryOperation<any>> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Default retry configuration
  private readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true,
    retryOn: this.defaultRetryCondition,
  };

  constructor() {
    // Listen to network status changes to retry operations when back online
    networkService.onStatusChange(this.handleNetworkStatusChange);
  }

  private defaultRetryCondition = (error: any): boolean => {
    // Retry on network errors
    if (!error.response && error.request) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 408 || status === 429;
    }

    // Retry on timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  };

  private handleNetworkStatusChange = (status: NetworkStatus): void => {
    if (status.isOnline) {
      this.retryPendingOperations();
    }
  };

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = { ...this.DEFAULT_CONFIG, ...config };
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    const retryOperation: RetryOperation<T> = {
      id: operationId,
      operation,
      config: finalConfig,
      startTime,
      attempts: 0,
      status: 'pending',
    };

    this.operations.set(operationId, retryOperation);

    try {
      const result = await this.attemptOperation(retryOperation);
      this.operations.delete(operationId);
      return result;
    } catch (error) {
      this.operations.delete(operationId);
      return {
        success: false,
        error,
        attempts: retryOperation.attempts,
        totalTime: Date.now() - startTime,
      };
    }
  }

  private async attemptOperation<T>(operation: RetryOperation<T>): Promise<RetryResult<T>> {
    while (operation.attempts <= operation.config.maxRetries) {
      if (operation.config.abortSignal?.aborted) {
        operation.status = 'aborted';
        throw new Error('Operation aborted');
      }

      operation.attempts++;
      operation.status = operation.attempts === 1 ? 'pending' : 'retrying';

      try {
        const result = await operation.operation();
        operation.status = 'success';
        
        return {
          success: true,
          data: result,
          attempts: operation.attempts,
          totalTime: Date.now() - operation.startTime,
        };
      } catch (error) {
        operation.lastError = error;
        console.log(`Operation ${operation.id} attempt ${operation.attempts} failed:`, error);

        // Check if we should retry this error
        if (!operation.config.retryOn(error)) {
          operation.status = 'failed';
          throw error;
        }

        // If this was the last attempt, fail
        if (operation.attempts >= operation.config.maxRetries) {
          operation.status = 'failed';
          throw error;
        }

        // Calculate delay for next retry
        const delay = this.calculateDelay(operation.attempts - 1, operation.config);
        console.log(`Retrying operation ${operation.id} in ${delay}ms`);

        // Wait before retrying
        await this.delay(delay, operation.config.abortSignal);
      }
    }

    // This should never be reached, but TypeScript requires it
    operation.status = 'failed';
    throw operation.lastError || new Error('Max retries exceeded');
  }

  private delay(ms: number, abortSignal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) {
        reject(new Error('Operation aborted'));
        return;
      }

      const timeout = setTimeout(() => {
        resolve();
      }, ms);

      // Handle abort signal
      const abortHandler = () => {
        clearTimeout(timeout);
        reject(new Error('Operation aborted'));
      };

      abortSignal?.addEventListener('abort', abortHandler, { once: true });
    });
  }

  private retryPendingOperations(): void {
    const pendingOperations = Array.from(this.operations.values()).filter(
      op => op.status === 'pending' && op.lastError
    );

    console.log(`Network back online. Retrying ${pendingOperations.length} pending operations`);

    for (const operation of pendingOperations) {
      // Small delay to avoid overwhelming the server
      setTimeout(() => {
        this.attemptOperation(operation).catch(error => {
          console.error(`Failed to retry operation ${operation.id}:`, error);
        });
      }, Math.random() * 1000);
    }
  }

  public cancelOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'aborted';
      this.operations.delete(operationId);
      
      const timeout = this.retryTimeouts.get(operationId);
      if (timeout) {
        clearTimeout(timeout);
        this.retryTimeouts.delete(operationId);
      }
      
      return true;
    }
    return false;
  }

  public getOperationStatus(operationId: string): RetryOperation<any> | undefined {
    return this.operations.get(operationId);
  }

  public getAllOperations(): RetryOperation<any>[] {
    return Array.from(this.operations.values());
  }

  public getActiveOperationsCount(): number {
    return Array.from(this.operations.values()).filter(
      op => op.status === 'pending' || op.status === 'retrying'
    ).length;
  }

  private generateOperationId(): string {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Predefined retry configurations for common scenarios
  public static readonly CONFIGS = {
    // Quick retry for interactive operations
    QUICK: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 2000,
      backoffFactor: 1.5,
      jitter: true,
    },

    // Standard retry for most operations
    STANDARD: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true,
    },

    // Aggressive retry for critical operations
    AGGRESSIVE: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
    },

    // Conservative retry for background operations
    CONSERVATIVE: {
      maxRetries: 3,
      baseDelay: 5000,
      maxDelay: 60000,
      backoffFactor: 3,
      jitter: true,
    },
  } as const;

  // Helper methods for common retry scenarios
  public async retryApiCall<T>(
    apiCall: () => Promise<T>,
    scenario: keyof typeof RetryService.CONFIGS = 'STANDARD'
  ): Promise<T> {
    const result = await this.executeWithRetry(apiCall, RetryService.CONFIGS[scenario]);
    
    if (!result.success) {
      throw result.error;
    }
    
    return result.data!;
  }

  public async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    options: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config: Partial<RetryConfig> = {
      ...RetryService.CONFIGS.STANDARD,
      retryOn: (error: any) => {
        // Always retry network errors
        if (!error.response && error.request) {
          return true;
        }
        
        // Retry server errors and rate limits
        if (error.response?.status >= 500 || error.response?.status === 429) {
          return true;
        }
        
        return false;
      },
      ...options,
    };

    const result = await this.executeWithRetry(operation, config);
    
    if (!result.success) {
      throw result.error;
    }
    
    return result.data!;
  }

  public dispose(): void {
    // Clear all pending timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    // Clear all operations
    this.operations.clear();
  }
}

// Create and export singleton instance
export const retryService = new RetryService();

// Export types
export type { RetryConfig, RetryResult, RetryOperation }; 