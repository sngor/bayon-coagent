export interface AdminDashboardStats {
    totalUsers: number;
    activeUsers: number;
    newSignups24h: number;
    pendingInvitations: number;
    systemStatus: string;
    openTickets: number;
    pendingContent: number;
    errorRate: number;
    alerts: AdminAlert[];
}

export interface AdminAlert {
    message: string;
    severity: 'info' | 'warning' | 'critical';
    action?: {
        href: string;
        label: string;
    };
}

export interface AdminActivity {
    id: string;
    description: string;
    timestamp: string;
    userId?: string;
    type: 'user_action' | 'system_event' | 'admin_action';
}