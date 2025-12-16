'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
// Note: uploadFile import removed as it's not currently used
// import { uploadFile } from '@/aws/s3/client';

// Constants for NAP audit platforms
const NAP_AUDIT_PLATFORMS = [
    'Google Business Profile',
    'Yelp',
    'Facebook',
    'Yellow Pages',
    'Better Business Bureau',
    'Zillow',
    'Realtor.com',
    'LinkedIn',
] as const;

// Default simulation delays and confidence scores
const PLATFORM_CHECK_DELAY = 500;
const DEFAULT_CONFIDENCE_SCORE = 0.85;
const LOW_CONFIDENCE_SCORE = 0.6;

// Simulation scenario types for better type safety
type SimulationScenario = 'consistent' | 'inconsistent' | 'not_found' | 'needs_verification';

// Google Business Profile Integration Types
export type GoogleBusinessProfile = {
    id: string;
    userId: string;
    businessName: string;
    address: string;
    phone: string;
    website?: string;
    category: string;
    description?: string;
    hours?: BusinessHours[];
    photos?: string[];
    reviews?: GoogleReview[];
    rating?: number;
    reviewCount?: number;
    isVerified: boolean;
    lastSynced: string;
    createdAt: string;
};

export type BusinessHours = {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string; // HH:MM format
    close: string; // HH:MM format
    isClosed: boolean;
};

export type GoogleReview = {
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
    response?: string;
    responseDate?: string;
};

// NAP Audit Enhancement Types
export type NAPAuditResult = {
    id: string;
    userId: string;
    platforms: PlatformAuditResult[];
    overallScore: number;
    consistencyIssues: string[];
    recommendations: string[];
    auditedAt: string;
};

export type PlatformAuditResult = {
    platform: string;
    platformUrl?: string;
    foundName?: string;
    foundAddress?: string;
    foundPhone?: string;
    foundWebsite?: string;
    status: 'Consistent' | 'Inconsistent' | 'Not Found' | 'Needs Verification';
    issues: string[];
    confidence: number;
};

// Validation schemas
// Note: googleBusinessProfileSchema currently unused but kept for future Google Business Profile form validation
const googleBusinessProfileSchema = z.object({
    businessName: z.string().min(1, 'Business name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone number is required'),
    website: z.string().url().optional(),
    category: z.string().min(1, 'Business category is required'),
    description: z.string().optional(),
});

const napAuditSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone is required'),
    website: z.string().url().optional(),
});

// DynamoDB Keys
function getGoogleBusinessProfileKeys(userId: string) {
    return {
        PK: `USER#${userId}`,
        SK: 'GOOGLE_BUSINESS_PROFILE',
    };
}

function getNAPAuditKeys(userId: string, auditId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `NAP_AUDIT#${auditId}`,
    };
}

/**
 * Enhanced NAP Audit with multiple platform checking
 * 
 * Performs consistency checks across multiple platforms to ensure
 * Name, Address, Phone (NAP) information is consistent everywhere.
 * 
 * @param data - Business information to audit
 * @param data.name - Business name
 * @param data.address - Business address
 * @param data.phone - Business phone number
 * @param data.website - Optional business website
 * @returns Promise resolving to audit result with success status, audit data, or error
 */
export async function runEnhancedNAPAudit(data: {
    name: string;
    address: string;
    phone: string;
    website?: string;
}): Promise<{ success: boolean; audit?: NAPAuditResult; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = napAuditSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const auditId = `audit-${Date.now()}`;

        // Enhanced platform checking (in production, these would be real API calls)
        const platforms = NAP_AUDIT_PLATFORMS;

        // Run platform checks in parallel for better performance
        const platformResults = await Promise.all(
            platforms.map(platform => simulatePlatformCheck(platform, validated.data))
        );

        const consistentCount = platformResults.filter(r => r.status === 'Consistent').length;

        const overallScore = Math.round((consistentCount / platforms.length) * 100);

        // Generate recommendations based on results
        const recommendations = generateNAPRecommendations(platformResults);
        const consistencyIssues = platformResults
            .filter(r => r.status === 'Inconsistent')
            .flatMap(r => r.issues);

        const audit: NAPAuditResult = {
            id: auditId,
            userId: user.id,
            platforms: platformResults,
            overallScore,
            consistencyIssues,
            recommendations,
            auditedAt: new Date().toISOString(),
        };

        // Save audit results
        const repository = getRepository();
        const keys = getNAPAuditKeys(user.id, auditId);
        await repository.create(keys.PK, keys.SK, 'BrandAudit', audit);

        return { success: true, audit };
    } catch (error) {
        console.error('Enhanced NAP audit error:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to run NAP audit'
        };
    }
}

/**
 * Simulate platform checking (replace with real API calls in production)
 */
