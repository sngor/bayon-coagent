/**
 * Admin Dashboard Type Definitions
 * Centralized types for better type safety and maintainability
 */

// Dashboard Stats
export interface AdminDashboardStats {
    totalUsers: number;
    totalFeedback: number;
    pendingFeedback: number;
    totalAiRequests: number;
    totalAiCosts: number;
    activeFeatures: number;
    betaFeatures: number;
    systemStatus: 'Healthy' | 'Degraded' | 'Down' | 'Checking...';
    // Additional metrics
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

// Recent Activity
export interface AdminActivity {
    id: string;
    description: string;
    timestamp: string;
    user: {
        id: string;
        email: string;
        name?: string;
    };
    type: 'login' | 'feature_usage' | 'system_event' | 'error';
    metadata?: Record<string, any>;
}

// Support Tickets
export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
    userEmail: string;
    userName: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
    responses: TicketResponse[];
}

export interface TicketResponse {
    id: string;
    message: string;
    isFromUser: boolean;
    authorName: string;
    createdAt: string;
    attachments?: string[];
}

// System Health
export interface SystemHealthStatus {
    overall: 'healthy' | 'degraded' | 'down';
    services: {
        database: ServiceStatus;
        api: ServiceStatus;
        auth: ServiceStatus;
        storage: ServiceStatus;
        ai: ServiceStatus;
    };
    lastChecked: string;
    uptime: number; // percentage
}

export interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number; // ms
    lastError?: string;
    lastChecked: string;
}

// Management Area Configuration
export interface ManagementArea {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconBgColor: string;
    hoverBgColor: string;
    metrics: ManagementMetric[];
    actions: ManagementAction[];
}

export interface ManagementMetric {
    label: string;
    value: string | number;
    bgColor: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export interface ManagementAction {
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'destructive';
}

// API Response Types
export interface AdminApiResponse<T = any> {
    message: 'success' | 'error';
    data?: T;
    errors?: string[];
    timestamp?: string;
}

// Filter Types
export interface TicketFilters {
    status: string;
    priority: string;
    category: string;
    search: string;
}

// Billing Types (if needed for admin)
export interface BillingMetrics {
    totalRevenue: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    trialSubscriptions: number;
    monthlyRecurringRevenue: number;
    paymentFailures: number;
    churnRate: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
}

// Export utility types
export type TicketStatus = SupportTicket['status'];
export type TicketPriority = SupportTicket['priority'];
export type TicketCategory = SupportTicket['category'];
export type SystemStatus = SystemHealthStatus['overall'];