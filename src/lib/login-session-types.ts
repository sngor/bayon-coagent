export interface LoginSession {
    sessionId: string;
    userId: string;
    deviceType: string;
    os?: string;
    browser?: string;
    location?: {
        city?: string;
        region?: string;
        country?: string;
    };
    timestamp: number;
    isActive: boolean;
    ipAddress?: string;
}
