/**
 * Common types for background sync operations
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface BackgroundSyncConfig {
  enabled: boolean;
  serviceWorkerPath?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface SyncOperationResult {
  operationId: string;
  success: boolean;
  error?: string;
  timestamp: number;
}