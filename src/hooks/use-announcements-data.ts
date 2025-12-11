import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthToken } from '@/hooks/use-auth-token';

export interface Announcement {
    announcementId: string;
    title: string;
    content: string;
    richContent?: string;
    targetAudience: 'all' | 'admins' | 'users' | 'specific';
    scheduledFor: string;
    status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    sentAt?: string;
    createdBy: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels: ('email' | 'in_app' | 'push')[];
    metrics?: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        failed: number;
    };
}

interface UseAnnouncementsDataReturn {
    announcements: Announcement[];
    loading: boolean;
    loadData: () => Promise<void>;
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

/**
 * Custom hook for managing announcements data
 * Handles loading, error handling, and state management
 */
export function useAnnouncementsData(): UseAnnouncementsDataReturn {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { getAuthToken } = useAuthToken();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const accessToken = getAuthToken();

            // TODO: Replace with actual API call
            // const { getAnnouncementsAction } = await import('@/app/admin-actions');
            // const result = await getAnnouncementsAction(accessToken);

            // Mock data for now - replace with actual API call
            const mockAnnouncements: Announcement[] = [
                {
                    announcementId: '1',
                    title: 'Platform Maintenance Scheduled',
                    content: 'We will be performing scheduled maintenance on Sunday, December 15th from 2:00 AM to 4:00 AM EST.',
                    targetAudience: 'all',
                    scheduledFor: '2024-12-15T02:00:00Z',
                    status: 'scheduled',
                    createdAt: '2024-12-10T10:00:00Z',
                    updatedAt: '2024-12-10T10:00:00Z',
                    createdBy: 'admin@bayoncoagent.com',
                    priority: 'high',
                    channels: ['email', 'in_app'],
                    metrics: {
                        sent: 0,
                        delivered: 0,
                        opened: 0,
                        clicked: 0,
                        failed: 0,
                    }
                }
            ];

            setAnnouncements(mockAnnouncements);
        } catch (error) {
            console.error('Failed to load announcements:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to load announcements",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        announcements,
        loading,
        loadData,
        setAnnouncements
    };
}