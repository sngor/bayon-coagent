export interface ContentItem {
    id: string;
    type: 'blog_post' | 'social_media' | 'listing_description' | 'image' | 'video';
    title: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    updatedAt?: string;
    flagReason?: string;
    moderatedBy?: string;
    moderatedAt?: string;
    metadata?: {
        wordCount?: number;
        imageUrl?: string;
        videoUrl?: string;
        tags?: string[];
    };
}

export interface ModerationAction {
    id: string;
    contentId: string;
    moderatorId: string;
    moderatorName: string;
    action: 'approve' | 'reject' | 'flag';
    reason?: string;
    timestamp: string;
}

export interface ContentModerationFilters {
    status: 'all' | ContentItem['status'];
    type: 'all' | ContentItem['type'];
    dateRange?: {
        start: string;
        end: string;
    };
    userId?: string;
}

export interface ContentModerationStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    todayCount: number;
    weeklyTrend: number;
}