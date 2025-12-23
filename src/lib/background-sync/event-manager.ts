/**
 * Background Sync Event Management
 * Handles event emission and subscription for background sync operations
 */

export interface BackgroundSyncEvent {
  type: 'sync-started' | 'sync-progress' | 'sync-completed' | 'sync-failed' | 'notification-click';
  operationId?: string;
  progress?: number;
  operationsProcessed?: number;
  failures?: number;
  timestamp: number;
  error?: string;
  notificationData?: any;
  action?: string;
}

export type BackgroundSyncCallback = (event: BackgroundSyncEvent) => void;

export class BackgroundSyncEventManager {
  private callbacks = new Set<BackgroundSyncCallback>();

  subscribe(callback: BackgroundSyncCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  emit(event: BackgroundSyncEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in background sync event callback:', error);
      }
    });
  }

  handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data?.type === 'background-sync-event') {
      const syncEvent: BackgroundSyncEvent = {
        type: event.data.eventType,
        operationId: event.data.operationId,
        progress: event.data.progress,
        operationsProcessed: event.data.operationsProcessed,
        failures: event.data.failures,
        timestamp: event.data.timestamp || Date.now(),
        error: event.data.error,
        notificationData: event.data.notificationData,
        action: event.data.action
      };

      this.emit(syncEvent);
    }
  }

  destroy(): void {
    this.callbacks.clear();
  }
}