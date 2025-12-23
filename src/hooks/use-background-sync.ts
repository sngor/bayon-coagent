/**
 * React Hook for Background Sync
 * Provides a clean React interface for background sync operations
 */

import { useEffect, useState, useCallback } from 'react';
import { backgroundSyncManager } from '@/lib/background-sync-manager';
import type { BackgroundSyncEvent } from '@/lib/background-sync';

interface UseBackgroundSyncReturn {
  isSupported: boolean;
  isAvailable: boolean;
  isInitialized: boolean;
  queueOperation: (operation: any, priority?: boolean) => Promise<boolean>;
  triggerSync: () => Promise<boolean>;
  events: BackgroundSyncEvent[];
}

export function useBackgroundSync(): UseBackgroundSyncReturn {
  const [isSupported] = useState(() => backgroundSyncManager.isBackgroundSyncSupported());
  const [isAvailable, setIsAvailable] = useState(() => backgroundSyncManager.isBackgroundSyncAvailable());
  const [events, setEvents] = useState<BackgroundSyncEvent[]>([]);

  const queueOperation = useCallback(async (operation: any, priority = false) => {
    return backgroundSyncManager.queueOperationForBackgroundSync(operation, priority);
  }, []);

  const triggerSync = useCallback(async () => {
    return backgroundSyncManager.triggerBackgroundSync();
  }, []);

  useEffect(() => {
    // Subscribe to background sync events
    const unsubscribe = backgroundSyncManager.onBackgroundSyncEvent((event) => {
      setEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    });

    // Update availability status periodically
    const interval = setInterval(() => {
      setIsAvailable(backgroundSyncManager.isBackgroundSyncAvailable());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    isSupported,
    isAvailable,
    isInitialized: isAvailable, // For backward compatibility
    queueOperation,
    triggerSync,
    events,
  };
}