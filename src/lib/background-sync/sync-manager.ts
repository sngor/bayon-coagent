/**
 * Background Sync Operations
 * Handles background sync registration and operation queuing
 */

import { ServiceWorkerManager } from './service-worker-manager';

export interface SyncOperation {
  id: string;
  type: string;
  data: any;
  priority: boolean;
  timestamp: number;
  retryCount?: number;
}

export class SyncManager {
  constructor(private serviceWorkerManager: ServiceWorkerManager) {}

  async isSupported(): Promise<boolean> {
    const registration = this.serviceWorkerManager.getRegistration();
    return !!(registration && 'sync' in window.ServiceWorkerRegistration.prototype);
  }

  async registerSync(tag: string = 'sync-pending-operations'): Promise<boolean> {
    const registration = this.serviceWorkerManager.getRegistration();
    
    if (!registration) {
      console.warn('Service Worker not registered');
      return false;
    }

    if (!await this.isSupported()) {
      console.warn('Background Sync not supported');
      return false;
    }

    try {
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error(`Failed to register background sync: ${tag}`, error);
      return false;
    }
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<boolean> {
    const registration = this.serviceWorkerManager.getRegistration();
    
    if (!registration?.active) {
      console.warn('Service Worker not active');
      return false;
    }

    const syncOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        registration.active!.postMessage({
          type: 'queue-operation',
          operation: syncOperation,
        }, [messageChannel.port2]);
      });
    } catch (error) {
      console.error('Failed to queue operation for background sync:', error);
      return false;
    }
  }

  async triggerSync(): Promise<boolean> {
    return this.registerSync('sync-pending-operations');
  }
}