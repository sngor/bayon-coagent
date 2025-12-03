export interface Review {
    id: string;
    author: string;
    rating: number;
    date: string;
    content: string;
    source: string;
}

export interface Profile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    role?: string;
}

export interface MarketingTask {
    id: string;
    task: string;
    rationale: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate?: string;
}

export interface MarketingPlan {
    id: string;
    title: string;
    steps: MarketingTask[];
    createdAt: string;
}

export interface BrandAudit {
    id: string;
    score: number;
    findings: string[];
    recommendations: string[];
    date: string;
}

export interface Competitor {
    id: string;
    name: string;
    website?: string;
    strengths?: string[];
    weaknesses?: string[];
}

export interface Testimonial {
    id: string;
    userId: string;
    clientName: string;
    testimonialText: string;
    dateReceived: string;
    clientPhotoUrl?: string;
    isFeatured: boolean;
    displayOrder?: number;
    tags: string[];
    requestId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface TestimonialRequest {
    id: string;
    userId: string;
    clientName: string;
    clientEmail: string;
    status: 'pending' | 'submitted' | 'expired';
    submissionLink: string;
    sentAt: string;
    reminderSentAt?: string;
    submittedAt?: string;
    expiresAt: string;
    createdAt: number;
    updatedAt: number;
}

export type TestimonialStatus = 'pending' | 'submitted' | 'expired';

// ==================== AI Search Monitoring Types ====================

export interface AIMention {
    id: string;
    userId: string;
    platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
    query: string;
    queryCategory: 'general' | 'expertise' | 'comparison';
    response: string; // Full AI response
    snippet: string; // Excerpt containing mention
    sentiment: 'positive' | 'neutral' | 'negative';
    sentimentReason: string;
    topics: string[];
    expertiseAreas: string[];
    prominence: 'high' | 'medium' | 'low';
    position: number; // Character position in response
    timestamp: string;
    createdAt: number;
    updatedAt: number;
}

export interface AIVisibilityScore {
    id: string;
    userId: string;
    score: number; // 0-100
    breakdown: {
        mentionFrequency: number;
        sentimentScore: number;
        prominenceScore: number;
        platformDiversity: number;
    };
    mentionCount: number;
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    platformBreakdown: {
        chatgpt: number;
        perplexity: number;
        claude: number;
        gemini: number;
    };
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    previousScore: number;
    calculatedAt: string;
    periodStart: string;
    periodEnd: string;
    createdAt: number;
    updatedAt: number;
}

export interface AIMonitoringConfig {
    id: string;
    userId: string;
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    platforms: Array<'chatgpt' | 'perplexity' | 'claude' | 'gemini'>;
    queryTemplates: string[]; // IDs of templates to use
    alertThreshold: number; // Score change percentage to trigger alert
    lastExecuted: string;
    nextScheduled: string;
    queriesThisPeriod: number;
    queryLimit: number;
    createdAt: number;
    updatedAt: number;
}

export interface AIMonitoringJob {
    id: string;
    userId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    queriesExecuted: number;
    mentionsFound: number;
    errors: string[];
    costEstimate: number; // API cost in USD
    createdAt: number;
    updatedAt: number;
}

export interface AIVisibilityAlert {
    id: string;
    userId: string;
    type: 'score_increase' | 'score_decrease' | 'negative_mention' | 'new_platform' | 'competitor_change';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    currentScore?: number;
    previousScore?: number;
    changePercentage?: number;
    mentionId?: string;
    platform?: string;
    timestamp: string;
    notificationSent: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface APIUsageRecord {
    id: string;
    userId: string;
    platform: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
    queryCount: number;
    estimatedCost: number; // in USD
    timestamp: string;
    periodStart: string;
    periodEnd: string;
    createdAt: number;
    updatedAt: number;
}

export interface UserBudget {
    id: string;
    userId: string;
    monthlyLimit: number; // in USD
    currentSpend: number; // in USD
    periodStart: string;
    periodEnd: string;
    alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9] for 50%, 75%, 90%
    alertsSent: number[]; // Track which thresholds have triggered
    autoReduceFrequency: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface CostSpikeAlert {
    id: string;
    userId: string;
    currentSpend: number;
    previousPeriodSpend: number;
    percentageIncrease: number;
    timestamp: string;
    acknowledged: boolean;
    createdAt: number;
}
