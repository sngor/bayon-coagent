'use client';

import { useState, useEffect } from 'react';
import { getUnreadAlertCountAction } from '@/app/actions';

export function useUnreadAlertCount() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUnreadCount = async () => {
        try {
            const result = await getUnreadAlertCountAction();
            if (result.message === 'Unread alert count retrieved successfully' && result.data) {
                setUnreadCount(result.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread alert count:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Refresh count every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        unreadCount,
        isLoading,
        refetch: fetchUnreadCount,
    };
}