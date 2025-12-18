// Shared types for admin functionality
export interface Team {
    id: string;
    name: string;
    adminId: string;
    memberCount?: number;
    createdAt: string;
}

export interface User {
    id: string;
    name?: string;
    email: string;
    role: 'admin' | 'super_admin' | 'user';
}

export interface AdminActionResult<T = any> {
    message: string;
    data?: T;
    errors?: string[];
}

// Dashboard Stats
export interface AdminDashboardStats {
    totalUsers: number;
    activeUsers?: number;
    newSignups24h?: number;
    pendingInvitations?: number;
    openTickets?: number;
    pendingContent?: number;
    errorRate?: number;
    alerts?: AdminAlert[];
    totalFeedback: number;
    pendingFeedback: number;
    totalAiRequests: number;
    totalAiCosts: number;
    activeFeatures: number;
    betaFeatures: number;
    systemStatus: 'Healthy' | 'Degraded' | 'Down' | 'Checking...';
    totalTeams?: number;
    activeSubscriptions?: number;
    canceledSubscriptions?: number;
    trialSubscriptions?: number;
    totalRevenue?: number;
    monthlyRecurringRevenue?: number;
    paymentFailures?: number;
    churnRate?: number;
    averageRevenuePerUser?: number;
    lifetimeValue?: number;
}

export interface AdminAlert {
    message: string;
    severity: 'info' | 'warning' | 'critical';
    action?: {
        label: string;
        href: string;
    };
}