async function simulatePlatformCheck(
    platform: string,
    data: { name: string; address: string; phone: string; website?: string }
): Promise<PlatformAuditResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, PLATFORM_CHECK_DELAY));

    // Simulate different scenarios for different platforms
    const scenarios: SimulationScenario[] = ['consistent', 'inconsistent', 'not_found', 'needs_verification'];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    const baseResult = {
        platform,
        platformUrl: getPlatformUrl(platform, data.name),
        issues: [] as string[],
        confidence: DEFAULT_CONFIDENCE_SCORE,
    };

    switch (scenario) {
        case 'consistent':
            return {
                ...baseResult,
                foundName: data.name,
                foundAddress: data.address,
                foundPhone: data.phone,
                foundWebsite: data.website,
                status: 'Consistent' as const,
            };

        case 'inconsistent':
            const issues = [];
            let foundName = data.name;
            let foundAddress = data.address;
            let foundPhone = data.phone;

            // Simulate common inconsistencies
            if (Math.random() > 0.5) {
                foundName = data.name.replace(/LLC|Inc|Corp/, '').trim();
                issues.push('Business name format differs');
            }
            if (Math.random() > 0.5) {
                foundAddress = data.address.replace(/Street|St/, 'St.').replace(/Avenue|Ave/, 'Ave.');
                issues.push('Address abbreviation inconsistency');
            }
            if (Math.random() > 0.5) {
                foundPhone = data.phone.replace(/[()-\s]/g, '');
                issues.push('Phone number formatting differs');
            }

            return {
                ...baseResult,
                foundName,
                foundAddress,
                foundPhone,
                foundWebsite: data.website,
                status: 'Inconsistent' as const,
                issues,
            };

        case 'not_found':
            return {
                ...baseResult,
                status: 'Not Found' as const,
                issues: ['Business listing not found on this platform'],
            };

        case 'needs_verification':
            return {
                ...baseResult,
                foundName: data.name,
                foundAddress: data.address,
                foundPhone: data.phone,
                status: 'Needs Verification' as const,
                issues: ['Listing exists but requires verification'],
                confidence: LOW_CONFIDENCE_SCORE,
            };

        default:
            return {
                ...baseResult,
                status: 'Not Found' as const,
                issues: ['Unable to check this platform'],
            };
    }
}

/**
 * Generate platform-specific URLs for fixing issues
 */
function getPlatformUrl(platform: string, businessName: string): string {
    // Sanitize and encode business name for URL safety
    const sanitizedName = businessName.trim().replace(/[^\w\s-]/g, '');
    const encodedName = encodeURIComponent(sanitizedName);

    switch (platform) {
        case 'Google Business Profile':
            return `https://business.google.com/`;
        case 'Yelp':
            return `https://biz.yelp.com/`;
        case 'Facebook':
            return `https://www.facebook.com/business/`;
        case 'Yellow Pages':
            return `https://www.yellowpages.com/`;
        case 'Better Business Bureau':
            return `https://www.bbb.org/`;
        case 'Zillow':
            return `https://www.zillow.com/agent-resources/`;
        case 'Realtor.com':
            return `https://www.realtor.com/`;
        case 'LinkedIn':
            return `https://www.linkedin.com/company/setup/new/`;
        default:
            return '#';
    }
}

/**
 * Generate recommendations based on audit results
 */
function generateNAPRecommendations(results: PlatformAuditResult[]): string[] {
    const recommendations: string[] = [];

    const inconsistentPlatforms = results.filter(r => r.status === 'Inconsistent');
    const notFoundPlatforms = results.filter(r => r.status === 'Not Found');
    const needsVerificationPlatforms = results.filter(r => r.status === 'Needs Verification');

    if (inconsistentPlatforms.length > 0) {
        recommendations.push(
            `Fix inconsistencies on ${inconsistentPlatforms.length} platform(s): ${inconsistentPlatforms.map(p => p.platform).join(', ')}`
        );
    }

    if (notFoundPlatforms.length > 0) {
        recommendations.push(
            `Create business listings on ${notFoundPlatforms.length} missing platform(s): ${notFoundPlatforms.map(p => p.platform).join(', ')}`
        );
    }

    if (needsVerificationPlatforms.length > 0) {
        recommendations.push(
            `Verify your business on ${needsVerificationPlatforms.length} platform(s): ${needsVerificationPlatforms.map(p => p.platform).join(', ')}`
        );
    }

    // Add general recommendations
    if (results.some(r => r.issues.includes('Phone number formatting differs'))) {
        recommendations.push('Standardize phone number format across all platforms (e.g., (555) 123-4567)');
    }

    if (results.some(r => r.issues.includes('Address abbreviation inconsistency'))) {
        recommendations.push('Use consistent address formatting (Street vs St., Avenue vs Ave.)');
    }

    if (results.some(r => r.issues.includes('Business name format differs'))) {
        recommendations.push('Ensure business name includes proper legal suffixes (LLC, Inc, etc.) consistently');
    }

    return recommendations;
}

/**
 * Connect Google Business Profile
 */
