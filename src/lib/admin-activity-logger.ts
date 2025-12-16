interface ActivityLog {
    id: string;
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

class AdminActivityLogger {
    private static instance: AdminActivityLogger;
    private logs: ActivityLog[] = [];

    private constructor() { }

    static getInstance(): AdminActivityLogger {
        if (!AdminActivityLogger.instance) {
            AdminActivityLogger.instance = new AdminActivityLogger();
        }
        return AdminActivityLogger.instance;
    }

    async log(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
        const logEntry: ActivityLog = {
            ...activity,
            id: crypto.randomUUID(),
            timestamp: new Date()
        };

        // Store locally for now
        this.logs.push(logEntry);

        // TODO: Send to backend API
        try {
            // await fetch('/api/admin/activity-logs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logEntry)
            // });
            console.log('Activity logged:', logEntry);
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    getRecentLogs(limit = 50): ActivityLog[] {
        return this.logs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    // Convenience methods for common admin actions
    async logTeamCreated(userId: string, teamId: string, teamName: string) {
        await this.log({
            userId,
            action: 'create',
            entity: 'team',
            entityId: teamId,
            details: { teamName }
        });
    }

    async logTeamUpdated(userId: string, teamId: string, changes: Record<string, any>) {
        await this.log({
            userId,
            action: 'update',
            entity: 'team',
            entityId: teamId,
            details: { changes }
        });
    }

    async logTeamDeleted(userId: string, teamId: string, teamName: string) {
        await this.log({
            userId,
            action: 'delete',
            entity: 'team',
            entityId: teamId,
            details: { teamName }
        });
    }

    async logContentModerated(userId: string, contentId: string, action: 'approve' | 'reject', reason?: string) {
        await this.log({
            userId,
            action: 'moderate',
            entity: 'content',
            entityId: contentId,
            details: { moderationAction: action, reason }
        });
    }

    async logBulkOperation(userId: string, operation: string, entity: string, count: number) {
        await this.log({
            userId,
            action: 'bulk_operation',
            entity,
            details: { operation, itemCount: count }
        });
    }
}

export const adminActivityLogger = AdminActivityLogger.getInstance();

// Hook for using activity logger in components
export function useAdminActivityLogger() {
    return {
        logActivity: adminActivityLogger.log.bind(adminActivityLogger),
        logTeamCreated: adminActivityLogger.logTeamCreated.bind(adminActivityLogger),
        logTeamUpdated: adminActivityLogger.logTeamUpdated.bind(adminActivityLogger),
        logTeamDeleted: adminActivityLogger.logTeamDeleted.bind(adminActivityLogger),
        logContentModerated: adminActivityLogger.logContentModerated.bind(adminActivityLogger),
        logBulkOperation: adminActivityLogger.logBulkOperation.bind(adminActivityLogger),
        getRecentLogs: adminActivityLogger.getRecentLogs.bind(adminActivityLogger)
    };
}