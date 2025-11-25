'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    getClientDashboardKeys,
    getSecuredLinkKeys,
    getDashboardAnalyticsKeys,
} from '@/aws/dynamodb/keys';
import { getCurrentUser } from '@/aws/auth/cognito-client';

// ==================== Types ====================

export type ClientDashboard = {
    id: string;
    agentId: string;
    clientInfo: {
        name: string;
        email: string;
        phone?: string;
        propertyInterests?: string;
        notes?: string;
    };
    dashboardConfig: {
        enableCMA: boolean;
        enablePropertySearch: boolean;
        enableHomeValuation: boolean;
        enableDocuments: boolean;
    };
    branding: {
        logoUrl?: string;
        logoS3Key?: string;
        primaryColor: string;
        welcomeMessage: string;
        agentContact: {
            phone: string;
            email: string;
        };
    };
    cmaData?: {
        subjectProperty: {
            address: string;
            beds: number;
            baths: number;
            sqft: number;
            yearBuilt: number;
        };
        comparables: Array<{
            address: string;
            soldPrice: number;
            soldDate: string;
            beds: number;
            baths: number;
            sqft: number;
            distance: number;
        }>;
        marketTrends: {
            medianPrice: number;
            daysOnMarket: number;
            inventoryLevel: 'low' | 'medium' | 'high';
        };
        priceRecommendation: {
            low: number;
            mid: number;
            high: number;
        };
        agentNotes?: string;
    };
    createdAt: number;
    updatedAt: number;
};

export type SecuredLink = {
    token: string;
    dashboardId: string;
    agentId: string;
    expiresAt: number;
    accessCount: number;
    lastAccessedAt?: number;
    createdAt: number;
    revoked: boolean;
};

export type DashboardAnalytics = {
    dashboardId: string;
    views: number;
    lastViewedAt?: number;
    propertyViews: Array<{
        propertyId: string;
        viewedAt: number;
    }>;
    documentDownloads: Array<{
        documentId: string;
        downloadedAt: number;
    }>;
    contactRequests: Array<{
        type: string;
        message: string;
        requestedAt: number;
    }>;
};

// ==================== Validation Schemas ====================

const clientInfoSchema = z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    propertyInterests: z.string().optional(),
    notes: z.string().optional(),
});

const dashboardConfigSchema = z.object({
    enableCMA: z.boolean().default(false),
    enablePropertySearch: z.boolean().default(true),
    enableHomeValuation: z.boolean().default(true),
    enableDocuments: z.boolean().default(true),
});

const brandingSchema = z.object({
    logoUrl: z.string().optional(),
    logoS3Key: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid hex color required').default('#3b82f6'),
    welcomeMessage: z.string().min(1, 'Welcome message is required'),
    agentContact: z.object({
        phone: z.string().min(1, 'Agent phone is required'),
        email: z.string().email('Valid agent email is required'),
    }),
});

const createDashboardSchema = z.object({
    clientInfo: clientInfoSchema,
    dashboardConfig: dashboardConfigSchema,
    branding: brandingSchema,
});

const updateDashboardSchema = z.object({
    dashboardId: z.string().min(1, 'Dashboard ID is required'),
    clientInfo: clientInfoSchema.optional(),
    dashboardConfig: dashboardConfigSchema.optional(),
    branding: brandingSchema.optional(),
    cmaData: z.any().optional(),
});

const generateLinkSchema = z.object({
    dashboardId: z.string().min(1, 'Dashboard ID is required'),
    expirationDays: z.number().min(1).max(90).default(30),
});

const revokeLinkSchema = z.object({
    dashboardId: z.string().min(1, 'Dashboard ID is required'),
});

// ==================== Helper Functions ====================

/**
 * Generate a secure random token for dashboard links
 */
function generateSecureToken(): string {
    return uuidv4().replace(/-/g, '');
}

/**
 * Calculate expiration timestamp based on days from now
 */
function calculateExpiration(days: number): number {
    return Date.now() + (days * 24 * 60 * 60 * 1000);
}

/**
 * Maps errors to user-friendly messages
 */
const handleError = (error: any, defaultMessage: string): string => {
    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        if (lowerCaseMessage.includes('not found')) {
            return 'Dashboard not found';
        }
        if (lowerCaseMessage.includes('already exists')) {
            return 'A dashboard for this client already exists';
        }
        if (lowerCaseMessage.includes('unauthorized') || lowerCaseMessage.includes('permission')) {
            return 'You do not have permission to perform this action';
        }

        // Return the original error message if it's user-friendly
        if (error.message && error.message.length < 200) {
            return error.message;
        }
    }

    console.error('Client Dashboard Error:', error);
    return defaultMessage;
};

// ==================== Server Actions ====================

/**
 * Create a new client dashboard
 * Requirements: 1.1, 1.2, 3.1, 9.1
 */
