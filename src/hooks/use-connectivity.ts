/**
 * React Hook for Connectivity Monitoring
 * 
 * Provides access to network connectivity status in React components.
 * 
 * Requirements: 6.1, 6.3
 */

'use client';

import { useEffect, useState } from 'react';
import {
    connectivityMonitor,
    type ConnectionStatus,
    type ConnectionInfo,
} from '@/lib/mobile/connectivity-monitor';

export interface UseConnectivityReturn {
    status: ConnectionStatus;
    isOnline: boolean;
    isOffline: boolean;
    isSlow: boolean;
    connectionInfo: ConnectionInfo;
}

export function useConnectivity(): UseConnectivityReturn {
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
        status: 'online',
    });

    useEffect(() => {
        // Subscribe to connection status changes
        const unsubscribe = connectivityMonitor.onStatusChange((info) => {
            setConnectionInfo(info);
        });

        return unsubscribe;
    }, []);

    return {
        status: connectionInfo.status,
        isOnline: connectionInfo.status === 'online',
        isOffline: connectionInfo.status === 'offline',
        isSlow: connectionInfo.status === 'slow',
        connectionInfo,
    };
}
