import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContentItem } from '@/types/content-moderation';
import { useToast } from '@/hooks/use-toast';

export function useContentModeration() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Memoized content statistics for performance
    const contentStats = useMemo(() => {
        return {
            total: content.length,
            pending: content.filter(item => item.status === 'pending').length,
            approved: content.filter(item => item.status === 'approved').length,
            rejected: content.filter(item => item.status === 'rejected').length,
            flagged: content.filter(item => item.status === 'flagged').length,
        };
    }, [content]);

    const loadContent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Replace with actual API call
            const mockContent: ContentItem[] = [
                {
                    id: '1',
                    type: 'blog_post',
                    title: 'Market Trends in Downtown Seattle',
                    content: 'The Seattle real estate market continues to show strong growth...',
                    status: 'approved',
                    createdAt: '2024-12-10T10:00:00Z',
                    userId: 'user1',
                    userName: 'John Agent',
                    userEmail: 'john@example.com',
                    moderatedAt: '2024-12-10T11:00:00Z',
                    moderatedBy: 'admin@bayoncoagent.com'
                },
                {
                    id: '2',
                    type: 'social_media',
                    title: 'Instagram Post - New Listing',
                    content: 'Check out this amazing waterfront property! 🏡✨',
                    status: 'pending',
                    createdAt: '2024-12-10T09:00:00Z',
                    userId: 'user2',
                    userName: 'Sarah Realtor',
                    userEmail: 'sarah@example.com'
                },
                {
                    id: '3',
                    type: 'listing_description',
                    title: 'Luxury Waterfront Condo',
                    content: 'Stunning 2-bedroom waterfront condo with panoramic views...',
                    status: 'flagged',
                    createdAt: '2024-12-09T15:30:00Z',
                    userId: 'user3',
                    userName: 'Mike Broker',
                    userEmail: 'mike@example.com',
                    flagReason: 'Contains potentially misleading claims about property features'
                }
            ];
            setContent(mockContent);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load content";
            console.error('Failed to load content:', error);
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const moderateContent = useCallback(async (contentId: string, action: 'approve' | 'reject', reason?: string) => {
        try {
            // TODO: Replace with actual API call
            setContent(prev => prev.map(item =>
                item.id === contentId
                    ? {
                        ...item,
                        status: action === 'approve' ? 'approved' : 'rejected',
                        flagReason: action === 'reject' ? reason : undefined,
                        moderatedAt: new Date().toISOString(),
                        moderatedBy: 'admin@bayoncoagent.com'
                    }
                    : item
            ));

            const actionText = action === 'approve' ? 'approved' : 'rejected';
            toast({
                title: `Content ${actionText}`,
                description: `Content has been ${actionText}${action === 'reject' && reason ? ` (${reason})` : ''}`
            });
        } catch (error) {
            console.error(`Failed to ${action} content:`, error);
            toast({
                title: "Error",
                description: `Failed to ${action} content`,
                variant: "destructive"
            });
        }
    }, [toast]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    return {
        content,
        loading,
        error,
        contentStats,
        setContent,
        moderateContent,
        refreshContent: loadContent
    };
}