export async function createDashboard(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ClientDashboard | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to create dashboards'] },
            };
        }

        // Parse and validate input
        const rawData = {
            clientInfo: {
                name: formData.get('clientName'),
                email: formData.get('clientEmail'),
                phone: formData.get('clientPhone') || undefined,
                propertyInterests: formData.get('propertyInterests') || undefined,
                notes: formData.get('notes') || undefined,
            },
            dashboardConfig: {
                enableCMA: formData.get('enableCMA') === 'true',
                enablePropertySearch: formData.get('enablePropertySearch') === 'true',
                enableHomeValuation: formData.get('enableHomeValuation') === 'true',
                enableDocuments: formData.get('enableDocuments') === 'true',
            },
            branding: {
                logoUrl: formData.get('logoUrl') || undefined,
                logoS3Key: formData.get('logoS3Key') || undefined,
                primaryColor: formData.get('primaryColor') || '#3b82f6',
                welcomeMessage: formData.get('welcomeMessage'),
                agentContact: {
                    phone: formData.get('agentPhone'),
                    email: formData.get('agentEmail'),
                },
            },
        };

        const validatedFields = createDashboardSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Generate unique dashboard ID
        const dashboardId = `dashboard-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const now = Date.now();

        // Create dashboard object
        const dashboard: ClientDashboard = {
            id: dashboardId,
            agentId: user.id,
            clientInfo: validatedFields.data.clientInfo,
            dashboardConfig: validatedFields.data.dashboardConfig,
            branding: validatedFields.data.branding,
            createdAt: now,
            updatedAt: now,
        };

        // Save to DynamoDB
        const repository = getRepository();
        const keys = getClientDashboardKeys(user.id, dashboardId);

        await repository.create<ClientDashboard>(
            keys.PK,
            keys.SK,
            'ClientDashboard',
            dashboard
        );

        return {
            message: 'success',
            data: dashboard,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to create dashboard');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Update an existing client dashboard
 * Requirements: 1.1, 3.1
 */
export async function updateDashboard(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ClientDashboard | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to update dashboards'] },
            };
        }

        const dashboardId = formData.get('dashboardId') as string;
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        // Get existing dashboard
        const repository = getRepository();
        const keys = getClientDashboardKeys(user.id, dashboardId);
        const existingDashboard = await repository.get<ClientDashboard>(keys.PK, keys.SK);

        if (!existingDashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        // Parse updates
        const updates: Partial<ClientDashboard> = {
            updatedAt: Date.now(),
        };

        // Update client info if provided
        if (formData.get('clientName')) {
            updates.clientInfo = {
                name: formData.get('clientName') as string,
                email: formData.get('clientEmail') as string,
                phone: (formData.get('clientPhone') as string) || undefined,
                propertyInterests: (formData.get('propertyInterests') as string) || undefined,
                notes: (formData.get('notes') as string) || undefined,
            };
        }

        // Update dashboard config if provided
        if (formData.has('enableCMA')) {
            updates.dashboardConfig = {
                enableCMA: formData.get('enableCMA') === 'true',
                enablePropertySearch: formData.get('enablePropertySearch') === 'true',
                enableHomeValuation: formData.get('enableHomeValuation') === 'true',
                enableDocuments: formData.get('enableDocuments') === 'true',
            };
        }

        // Update branding if provided
        if (formData.get('welcomeMessage')) {
            updates.branding = {
                logoUrl: (formData.get('logoUrl') as string) || existingDashboard.branding.logoUrl,
                logoS3Key: (formData.get('logoS3Key') as string) || existingDashboard.branding.logoS3Key,
                primaryColor: (formData.get('primaryColor') as string) || existingDashboard.branding.primaryColor,
                welcomeMessage: formData.get('welcomeMessage') as string,
                agentContact: {
                    phone: (formData.get('agentPhone') as string) || existingDashboard.branding.agentContact.phone,
                    email: (formData.get('agentEmail') as string) || existingDashboard.branding.agentContact.email,
                },
            };
        }

        // Update CMA data if provided
        const cmaDataStr = formData.get('cmaData') as string;
        if (cmaDataStr) {
            try {
                updates.cmaData = JSON.parse(cmaDataStr);
            } catch (e) {
                console.error('Failed to parse CMA data:', e);
            }
        }

        // Merge updates with existing dashboard
        const updatedDashboard: ClientDashboard = {
            ...existingDashboard,
            ...updates,
        };

        // Save to DynamoDB
        await repository.update<ClientDashboard>(
            keys.PK,
            keys.SK,
            updatedDashboard
        );

        return {
            message: 'success',
            data: updatedDashboard,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to update dashboard');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Generate a secured link for a dashboard
 * Requirements: 1.1, 2.1
 */
export async function generateSecuredLink(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { link: string; expiresAt: number } | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to generate links'] },
            };
        }

        // Validate input
        const rawData = {
            dashboardId: formData.get('dashboardId'),
            expirationDays: parseInt(formData.get('expirationDays') as string) || 30,
        };

        const validatedFields = generateLinkSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { dashboardId, expirationDays } = validatedFields.data;

        // Verify dashboard exists and belongs to agent
        const repository = getRepository();
        const dashboardKeys = getClientDashboardKeys(user.id, dashboardId);
        const dashboard = await repository.get<ClientDashboard>(dashboardKeys.PK, dashboardKeys.SK);

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        // Generate secure token
        const token = generateSecureToken();
        const expiresAt = calculateExpiration(expirationDays);
        const now = Date.now();

        // Create secured link object
        const securedLink: SecuredLink = {
            token,
            dashboardId,
            agentId: user.id,
            expiresAt,
            accessCount: 0,
            createdAt: now,
            revoked: false,
        };

        // Save to DynamoDB
        const linkKeys = getSecuredLinkKeys(token, user.id, dashboardId);
        await repository.create<SecuredLink>(
            linkKeys.PK,
            linkKeys.SK,
            'SecuredLink',
            securedLink
        );

        // Generate the full URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const link = `${baseUrl}/d/${token}`;

        return {
            message: 'success',
            data: { link, expiresAt },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to generate link');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Revoke a secured link for a dashboard
 * Requirements: 1.1
 */
export async function revokeLink(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to revoke links'] },
            };
        }

        const dashboardId = formData.get('dashboardId') as string;
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        // Query for all links for this dashboard using GSI1
        const repository = getRepository();

        // Note: This requires querying GSI1 with AGENT#<agentId> as PK and DASHBOARD#<dashboardId> as SK
        // For now, we'll mark this as a simplified implementation
        // In production, you'd query GSI1 to find all links for this dashboard

        // Simplified: Assume we have the token from formData
        const token = formData.get('token') as string;
        if (!token) {
            return {
                message: 'Link token is required',
                data: null,
                errors: { token: ['Link token is required'] },
            };
        }

        const linkKeys = getSecuredLinkKeys(token);
        const link = await repository.get<SecuredLink>(linkKeys.PK, linkKeys.SK);

        if (!link) {
            return {
                message: 'Link not found',
                data: null,
                errors: { token: ['Link not found'] },
            };
        }

        // Verify ownership
        if (link.agentId !== user.id) {
            return {
                message: 'Unauthorized',
                data: null,
                errors: { auth: ['You do not have permission to revoke this link'] },
            };
        }

        // Mark as revoked
        await repository.update<SecuredLink>(
            linkKeys.PK,
            linkKeys.SK,
            { revoked: true }
        );

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to revoke link');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * List all dashboards for the current agent
 * Requirements: 1.2
 */
export async function listDashboards(): Promise<{
    message: string;
    data: ClientDashboard[] | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to list dashboards'] },
            };
        }

        // Query all dashboards for this agent
        const repository = getRepository();
        const pk = `AGENT#${user.id}`;

        const results = await repository.query<ClientDashboard>(pk, 'DASHBOARD#');

        // Extract dashboard data
        const dashboards = results.items;

        return {
            message: 'success',
            data: dashboards,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to list dashboards');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Get analytics for a specific dashboard
 * Requirements: 9.1, 9.2
 */
export async function getDashboardAnalytics(
    dashboardId: string
): Promise<{
    message: string;
    data: DashboardAnalytics | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to view analytics'] },
            };
        }

        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        // Verify dashboard exists and belongs to agent
        const repository = getRepository();
        const dashboardKeys = getClientDashboardKeys(user.id, dashboardId);
        const dashboard = await repository.get<ClientDashboard>(dashboardKeys.PK, dashboardKeys.SK);

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        // Query all analytics events for this dashboard
        const pk = `DASHBOARD#${dashboardId}`;
        const analyticsResults = await repository.queryItems<any>(pk, 'VIEW#');

        // Aggregate analytics data
        const analytics: DashboardAnalytics = {
            dashboardId,
            views: 0,
            propertyViews: [],
            documentDownloads: [],
            contactRequests: [],
        };

        for (const result of analyticsResults.items) {
            if (result.EntityType === 'DashboardView') {
                analytics.views++;
                const viewData = result.Data as any;
                if (viewData.timestamp) {
                    analytics.lastViewedAt = Math.max(
                        analytics.lastViewedAt || 0,
                        viewData.timestamp
                    );
                }
            } else if (result.EntityType === 'PropertyView') {
                const viewData = result.Data as any;
                analytics.propertyViews.push({
                    propertyId: viewData.propertyId,
                    viewedAt: viewData.timestamp,
                });
            } else if (result.EntityType === 'DocumentDownload') {
                const downloadData = result.Data as any;
                analytics.documentDownloads.push({
                    documentId: downloadData.documentId,
                    downloadedAt: downloadData.timestamp,
                });
            } else if (result.EntityType === 'ContactRequest') {
                const requestData = result.Data as any;
                analytics.contactRequests.push({
                    type: requestData.type,
                    message: requestData.message,
                    requestedAt: requestData.timestamp,
                });
            }
        }

        return {
            message: 'success',
            data: analytics,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to get analytics');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}
