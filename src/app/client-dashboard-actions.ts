'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    getClientDashboardKeys,
    getSecuredLinkKeys,
    getDashboardAnalyticsKeys,
    getCMAReportKeys,
    getDashboardDocumentKeys,
    getDocumentDownloadLogKeys,
} from '@/aws/dynamodb/keys';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { sendEmail } from '@/aws/ses/client';
import { getConfig } from '@/aws/config';
import { uploadFile, getPresignedUrl, deleteFile } from '@/aws/s3/client';

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
    valuationRequests: Array<{
        propertyDescription: string;
        estimatedValue: number;
        requestedAt: number;
    }>;
};

export type CMAReport = {
    id: string;
    agentId: string;
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
    createdAt: number;
    updatedAt: number;
};

export type DashboardDocument = {
    id: string;
    agentId: string;
    dashboardId: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    s3Key: string;
    category?: string;
    description?: string;
    uploadedAt: number;
    deletedAt?: number;
};

export type DocumentDownloadLog = {
    documentId: string;
    dashboardId: string;
    timestamp: number;
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

const cmaReportSchema = z.object({
    subjectProperty: z.object({
        address: z.string().min(1, 'Property address is required'),
        beds: z.number().min(0, 'Bedrooms must be 0 or greater'),
        baths: z.number().min(0, 'Bathrooms must be 0 or greater'),
        sqft: z.number().min(1, 'Square footage must be greater than 0'),
        yearBuilt: z.number().min(1800, 'Year built must be valid'),
    }),
    comparables: z.array(z.object({
        address: z.string().min(1, 'Comparable address is required'),
        soldPrice: z.number().min(0, 'Sold price must be 0 or greater'),
        soldDate: z.string().min(1, 'Sold date is required'),
        beds: z.number().min(0, 'Bedrooms must be 0 or greater'),
        baths: z.number().min(0, 'Bathrooms must be 0 or greater'),
        sqft: z.number().min(1, 'Square footage must be greater than 0'),
        distance: z.number().min(0, 'Distance must be 0 or greater'),
    })).min(1, 'At least one comparable property is required').max(10, 'Maximum 10 comparable properties allowed'),
    marketTrends: z.object({
        medianPrice: z.number().min(0, 'Median price must be 0 or greater'),
        daysOnMarket: z.number().min(0, 'Days on market must be 0 or greater'),
        inventoryLevel: z.enum(['low', 'medium', 'high']),
    }),
    priceRecommendation: z.object({
        low: z.number().min(0, 'Low price must be 0 or greater'),
        mid: z.number().min(0, 'Mid price must be 0 or greater'),
        high: z.number().min(0, 'High price must be 0 or greater'),
    }),
    agentNotes: z.string().optional(),
});

const updateCMAReportSchema = z.object({
    cmaReportId: z.string().min(1, 'CMA Report ID is required'),
    subjectProperty: z.object({
        address: z.string().min(1, 'Property address is required'),
        beds: z.number().min(0, 'Bedrooms must be 0 or greater'),
        baths: z.number().min(0, 'Bathrooms must be 0 or greater'),
        sqft: z.number().min(1, 'Square footage must be greater than 0'),
        yearBuilt: z.number().min(1800, 'Year built must be valid'),
    }).optional(),
    comparables: z.array(z.object({
        address: z.string().min(1, 'Comparable address is required'),
        soldPrice: z.number().min(0, 'Sold price must be 0 or greater'),
        soldDate: z.string().min(1, 'Sold date is required'),
        beds: z.number().min(0, 'Bedrooms must be 0 or greater'),
        baths: z.number().min(0, 'Bathrooms must be 0 or greater'),
        sqft: z.number().min(1, 'Square footage must be greater than 0'),
        distance: z.number().min(0, 'Distance must be 0 or greater'),
    })).optional(),
    marketTrends: z.object({
        medianPrice: z.number().min(0, 'Median price must be 0 or greater'),
        daysOnMarket: z.number().min(0, 'Days on market must be 0 or greater'),
        inventoryLevel: z.enum(['low', 'medium', 'high']),
    }).optional(),
    priceRecommendation: z.object({
        low: z.number().min(0, 'Low price must be 0 or greater'),
        mid: z.number().min(0, 'Mid price must be 0 or greater'),
        high: z.number().min(0, 'High price must be 0 or greater'),
    }).optional(),
    agentNotes: z.string().optional(),
});

const attachCMASchema = z.object({
    dashboardId: z.string().min(1, 'Dashboard ID is required'),
    cmaReportId: z.string().min(1, 'CMA Report ID is required'),
});

// Document validation schemas
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'image/png',
    'image/jpeg',
    'image/jpg',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

const uploadDocumentSchema = z.object({
    dashboardId: z.string().min(1, 'Dashboard ID is required'),
    fileName: z.string().min(1, 'File name is required'),
    fileSize: z.number().min(1, 'File size must be greater than 0').max(MAX_FILE_SIZE, 'File size must not exceed 25MB'),
    contentType: z.string().refine(
        (type) => ALLOWED_FILE_TYPES.includes(type),
        'File type must be PDF, DOCX, XLSX, PNG, JPG, or JPEG'
    ),
    category: z.string().optional(),
    description: z.string().optional(),
});

const removeDocumentSchema = z.object({
    documentId: z.string().min(1, 'Document ID is required'),
});

const getDocumentUrlSchema = z.object({
    documentId: z.string().min(1, 'Document ID is required'),
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
            valuationRequests: [],
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
            } else if (result.EntityType === 'ValuationRequest') {
                const valuationData = result.Data as any;
                analytics.valuationRequests.push({
                    propertyDescription: valuationData.propertyDescription,
                    estimatedValue: valuationData.estimatedValue,
                    requestedAt: valuationData.timestamp,
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

/**
 * Validate a secured dashboard link and return dashboard data
 * Requirements: 2.1, 10.3
 * 
 * This function:
 * - Validates the link token exists
 * - Checks if the link has expired
 * - Checks if the link has been revoked
 * - Tracks link access (view count, last accessed timestamp)
 * - Returns dashboard data if valid
 * - Returns error if expired/invalid/revoked
 */
export async function validateDashboardLink(
    token: string
): Promise<{
    message: string;
    data: {
        dashboard: ClientDashboard;
        link: SecuredLink;
    } | null;
    errors: any;
}> {
    try {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return {
                message: 'Invalid link token',
                data: null,
                errors: { token: ['Link token is required'] },
            };
        }

        const repository = getRepository();
        const linkKeys = getSecuredLinkKeys(token);

        // Get the secured link
        const link = await repository.get<SecuredLink>(linkKeys.PK, linkKeys.SK);

        if (!link) {
            return {
                message: 'Invalid link',
                data: null,
                errors: { token: ['This link is invalid or does not exist'] },
            };
        }

        // Check if link has been revoked
        if (link.revoked) {
            return {
                message: 'Link revoked',
                data: null,
                errors: { token: ['This link has been revoked by the agent'] },
            };
        }

        // Check if link has expired
        const now = Date.now();
        if (link.expiresAt < now) {
            return {
                message: 'Link expired',
                data: null,
                errors: { token: ['This link has expired. Please request a new link from your agent.'] },
            };
        }

        // Get the dashboard data
        const dashboardKeys = getClientDashboardKeys(link.agentId, link.dashboardId);
        const dashboard = await repository.get<ClientDashboard>(
            dashboardKeys.PK,
            dashboardKeys.SK
        );

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboard: ['The dashboard associated with this link no longer exists'] },
            };
        }

        // Track link access - increment access count and update last accessed timestamp
        const updatedLink: Partial<SecuredLink> = {
            accessCount: link.accessCount + 1,
            lastAccessedAt: now,
        };

        await repository.update<SecuredLink>(
            linkKeys.PK,
            linkKeys.SK,
            updatedLink
        );

        // Track dashboard view for analytics
        const viewTimestamp = now.toString();
        const analyticsKeys = getDashboardAnalyticsKeys(link.dashboardId, viewTimestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'DashboardView',
            {
                dashboardId: link.dashboardId,
                timestamp: now,
                token: token,
            }
        );

        // Return the updated link with new access count
        const updatedLinkData: SecuredLink = {
            ...link,
            ...updatedLink,
        };

        return {
            message: 'success',
            data: {
                dashboard,
                link: updatedLinkData,
            },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to validate link');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== CMA Report Actions ====================

/**
 * Create a new CMA (Comparative Market Analysis) report
 * Requirements: 3.1, 3.2
 * 
 * This function:
 * - Validates all required CMA report fields
 * - Creates a new CMA report with subject property, comparables, market trends, and price recommendation
 * - Stores the report in DynamoDB
 * - Returns the created CMA report
 */
export async function createCMAReport(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: CMAReport | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to create CMA reports'] },
            };
        }

        // Parse CMA data from formData
        const cmaDataStr = formData.get('cmaData') as string;
        if (!cmaDataStr) {
            return {
                message: 'CMA data is required',
                data: null,
                errors: { cmaData: ['CMA data is required'] },
            };
        }

        let cmaData;
        try {
            cmaData = JSON.parse(cmaDataStr);
        } catch (e) {
            return {
                message: 'Invalid CMA data format',
                data: null,
                errors: { cmaData: ['CMA data must be valid JSON'] },
            };
        }

        // Validate CMA data
        const validatedFields = cmaReportSchema.safeParse(cmaData);

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Generate unique CMA report ID
        const cmaReportId = `cma-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const now = Date.now();

        // Create CMA report object
        const cmaReport: CMAReport = {
            id: cmaReportId,
            agentId: user.id,
            subjectProperty: validatedFields.data.subjectProperty,
            comparables: validatedFields.data.comparables,
            marketTrends: validatedFields.data.marketTrends,
            priceRecommendation: validatedFields.data.priceRecommendation,
            agentNotes: validatedFields.data.agentNotes,
            createdAt: now,
            updatedAt: now,
        };

        // Save to DynamoDB
        const repository = getRepository();
        const keys = getCMAReportKeys(user.id, cmaReportId);

        await repository.create<CMAReport>(
            keys.PK,
            keys.SK,
            'CMAReport',
            cmaReport
        );

        return {
            message: 'success',
            data: cmaReport,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to create CMA report');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Update an existing CMA report
 * Requirements: 3.1, 3.2
 * 
 * This function:
 * - Validates the CMA report ID
 * - Retrieves the existing CMA report
 * - Updates specified fields (subject property, comparables, market trends, price recommendation, agent notes)
 * - Saves the updated report to DynamoDB
 * - Returns the updated CMA report
 */
export async function updateCMAReport(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: CMAReport | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to update CMA reports'] },
            };
        }

        const cmaReportId = formData.get('cmaReportId') as string;
        if (!cmaReportId) {
            return {
                message: 'CMA Report ID is required',
                data: null,
                errors: { cmaReportId: ['CMA Report ID is required'] },
            };
        }

        // Get existing CMA report
        const repository = getRepository();
        const keys = getCMAReportKeys(user.id, cmaReportId);
        const existingReport = await repository.get<CMAReport>(keys.PK, keys.SK);

        if (!existingReport) {
            return {
                message: 'CMA report not found',
                data: null,
                errors: { cmaReportId: ['CMA report not found'] },
            };
        }

        // Parse updates from formData
        const updatesStr = formData.get('updates') as string;
        if (!updatesStr) {
            return {
                message: 'Update data is required',
                data: null,
                errors: { updates: ['Update data is required'] },
            };
        }

        let updates;
        try {
            updates = JSON.parse(updatesStr);
        } catch (e) {
            return {
                message: 'Invalid update data format',
                data: null,
                errors: { updates: ['Update data must be valid JSON'] },
            };
        }

        // Validate updates
        const validatedFields = updateCMAReportSchema.safeParse({
            cmaReportId,
            ...updates,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Merge updates with existing report
        const updatedReport: CMAReport = {
            ...existingReport,
            ...(validatedFields.data.subjectProperty && { subjectProperty: validatedFields.data.subjectProperty }),
            ...(validatedFields.data.comparables && { comparables: validatedFields.data.comparables }),
            ...(validatedFields.data.marketTrends && { marketTrends: validatedFields.data.marketTrends }),
            ...(validatedFields.data.priceRecommendation && { priceRecommendation: validatedFields.data.priceRecommendation }),
            ...(validatedFields.data.agentNotes !== undefined && { agentNotes: validatedFields.data.agentNotes }),
            updatedAt: Date.now(),
        };

        // Save to DynamoDB
        await repository.update<CMAReport>(
            keys.PK,
            keys.SK,
            updatedReport
        );

        return {
            message: 'success',
            data: updatedReport,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to update CMA report');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Attach a CMA report to a client dashboard
 * Requirements: 3.1, 3.2
 * 
 * This function:
 * - Validates the dashboard ID and CMA report ID
 * - Retrieves the dashboard and CMA report
 * - Verifies both belong to the same agent
 * - Attaches the CMA report data to the dashboard
 * - Updates the dashboard in DynamoDB
 * - Returns the updated dashboard
 */
export async function attachCMAToDashboard(
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
                errors: { auth: ['You must be logged in to attach CMA reports'] },
            };
        }

        // Validate input
        const rawData = {
            dashboardId: formData.get('dashboardId'),
            cmaReportId: formData.get('cmaReportId'),
        };

        const validatedFields = attachCMASchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { dashboardId, cmaReportId } = validatedFields.data;

        // Get dashboard and CMA report
        const repository = getRepository();
        const dashboardKeys = getClientDashboardKeys(user.id, dashboardId);
        const cmaKeys = getCMAReportKeys(user.id, cmaReportId);

        const [dashboard, cmaReport] = await Promise.all([
            repository.get<ClientDashboard>(dashboardKeys.PK, dashboardKeys.SK),
            repository.get<CMAReport>(cmaKeys.PK, cmaKeys.SK),
        ]);

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        if (!cmaReport) {
            return {
                message: 'CMA report not found',
                data: null,
                errors: { cmaReportId: ['CMA report not found'] },
            };
        }

        // Verify both belong to the same agent
        if (dashboard.agentId !== user.id || cmaReport.agentId !== user.id) {
            return {
                message: 'Unauthorized',
                data: null,
                errors: { auth: ['You do not have permission to perform this action'] },
            };
        }

        // Attach CMA data to dashboard
        const updatedDashboard: ClientDashboard = {
            ...dashboard,
            cmaData: {
                subjectProperty: cmaReport.subjectProperty,
                comparables: cmaReport.comparables,
                marketTrends: cmaReport.marketTrends,
                priceRecommendation: cmaReport.priceRecommendation,
                agentNotes: cmaReport.agentNotes,
            },
            updatedAt: Date.now(),
        };

        // Save to DynamoDB
        await repository.update<ClientDashboard>(
            dashboardKeys.PK,
            dashboardKeys.SK,
            updatedDashboard
        );

        return {
            message: 'success',
            data: updatedDashboard,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to attach CMA report to dashboard');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Home Valuation Actions ====================

/**
 * Generate a home valuation for a client dashboard
 * Requirements: 5.1, 5.2, 5.3
 * 
 * This function:
 * - Validates the dashboard token
 * - Uses the enhanced Bedrock valuation flow with:
 *   - Comparable property finder (1 mile radius, 6 months)
 *   - Enhanced market trends analysis
 *   - Confidence level calculation
 * - Returns the valuation data (including full PropertyValuationOutput)
 */
export async function generateValuationForDashboard(
    token: string,
    propertyDescription: string
): Promise<{
    message: string;
    data: any | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!propertyDescription || propertyDescription.trim() === '') {
            return {
                message: 'Property description is required',
                data: null,
                errors: { property: ['Property description is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;

        // Check if home valuation is enabled for this dashboard
        if (!dashboard.dashboardConfig.enableHomeValuation) {
            return {
                message: 'Home valuation is not enabled for this dashboard',
                data: null,
                errors: { config: ['Home valuation is not enabled'] },
            };
        }

        // Generate valuation using enhanced Bedrock flow
        const { runPropertyValuation } = await import('@/aws/bedrock/flows/property-valuation');

        const valuationResult = await runPropertyValuation({
            propertyDescription,
        });

        // Generate unique valuation ID
        const valuationId = `val-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const now = Date.now();

        // Save valuation to DynamoDB
        // Requirements: 5.3 - Persist valuation for agent review
        const repository = getRepository();
        const valuationKeys = {
            PK: `AGENT#${dashboard.agentId}`,
            SK: `VALUATION#${valuationId}`,
        };

        const valuationData = {
            id: valuationId,
            agentId: dashboard.agentId,
            dashboardId: dashboard.id,
            propertyDescription,
            ...valuationResult,
            generatedAt: now,
        };

        await repository.create(
            valuationKeys.PK,
            valuationKeys.SK,
            'HomeValuation',
            valuationData
        );

        // Track valuation request in analytics
        const analyticsKeys = getDashboardAnalyticsKeys(dashboard.id, now.toString());

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'ValuationRequest',
            {
                dashboardId: dashboard.id,
                propertyDescription,
                estimatedValue: valuationResult.marketValuation.estimatedValue,
                timestamp: now,
            }
        );

        return {
            message: 'success',
            data: valuationResult,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to generate valuation');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Get a home valuation by ID
 * Requirements: 5.3
 * 
 * This function:
 * - Validates the valuation ID
 * - Retrieves the valuation from DynamoDB
 * - Verifies the agent owns the valuation
 * - Returns the valuation data
 */
export async function getValuation(
    valuationId: string
): Promise<{
    message: string;
    data: {
        id: string;
        agentId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zip: string;
            squareFeet: number;
            bedrooms: number;
            bathrooms: number;
            yearBuilt: number;
            propertyType: string;
        };
        estimatedValue: {
            low: number;
            mid: number;
            high: number;
        };
        confidence: 'low' | 'medium' | 'high';
        comparables: Array<{
            address: string;
            soldPrice: number;
            soldDate: string;
            squareFeet?: number;
            bedrooms?: number;
            bathrooms?: number;
        }>;
        marketTrends: {
            priceChange30Days?: number;
            priceChange90Days?: number;
            priceChange1Year?: number;
            daysOnMarket?: number;
            inventoryLevel?: 'low' | 'medium' | 'high';
            marketCondition?: string;
            medianPrice?: number;
        };
        generatedAt: number;
    } | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to view valuations'] },
            };
        }

        if (!valuationId) {
            return {
                message: 'Valuation ID is required',
                data: null,
                errors: { valuationId: ['Valuation ID is required'] },
            };
        }

        // Get valuation from DynamoDB
        const repository = getRepository();
        const keys = {
            PK: `AGENT#${user.id}`,
            SK: `VALUATION#${valuationId}`,
        };

        const valuation = await repository.get<any>(keys.PK, keys.SK);

        if (!valuation) {
            return {
                message: 'Valuation not found',
                data: null,
                errors: { valuationId: ['Valuation not found'] },
            };
        }

        // Verify ownership
        if (valuation.agentId !== user.id) {
            return {
                message: 'Unauthorized',
                data: null,
                errors: { auth: ['You do not have permission to view this valuation'] },
            };
        }

        return {
            message: 'success',
            data: valuation,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to get valuation');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * List valuations for a specific dashboard
 * Requirements: 5.3
 */
export async function listValuationsForDashboard(
    dashboardId: string
): Promise<{
    message: string;
    data: any[] | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to list valuations'] },
            };
        }

        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        // Query valuations for this agent
        const repository = getRepository();
        const pk = `AGENT#${user.id}`;
        const result = await repository.queryItems<any>(pk, 'VALUATION#');

        // Filter by dashboardId
        // Note: In a production app with many valuations, we might want a GSI for this
        const valuations = result.items
            .map(item => item.Data)
            .filter((data: any) => data.dashboardId === dashboardId);

        // Sort by date (newest first)
        valuations.sort((a: any, b: any) => b.generatedAt - a.generatedAt);

        return {
            message: 'success',
            data: valuations,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to list valuations');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Property Search Actions ====================

/**
 * Search properties for a client dashboard using agent's MLS access
 * Requirements: 4.2, 4.3
 * 
 * This function:
 * - Validates the token to get dashboard and agent information
 * - Uses the agent's MLS credentials to search properties
 * - Returns filtered and paginated property listings
 * - Implements 5-minute caching for search results
 */
export async function searchPropertiesForDashboard(
    token: string,
    criteria: {
        location?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        bathrooms?: number;
        propertyType?: string[];
        minSquareFeet?: number;
        maxSquareFeet?: number;
        page?: number;
        limit?: number;
    }
): Promise<{
    message: string;
    data: {
        properties: Array<{
            id: string;
            address: string;
            city: string;
            state: string;
            zip: string;
            price: number;
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            propertyType: string;
            images: string[];
            listingDate: string;
            status: string;
        }>;
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const agentId = dashboard.agentId;

        // Check if property search is enabled for this dashboard
        if (!dashboard.dashboardConfig.enablePropertySearch) {
            return {
                message: 'Property search is not enabled for this dashboard',
                data: null,
                errors: { config: ['Property search is not enabled'] },
            };
        }

        // Use the property search service to search properties
        const { getPropertySearchService } = await import('@/lib/client-dashboard/property-search');
        const searchService = getPropertySearchService();

        const searchResult = await searchService.searchProperties(agentId, criteria);

        return {
            message: 'success',
            data: searchResult,
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleError(error, 'Failed to search properties');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Get detailed property information
 * Requirements: 4.3
 * 
 * This function:
 * - Validates the token to get dashboard and agent information
 * - Retrieves the agent's MLS connection
 * - Fetches detailed property information from MLS
 * - Returns complete property details
 */
export async function getPropertyDetails(
    token: string,
    propertyId: string
): Promise<{
    message: string;
    data: {
        id: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        price: number;
        bedrooms: number;
        bathrooms: number;
        squareFeet: number;
        propertyType: string;
        images: string[];
        listingDate: string;
        status: string;
    } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!propertyId) {
            return {
                message: 'Property ID is required',
                data: null,
                errors: { propertyId: ['Property ID is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const agentId = dashboard.agentId;

        // Check if property search is enabled for this dashboard
        if (!dashboard.dashboardConfig.enablePropertySearch) {
            return {
                message: 'Property search is not enabled for this dashboard',
                data: null,
                errors: { config: ['Property search is not enabled'] },
            };
        }

        // Use the property search service to get property details
        const { getPropertySearchService } = await import('@/lib/client-dashboard/property-search');
        const searchService = getPropertySearchService();

        const property = await searchService.getPropertyDetails(agentId, propertyId);

        if (!property) {
            return {
                message: 'Property not found',
                data: null,
                errors: { propertyId: ['Property not found'] },
            };
        }

        return {
            message: 'success',
            data: property,
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleError(error, 'Failed to get property details');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Track property view for analytics
 * Requirements: 4.3
 * 
 * This function:
 * - Records when a client views a property
 * - Stores the view event in analytics
 * - Used for agent analytics and engagement tracking
 */
export async function trackPropertyView(
    dashboardId: string,
    propertyId: string
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        if (!propertyId) {
            return {
                message: 'Property ID is required',
                data: null,
                errors: { propertyId: ['Property ID is required'] },
            };
        }

        const repository = getRepository();
        const now = Date.now();
        const viewTimestamp = now.toString();

        // Create analytics event for property view
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, viewTimestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'PropertyView',
            {
                dashboardId,
                propertyId,
                timestamp: now,
            }
        );

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to track property view');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Send property inquiry to agent via email
 * Requirements: 4.5
 * 
 * This function:
 * - Validates the token, property ID, and inquiry message
 * - Retrieves the dashboard and agent information
 * - Sends an email notification to the agent with client and property details
 * - Tracks the inquiry in analytics
 */
export async function sendPropertyInquiry(
    token: string,
    propertyId: string,
    inquiryMessage: string,
    clientName?: string,
    clientEmail?: string,
    clientPhone?: string
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!propertyId) {
            return {
                message: 'Property ID is required',
                data: null,
                errors: { propertyId: ['Property ID is required'] },
            };
        }

        if (!inquiryMessage || inquiryMessage.trim() === '') {
            return {
                message: 'Inquiry message is required',
                data: null,
                errors: { message: ['Inquiry message is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const dashboardId = dashboard.id;
        const agentEmail = dashboard.branding.agentContact.email;
        const agentName = dashboard.branding.agentContact.phone; // We should have agent name in branding

        const repository = getRepository();
        const now = Date.now();
        const inquiryTimestamp = now.toString();

        // Track the inquiry in analytics
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, inquiryTimestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'ContactRequest',
            {
                dashboardId,
                type: 'property_inquiry',
                propertyId,
                message: inquiryMessage,
                clientName,
                clientEmail,
                clientPhone,
                timestamp: now,
            }
        );

        // Send email notification to agent
        const config = getConfig();
        const emailSubject = `Property Inquiry from ${clientName || 'Client'} - ${dashboard.clientInfo.name}`;

        const emailBody = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">New Property Inquiry</h2>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Client Information</h3>
                        <p><strong>Dashboard Client:</strong> ${dashboard.clientInfo.name}</p>
                        ${clientName ? `<p><strong>Inquiry From:</strong> ${clientName}</p>` : ''}
                        ${clientEmail ? `<p><strong>Email:</strong> ${clientEmail}</p>` : ''}
                        ${clientPhone ? `<p><strong>Phone:</strong> ${clientPhone}</p>` : ''}
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Property Details</h3>
                        <p><strong>Property ID:</strong> ${propertyId}</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Message</h3>
                        <p>${inquiryMessage}</p>
                    </div>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        This inquiry was sent from your client dashboard for ${dashboard.clientInfo.name}.
                    </p>
                </body>
            </html>
        `;

        try {
            await sendEmail(
                agentEmail,
                emailSubject,
                emailBody,
                config.ses.fromEmail,
                true
            );
        } catch (emailError) {
            console.error('Failed to send inquiry email:', emailError);
            // Don't fail the whole operation if email fails
            // The inquiry is still tracked in analytics
        }

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to send property inquiry');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Document Management Actions ====================

/**
 * Upload a document to a client dashboard
 * Requirements: 6.1, 6.2, 10.4
 * 
 * This function:
 * - Validates file type and size (PDF, DOCX, XLSX, PNG, JPG, JPEG up to 25MB)
 * - Uploads the file to S3 with proper organization
 * - Creates a document record in DynamoDB
 * - Associates the document with the dashboard
 * - Returns the document metadata
 */
export async function uploadDocumentToDashboard(
    dashboardId: string,
    file: File
): Promise<{
    message: string;
    data: DashboardDocument | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to upload documents'] },
            };
        }

        // Validate dashboard exists and belongs to agent
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

        // Validate file
        const validatedFields = uploadDocumentSchema.safeParse({
            dashboardId,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Generate unique document ID
        const documentId = `doc-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const now = Date.now();

        // Generate S3 key
        const fileExtension = file.name.split('.').pop() || 'bin';
        const s3Key = `agents/${user.id}/dashboards/${dashboardId}/documents/${documentId}.${fileExtension}`;

        // Convert File to Buffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        await uploadFile(s3Key, buffer, file.type, {
            dashboardId,
            documentId,
            originalFileName: file.name,
        });

        // Create document record
        const document: DashboardDocument = {
            id: documentId,
            agentId: user.id,
            dashboardId,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            s3Key,
            uploadedAt: now,
        };

        // Save to DynamoDB
        const documentKeys = getDashboardDocumentKeys(user.id, documentId);
        await repository.create<DashboardDocument>(
            documentKeys.PK,
            documentKeys.SK,
            'DashboardDocument',
            document
        );

        return {
            message: 'success',
            data: document,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to upload document');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Remove a document from a client dashboard
 * Requirements: 6.2
 * 
 * This function:
 * - Validates the document ID
 * - Verifies the agent owns the document
 * - Soft deletes the document (marks with deletedAt timestamp)
 * - Keeps the file in S3 for 30 days before permanent deletion
 * - Returns success status
 */
export async function removeDocumentFromDashboard(
    documentId: string
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
                errors: { auth: ['You must be logged in to remove documents'] },
            };
        }

        // Validate input
        const validatedFields = removeDocumentSchema.safeParse({ documentId });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Get document
        const repository = getRepository();
        const documentKeys = getDashboardDocumentKeys(user.id, documentId);
        const document = await repository.get<DashboardDocument>(documentKeys.PK, documentKeys.SK);

        if (!document) {
            return {
                message: 'Document not found',
                data: null,
                errors: { documentId: ['Document not found'] },
            };
        }

        // Verify ownership
        if (document.agentId !== user.id) {
            return {
                message: 'Unauthorized',
                data: null,
                errors: { auth: ['You do not have permission to remove this document'] },
            };
        }

        // Soft delete - mark with deletedAt timestamp
        const now = Date.now();
        await repository.update<DashboardDocument>(
            documentKeys.PK,
            documentKeys.SK,
            { deletedAt: now }
        );

        // Note: Actual S3 file deletion should be handled by a scheduled cleanup job
        // that runs periodically to delete files marked for deletion > 30 days ago

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to remove document');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * List all documents for a client dashboard
 * Requirements: 6.2
 * 
 * This function:
 * - Validates the dashboard ID
 * - Retrieves all documents for the dashboard
 * - Filters out soft-deleted documents
 * - Returns the list of active documents
 */
export async function listDashboardDocuments(
    dashboardId: string
): Promise<{
    message: string;
    data: DashboardDocument[] | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to list documents'] },
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

        // Query all documents for this agent
        const pk = `AGENT#${user.id}`;
        const results = await repository.query<DashboardDocument>(pk, 'DOCUMENT#');

        // Filter documents for this dashboard and exclude soft-deleted ones
        const documents = results.items.filter(
            (doc) => doc.dashboardId === dashboardId && !doc.deletedAt
        );

        return {
            message: 'success',
            data: documents,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to list documents');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Get a presigned download URL for a document
 * Requirements: 6.3, 10.4
 * 
 * This function:
 * - Validates the document ID and dashboard ID
 * - Verifies the dashboard has access to the document
 * - Generates a presigned URL with 1-hour expiration
 * - Returns the presigned URL for secure download
 */
export async function getDocumentDownloadUrl(
    token: string,
    documentId: string
): Promise<{
    message: string;
    data: { url: string; fileName: string } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!documentId) {
            return {
                message: 'Document ID is required',
                data: null,
                errors: { documentId: ['Document ID is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const dashboardId = dashboard.id;
        const agentId = dashboard.agentId;

        // Check if documents are enabled for this dashboard
        if (!dashboard.dashboardConfig.enableDocuments) {
            return {
                message: 'Documents are not enabled for this dashboard',
                data: null,
                errors: { config: ['Documents are not enabled'] },
            };
        }

        // Get document
        const repository = getRepository();
        const documentKeys = getDashboardDocumentKeys(agentId, documentId);
        const document = await repository.get<DashboardDocument>(documentKeys.PK, documentKeys.SK);

        if (!document) {
            return {
                message: 'Document not found',
                data: null,
                errors: { documentId: ['Document not found'] },
            };
        }

        // Verify document belongs to this dashboard
        if (document.dashboardId !== dashboardId) {
            return {
                message: 'Unauthorized',
                data: null,
                errors: { auth: ['You do not have permission to access this document'] },
            };
        }

        // Check if document is soft-deleted
        if (document.deletedAt) {
            return {
                message: 'Document not found',
                data: null,
                errors: { documentId: ['Document has been removed'] },
            };
        }

        // Generate presigned URL with 1-hour expiration (3600 seconds)
        const url = await getPresignedUrl(document.s3Key, 3600);

        return {
            message: 'success',
            data: {
                url,
                fileName: document.fileName,
            },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to get document download URL');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Log a document download event
 * Requirements: 6.3
 * 
 * This function:
 * - Records when a client downloads a document
 * - Stores the download event in analytics
 * - Used for agent analytics and engagement tracking
 * - Sends notification to agent about the download
 */
export async function logDocumentDownload(
    token: string,
    documentId: string
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!documentId) {
            return {
                message: 'Document ID is required',
                data: null,
                errors: { documentId: ['Document ID is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const dashboardId = dashboard.id;
        const agentId = dashboard.agentId;

        // Get document to verify it exists and get file name
        const repository = getRepository();
        const documentKeys = getDashboardDocumentKeys(agentId, documentId);
        const document = await repository.get<DashboardDocument>(documentKeys.PK, documentKeys.SK);

        if (!document) {
            return {
                message: 'Document not found',
                data: null,
                errors: { documentId: ['Document not found'] },
            };
        }

        const now = Date.now();
        const timestamp = now.toString();

        // Log download event for analytics
        const downloadLogKeys = getDocumentDownloadLogKeys(documentId, timestamp, dashboardId);
        await repository.create(
            downloadLogKeys.PK,
            downloadLogKeys.SK,
            'DocumentDownload',
            {
                documentId,
                dashboardId,
                timestamp: now,
                fileName: document.fileName,
            }
        );

        // Also track in dashboard analytics
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, timestamp);
        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'DocumentDownload',
            {
                dashboardId,
                documentId,
                fileName: document.fileName,
                timestamp: now,
            }
        );

        // Send email notification to agent
        const config = getConfig();
        const agentEmail = dashboard.branding.agentContact.email;
        const emailSubject = `Document Downloaded - ${dashboard.clientInfo.name}`;

        const emailBody = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Document Downloaded</h2>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Client Information</h3>
                        <p><strong>Client:</strong> ${dashboard.clientInfo.name}</p>
                        <p><strong>Email:</strong> ${dashboard.clientInfo.email}</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Document Details</h3>
                        <p><strong>File Name:</strong> ${document.fileName}</p>
                        <p><strong>Downloaded:</strong> ${new Date(now).toLocaleString()}</p>
                    </div>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        This notification was sent from your client dashboard for ${dashboard.clientInfo.name}.
                    </p>
                </body>
            </html>
        `;

        try {
            await sendEmail(
                agentEmail,
                emailSubject,
                emailBody,
                config.ses.fromEmail,
                true
            );
        } catch (emailError) {
            console.error('Failed to send download notification email:', emailError);
            // Don't fail the whole operation if email fails
            // The download is still tracked in analytics
        }

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to log document download');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * List documents for a client dashboard (client-side access via token)
 * Requirements: 6.2
 * 
 * This function:
 * - Validates the client's access token
 * - Retrieves all documents shared with the dashboard
 * - Filters out soft-deleted documents
 * - Returns the list of active documents for the client
 */
export async function listDashboardDocumentsForClient(
    token: string
): Promise<{
    message: string;
    data: DashboardDocument[] | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        // Validate the token and get dashboard information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const dashboardId = dashboard.id;
        const agentId = dashboard.agentId;

        // Query all documents for this agent
        const repository = getRepository();
        const pk = `AGENT#${agentId}`;
        const results = await repository.query<DashboardDocument>(pk, 'DOCUMENT#');

        // Filter documents for this dashboard and exclude soft-deleted ones
        const documents = results.items.filter(
            (doc) => doc.dashboardId === dashboardId && !doc.deletedAt
        );

        return {
            message: 'success',
            data: documents,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to list documents');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Analytics Tracking Actions ====================

/**
 * Track a dashboard view event
 * Requirements: 9.1
 * 
 * This function:
 * - Records when a client views the dashboard
 * - Stores the view event in analytics
 * - Used for agent analytics and engagement tracking
 * 
 * Note: This is also called automatically in validateDashboardLink
 */
export async function trackDashboardView(
    dashboardId: string,
    token?: string
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        const repository = getRepository();
        const now = Date.now();
        const viewTimestamp = now.toString();

        // Create analytics event for dashboard view
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, viewTimestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'DashboardView',
            {
                dashboardId,
                timestamp: now,
                token: token || null,
            }
        );

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to track dashboard view');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Track a document download event
 * Requirements: 9.1
 * 
 * This function:
 * - Records when a client downloads a document
 * - Stores the download event in analytics
 * - Used for agent analytics and engagement tracking
 * 
 * Note: This is also called automatically in logDocumentDownload
 */
export async function trackDocumentDownload(
    dashboardId: string,
    documentId: string,
    fileName?: string
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        if (!documentId) {
            return {
                message: 'Document ID is required',
                data: null,
                errors: { documentId: ['Document ID is required'] },
            };
        }

        const repository = getRepository();
        const now = Date.now();
        const timestamp = now.toString();

        // Create analytics event for document download
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, timestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'DocumentDownload',
            {
                dashboardId,
                documentId,
                fileName: fileName || null,
                timestamp: now,
            }
        );

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to track document download');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Track a contact request event
 * Requirements: 9.1, 7.1
 * 
 * This function:
 * - Records when a client submits a contact request
 * - Stores the request event in analytics
 * - Used for agent analytics and engagement tracking
 * - Optionally sends email notification to agent
 */
export async function trackContactRequest(
    dashboardId: string,
    contactType: string,
    message: string,
    metadata?: {
        propertyId?: string;
        clientName?: string;
        clientEmail?: string;
        clientPhone?: string;
        [key: string]: any;
    }
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        if (!contactType) {
            return {
                message: 'Contact type is required',
                data: null,
                errors: { contactType: ['Contact type is required'] },
            };
        }

        if (!message || message.trim() === '') {
            return {
                message: 'Message is required',
                data: null,
                errors: { message: ['Message is required'] },
            };
        }

        const repository = getRepository();
        const now = Date.now();
        const timestamp = now.toString();

        // Create analytics event for contact request
        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, timestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'ContactRequest',
            {
                dashboardId,
                type: contactType,
                message,
                metadata: metadata || {},
                timestamp: now,
            }
        );

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to track contact request');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Contact/Inquiry System ====================

/**
 * Send a client inquiry to the agent
 * Requirements: 4.5, 7.1
 * 
 * This function:
 * - Validates the token and inquiry data
 * - Retrieves the dashboard and agent information
 * - Sends an email notification to the agent with inquiry details
 * - Tracks the inquiry in analytics
 * - Supports different inquiry types (general, CMA, property, valuation)
 */
export async function sendClientInquiry(
    token: string,
    inquiryData: {
        type: 'general' | 'cma' | 'property' | 'valuation';
        subject: string;
        message: string;
        clientName?: string;
        clientEmail?: string;
        clientPhone?: string;
        propertyId?: string;
        propertyAddress?: string;
        metadata?: Record<string, any>;
    }
): Promise<{
    message: string;
    data: { success: boolean } | null;
    errors: any;
}> {
    try {
        if (!token) {
            return {
                message: 'Access token is required',
                data: null,
                errors: { token: ['Access token is required'] },
            };
        }

        if (!inquiryData.subject || inquiryData.subject.trim() === '') {
            return {
                message: 'Subject is required',
                data: null,
                errors: { subject: ['Subject is required'] },
            };
        }

        if (!inquiryData.message || inquiryData.message.trim() === '') {
            return {
                message: 'Message is required',
                data: null,
                errors: { message: ['Message is required'] },
            };
        }

        // Validate the token and get dashboard/agent information
        const validationResult = await validateDashboardLink(token);

        if (validationResult.message !== 'success' || !validationResult.data) {
            return {
                message: validationResult.message,
                data: null,
                errors: validationResult.errors,
            };
        }

        const { dashboard } = validationResult.data;
        const dashboardId = dashboard.id;
        const agentEmail = dashboard.branding.agentContact.email;
        const clientName = inquiryData.clientName || dashboard.clientInfo.name;
        const clientEmail = inquiryData.clientEmail || dashboard.clientInfo.email;
        const clientPhone = inquiryData.clientPhone || dashboard.clientInfo.phone;

        // Track the inquiry in analytics
        const repository = getRepository();
        const now = Date.now();
        const timestamp = now.toString();

        const analyticsKeys = getDashboardAnalyticsKeys(dashboardId, timestamp);

        await repository.create(
            analyticsKeys.PK,
            analyticsKeys.SK,
            'ContactRequest',
            {
                dashboardId,
                type: inquiryData.type,
                subject: inquiryData.subject,
                message: inquiryData.message,
                clientName,
                clientEmail,
                clientPhone,
                propertyId: inquiryData.propertyId,
                propertyAddress: inquiryData.propertyAddress,
                metadata: inquiryData.metadata || {},
                timestamp: now,
            }
        );

        // Prepare email content based on inquiry type
        const config = getConfig();
        let emailSubject = '';
        let emailBody = '';

        switch (inquiryData.type) {
            case 'cma':
                emailSubject = `CMA Report Inquiry - ${clientName}`;
                emailBody = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #2563eb;">CMA Report Inquiry</h2>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Client Information</h3>
                                <p><strong>Name:</strong> ${clientName}</p>
                                <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                                <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                            </div>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Inquiry Details</h3>
                                <p><strong>Subject:</strong> ${inquiryData.subject}</p>
                                <p><strong>Message:</strong></p>
                                <p style="white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            
                            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                                This inquiry was sent from your client dashboard for ${clientName}.
                            </p>
                        </body>
                    </html>
                `;
                break;

            case 'property':
                emailSubject = `Property Inquiry - ${clientName}`;
                emailBody = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #2563eb;">Property Inquiry</h2>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Client Information</h3>
                                <p><strong>Name:</strong> ${clientName}</p>
                                <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                                <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                            </div>
                            
                            ${inquiryData.propertyAddress ? `
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Property Details</h3>
                                <p><strong>Address:</strong> ${inquiryData.propertyAddress}</p>
                                ${inquiryData.propertyId ? `<p><strong>Property ID:</strong> ${inquiryData.propertyId}</p>` : ''}
                            </div>
                            ` : ''}
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Inquiry Details</h3>
                                <p><strong>Subject:</strong> ${inquiryData.subject}</p>
                                <p><strong>Message:</strong></p>
                                <p style="white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            
                            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                                This inquiry was sent from your client dashboard for ${clientName}.
                            </p>
                        </body>
                    </html>
                `;
                break;

            case 'valuation':
                emailSubject = `Home Valuation Inquiry - ${clientName}`;
                emailBody = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #2563eb;">Home Valuation Inquiry</h2>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Client Information</h3>
                                <p><strong>Name:</strong> ${clientName}</p>
                                <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                                <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                            </div>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Inquiry Details</h3>
                                <p><strong>Subject:</strong> ${inquiryData.subject}</p>
                                <p><strong>Message:</strong></p>
                                <p style="white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            
                            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                                This inquiry was sent from your client dashboard for ${clientName}.
                            </p>
                        </body>
                    </html>
                `;
                break;

            default: // general
                emailSubject = `Client Inquiry - ${clientName}`;
                emailBody = `
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #2563eb;">Client Inquiry</h2>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Client Information</h3>
                                <p><strong>Name:</strong> ${clientName}</p>
                                <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                                <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                            </div>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Inquiry Details</h3>
                                <p><strong>Subject:</strong> ${inquiryData.subject}</p>
                                <p><strong>Message:</strong></p>
                                <p style="white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            
                            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                                This inquiry was sent from your client dashboard for ${clientName}.
                            </p>
                        </body>
                    </html>
                `;
        }

        // Send email to agent
        try {
            await sendEmail(
                agentEmail,
                emailSubject,
                emailBody,
                config.ses.fromEmail,
                true
            );
        } catch (emailError) {
            console.error('Failed to send inquiry email:', emailError);
            // Don't fail the whole operation if email fails
            // The inquiry is still tracked in analytics
        }

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to send inquiry');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Get a specific dashboard by ID
 * Requirements: 1.1
 */
export async function getDashboard(
    dashboardId: string
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
                errors: { auth: ['You must be logged in to view dashboards'] },
            };
        }

        if (!dashboardId) {
            return {
                message: 'Dashboard ID is required',
                data: null,
                errors: { dashboardId: ['Dashboard ID is required'] },
            };
        }

        // Get dashboard
        const repository = getRepository();
        const keys = getClientDashboardKeys(user.id, dashboardId);
        const dashboard = await repository.get<ClientDashboard>(keys.PK, keys.SK);

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        return {
            message: 'success',
            data: dashboard,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to get dashboard');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * Delete a client dashboard
 * Requirements: 1.1
 */
export async function deleteDashboard(
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
                errors: { auth: ['You must be logged in to delete dashboards'] },
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

        // Verify dashboard exists and belongs to agent
        const repository = getRepository();
        const keys = getClientDashboardKeys(user.id, dashboardId);
        const dashboard = await repository.get<ClientDashboard>(keys.PK, keys.SK);

        if (!dashboard) {
            return {
                message: 'Dashboard not found',
                data: null,
                errors: { dashboardId: ['Dashboard not found'] },
            };
        }

        // Delete dashboard
        await repository.delete(keys.PK, keys.SK);

        // Find and delete associated links
        // Query GSI1 for links associated with this dashboard
        // PK: AGENT#<agentId>, SK: DASHBOARD#<dashboardId>
        const linkGsiPk = `AGENT#${user.id}`;
        const linkGsiSk = `DASHBOARD#${dashboardId}`;

        const linksResult = await repository.query<SecuredLink>(
            linkGsiPk,
            linkGsiSk,
            { indexName: 'GSI1' }
        );

        // Delete each link
        for (const link of linksResult.items) {
            const linkKeys = getSecuredLinkKeys(link.token);
            await repository.delete(linkKeys.PK, linkKeys.SK);
        }

        return {
            message: 'success',
            data: { success: true },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to delete dashboard');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

/**
 * List all secured links for the current agent
 * Requirements: 2.1
 */
export async function listAllAgentLinks(): Promise<{
    message: string;
    data: SecuredLink[] | null;
    errors: any;
}> {
    try {
        // Get current user (agent)
        const user = await getCurrentUser();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: null,
                errors: { auth: ['You must be logged in to list links'] },
            };
        }

        // Query GSI1 for all links for this agent
        // PK: AGENT#<agentId>, SK: DASHBOARD# (begins_with)
        const repository = getRepository();
        const pk = `AGENT#${user.id}`;

        const results = await repository.query<SecuredLink>(
            pk,
            'DASHBOARD#',
            { indexName: 'GSI1' }
        );

        return {
            message: 'success',
            data: results.items,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to list links');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}
