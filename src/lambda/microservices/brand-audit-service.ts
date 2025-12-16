/**
 * Brand Audit Service Lambda
 * 
 * Microservice for NAP (Name, Address, Phone) consistency checking across platforms.
 * Validates Requirements 4.1: Brand audit service with NAP consistency checking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';

// Types
interface NAPData {
    name: string;
    address: string;
    phone: string;
}

interface NAPInconsistency {
    field: 'name' | 'address' | 'phone';
    expected: string;
    found: string;
    platform: string;
    confidence: number;
}

interface BrandAuditRequest {
    agentProfile: NAPData;
    platforms: string[];
    userId: string;
}

interface BrandAuditResult {
    inconsistencies: NAPInconsistency[];
    platformsChecked: string[];
    overallConsistency: number;
    detailedResults: Record<string, {
        name: { matches: boolean; found?: string; confidence: number };
        address: { matches: boolean; found?: string; confidence: number };
        phone: { matches: boolean; found?: string; confidence: number };
    }>;
    auditId: string;
    timestamp: string;
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

interface ServiceError {
    errorId: string;
    errorCode: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    traceId: string;
    service: string;
    retryable: boolean;
}

// Platform-specific NAP extraction simulators
class PlatformNAPExtractor {
    private static readonly PLATFORM_EXTRACTORS = {
        'google-business': (profile: NAPData) => profile, // Usually accurate
        'yelp': (profile: NAPData) => ({
            ...profile,
            // Yelp might have phone format variations
            phone: Math.random() > 0.8 ? profile.phone.replace(/[()]/g, '') : profile.phone,
        }),
        'facebook': (profile: NAPData) => ({
            ...profile,
            // Facebook might have abbreviated business names
            name: Math.random() > 0.7 ? profile.name.replace(' Real Estate', '') : profile.name,
        }),
        'linkedin': (profile: NAPData) => profile, // Usually accurate for professionals
        'zillow': (profile: NAPData) => ({
            ...profile,
            // Zillow might have different address formats
            address: Math.random() > 0.6 ? profile.address.replace(', ', ' ') : profile.address,
        }),
        'realtor.com': (profile: NAPData) => ({
            ...profile,
            // Realtor.com might have phone format differences
            phone: Math.random() > 0.7 ? profile.phone.replace(/[().-]/g, '') : profile.phone,
        }),
        'trulia': (profile: NAPData) => ({
            ...profile,
            // Trulia might have address variations
            address: Math.random() > 0.5 ? profile.address.replace('St,', 'Street,') : profile.address,
        }),
        'yellowpages': (profile: NAPData) => ({
            ...profile,
            // Yellow Pages might have business name variations
            name: Math.random() > 0.6 ? profile.name.replace(' Realty', ' Real Estate') : profile.name,
        }),
    };

    static extractNAPData(profile: NAPData, platform: string): NAPData {
        const extractor = this.PLATFORM_EXTRACTORS[platform as keyof typeof this.PLATFORM_EXTRACTORS];
        return extractor ? extractor(profile) : profile;
    }

    static calculateConfidence(field: string, platform: string): number {
        // Simulate confidence scores based on platform reliability
        const baseConfidence = {
            'google-business': 0.95,
            'linkedin': 0.90,
            'yelp': 0.85,
            'realtor.com': 0.80,
            'zillow': 0.75,
            'trulia': 0.70,
            'facebook': 0.65,
            'yellowpages': 0.60,
        };

        const base = baseConfidence[platform as keyof typeof baseConfidence] || 0.50;
        // Add some randomness to simulate real-world variations
        return Math.min(1.0, Math.max(0.0, base + (Math.random() - 0.5) * 0.2));
    }
}

// Brand Audit Service
class BrandAuditService {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    async auditNAPConsistency(request: BrandAuditRequest): Promise<BrandAuditResult> {
        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const inconsistencies: NAPInconsistency[] = [];
        const detailedResults: Record<string, any> = {};

        // Process each platform
        for (const platform of request.platforms) {
            // Extract NAP data from platform (simulated)
            const platformNAP = PlatformNAPExtractor.extractNAPData(request.agentProfile, platform);

            // Calculate confidence scores
            const nameConfidence = PlatformNAPExtractor.calculateConfidence('name', platform);
            const addressConfidence = PlatformNAPExtractor.calculateConfidence('address', platform);
            const phoneConfidence = PlatformNAPExtractor.calculateConfidence('phone', platform);

            // Compare NAP data
            const nameMatches = platformNAP.name === request.agentProfile.name;
            const addressMatches = platformNAP.address === request.agentProfile.address;
            const phoneMatches = platformNAP.phone === request.agentProfile.phone;

            detailedResults[platform] = {
                name: {
                    matches: nameMatches,
                    found: platformNAP.name,
                    confidence: nameConfidence,
                },
                address: {
                    matches: addressMatches,
                    found: platformNAP.address,
                    confidence: addressConfidence,
                },
                phone: {
                    matches: phoneMatches,
                    found: platformNAP.phone,
                    confidence: phoneConfidence,
                },
            };

            // Record inconsistencies
            if (!nameMatches) {
                inconsistencies.push({
                    field: 'name',
                    expected: request.agentProfile.name,
                    found: platformNAP.name,
                    platform,
                    confidence: nameConfidence,
                });
            }

            if (!addressMatches) {
                inconsistencies.push({
                    field: 'address',
                    expected: request.agentProfile.address,
                    found: platformNAP.address,
                    platform,
                    confidence: addressConfidence,
                });
            }

            if (!phoneMatches) {
                inconsistencies.push({
                    field: 'phone',
                    expected: request.agentProfile.phone,
                    found: platformNAP.phone,
                    platform,
                    confidence: phoneConfidence,
                });
            }
        }

        // Calculate overall consistency
        const totalChecks = request.platforms.length * 3; // 3 fields per platform
        const consistentChecks = totalChecks - inconsistencies.length;
        const overallConsistency = (consistentChecks / totalChecks) * 100;

        const result: BrandAuditResult = {
            inconsistencies,
            platformsChecked: request.platforms,
            overallConsistency,
            detailedResults,
            auditId,
            timestamp,
        };

        // Store audit result
        await this.storeAuditResult(request.userId, result);

        return result;
    }

    private async storeAuditResult(userId: string, result: BrandAuditResult): Promise<void> {
        try {
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `BRAND_AUDIT#${result.auditId}`,

                auditId: result.auditId,
                timestamp: result.timestamp,
                overallConsistency: result.overallConsistency,
                platformsChecked: result.platformsChecked,
                inconsistencyCount: result.inconsistencies.length,
                detailedResults: result.detailedResults,
                inconsistencies: result.inconsistencies,
                GSI1PK: `BRAND_AUDIT#${userId}`,
                GSI1SK: result.timestamp,
            });
        } catch (error) {
            console.error('Failed to store audit result:', error);
            // Don't throw - audit can still return results even if storage fails
        }
    }

    public createErrorResponse(error: ServiceError, statusCode: number = 500): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Service': 'brand-audit-service',
                'X-Error-ID': error.errorId,
            },
            body: JSON.stringify({ error }),
        };
    }

    public createSuccessResponse(data: any, statusCode: number = 200): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Service': 'brand-audit-service',
                'X-Request-ID': `req-${Date.now()}`,
            },
            body: JSON.stringify(data),
        };
    }
}

// Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const service = new BrandAuditService();

    try {
        // Parse request body
        if (!event.body) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'MISSING_BODY',
                message: 'Request body is required',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'brand-audit-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        const request: BrandAuditRequest = JSON.parse(event.body);

        // Validate request
        if (!request.agentProfile || !request.platforms || !request.userId) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Missing required fields: agentProfile, platforms, userId',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'brand-audit-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        if (!Array.isArray(request.platforms) || request.platforms.length === 0) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Platforms must be a non-empty array',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'brand-audit-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        // Process audit request
        const result = await service.auditNAPConsistency(request);

        return service.createSuccessResponse(result);

    } catch (error) {
        console.error('Brand audit service error:', error);

        const serviceError: ServiceError = {
            errorId: context.awsRequestId,
            errorCode: 'INTERNAL_ERROR',
            message: 'Internal service error occurred',
            details: { error: error instanceof Error ? error.message : String(error) },
            timestamp: new Date().toISOString(),
            traceId: context.awsRequestId,
            service: 'brand-audit-service',
            retryable: true,
        };

        return service.createErrorResponse(serviceError, 500);
    }
};

// Export service class for testing
export { BrandAuditService, PlatformNAPExtractor };