export async function connectGoogleBusinessProfile(
    accessToken: string,
    refreshToken: string
): Promise<{ success: boolean; profile?: GoogleBusinessProfile; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // TODO: Use Google My Business API to fetch profile data
        // For now, simulate the connection
        const profile: GoogleBusinessProfile = {
            id: `gbp-${Date.now()}`,
            userId: user.id,
            businessName: 'Sample Real Estate Agency',
            address: '123 Main St, Seattle, WA 98101',
            phone: '(555) 123-4567',
            website: 'https://example.com',
            category: 'Real Estate Agency',
            description: 'Full-service real estate agency serving the Seattle area',
            rating: 4.8,
            reviewCount: 127,
            isVerified: true,
            lastSynced: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        // Save profile
        const repository = getRepository();
        const keys = getGoogleBusinessProfileKeys(user.id);
        await repository.create(keys.PK, keys.SK, 'UserProfile', profile);

        return { success: true, profile };
    } catch (error) {
        console.error('Connect Google Business Profile error:', error);
        return { success: false, error: 'Failed to connect Google Business Profile' };
    }
}

/**
 * Sync Google Business Profile data
 */
export async function syncGoogleBusinessProfile(): Promise<{ success: boolean; profile?: GoogleBusinessProfile; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const keys = getGoogleBusinessProfileKeys(user.id);
        const existingProfile = await repository.get<GoogleBusinessProfile>(keys.PK, keys.SK);

        if (!existingProfile) {
            return { success: false, error: 'Google Business Profile not connected' };
        }

        // TODO: Fetch latest data from Google My Business API
        // For now, simulate sync
        const updatedProfile: GoogleBusinessProfile = {
            ...existingProfile,
            lastSynced: new Date().toISOString(),
            // Simulate some updated data
            reviewCount: existingProfile.reviewCount ? existingProfile.reviewCount + Math.floor(Math.random() * 3) : 127,
            rating: 4.8 + (Math.random() - 0.5) * 0.2,
        };

        await repository.update(keys.PK, keys.SK, updatedProfile);

        return { success: true, profile: updatedProfile };
    } catch (error) {
        console.error('Sync Google Business Profile error:', error);
        return { success: false, error: 'Failed to sync Google Business Profile' };
    }
}

/**
 * Import Google Business Profile reviews
 */
export async function importGoogleReviews(): Promise<{ success: boolean; reviews?: GoogleReview[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // TODO: Fetch reviews from Google My Business API
        // For now, simulate review import
        const reviews: GoogleReview[] = [
            {
                id: 'review-1',
                author: 'Sarah Johnson',
                rating: 5,
                comment: 'Excellent service! John helped us find our dream home in just 2 weeks. Highly professional and knowledgeable about the Seattle market.',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'review-2',
                author: 'Mike Chen',
                rating: 5,
                comment: 'Outstanding real estate agent. Made the selling process smooth and stress-free. Got us a great price for our home.',
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'review-3',
                author: 'Lisa Rodriguez',
                rating: 4,
                comment: 'Very helpful and responsive. Knows the market well and provided great advice throughout the buying process.',
                date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];

        // Save reviews to user's review collection
        const repository = getRepository();
        for (const review of reviews) {
            const reviewKeys = {
                PK: `USER#${user.id}`,
                SK: `REVIEW#google#${review.id}`,
            };

            const reviewData = {
                id: review.id,
                userId: user.id,
                source: 'Google',
                author: {
                    name: review.author,
                },
                rating: review.rating,
                comment: review.comment,
                date: review.date,
                importedAt: new Date().toISOString(),
            };

            await repository.create(reviewKeys.PK, reviewKeys.SK, 'Review', reviewData);
        }

        return { success: true, reviews };
    } catch (error) {
        console.error('Import Google reviews error:', error);
        return { success: false, error: 'Failed to import Google reviews' };
    }
}

/**
 * Get NAP audit history
 */
export async function getNAPAuditHistory(limit: number = 10): Promise<{ success: boolean; audits?: NAPAuditResult[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<NAPAuditResult>(pk, 'NAP_AUDIT#', {
            limit,
            scanIndexForward: false, // Get newest first
        });

        return { success: true, audits: results.items };
    } catch (error) {
        console.error('Get NAP audit history error:', error);
        return { success: false, error: 'Failed to get audit history' };
    }
}

/**
 * Get Google Business Profile
 */
export async function getGoogleBusinessProfile(): Promise<{ success: boolean; profile?: GoogleBusinessProfile; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const keys = getGoogleBusinessProfileKeys(user.id);
        const profile = await repository.get<GoogleBusinessProfile>(keys.PK, keys.SK);

        if (!profile) {
            return { success: false, error: 'Google Business Profile not connected' };
        }

        return { success: true, profile };
    } catch (error) {
        console.error('Get Google Business Profile error:', error);
        return { success: false, error: 'Failed to get Google Business Profile' };
    }
}