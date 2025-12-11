import { getRepository } from "@/aws/dynamodb/repository";
import { getAPIKeyKeys } from "@/aws/dynamodb";
import crypto from "crypto";

export interface APIKey {
    keyId: string;
    name: string;
    keyHash: string;
    createdAt: number;
    createdBy: string;
    lastUsed?: number;
    status: "active" | "revoked";
    revokedAt?: number;
    revokedBy?: string;
    permissions: string[];
}

export interface APIUsageMetrics {
    keyId: string;
    keyName: string;
    totalRequests: number;
    requestsToday: number;
    requestsThisWeek: number;
    requestsThisMonth: number;
    lastUsed?: number;
    rateLimitStatus: {
        limit: number;
        remaining: number;
        resetAt: number;
    };
    usageByEndpoint: Record<string, number>;
}

export interface ThirdPartyIntegration {
    integrationId: string;
    name: string;
    provider: string;
    status: "active" | "inactive" | "error";
    lastSync?: number;
    config: Record<string, any>;
    apiKeyId?: string;
}

export interface RateLimitAlert {
    alertId: string;
    keyId: string;
    keyName: string;
    timestamp: number;
    limitExceeded: number;
    currentUsage: number;
    limit: number;
}

/**
 * Service for managing API keys and third-party integrations
 */
export class APIKeyService {
    private repository = getRepository();

    /**
     * Generates a secure API key
     * Returns the plain key (shown once) and stores the hash
     */
    async generateAPIKey(
        name: string,
        permissions: string[],
        createdBy: string
    ): Promise<{ keyId: string; plainKey: string; apiKey: APIKey }> {
        // Generate a secure random key
        const plainKey = `byn_${crypto.randomBytes(32).toString("hex")}`;
        const keyHash = this.hashAPIKey(plainKey);
        const keyId = crypto.randomUUID();

        const apiKey: APIKey = {
            keyId,
            name,
            keyHash,
            createdAt: Date.now(),
            createdBy,
            status: "active",
            permissions,
        };

        // Store the API key using proper repository method
        const keys = getAPIKeyKeys(keyId);
        await this.repository.create(
            keys.PK,
            keys.SK,
            "APIKey",
            apiKey
        );

        // Create audit log
        await this.createAuditLog({
            action: "api_key_created",
            adminId: createdBy,
            resourceType: "api_key",
            resourceId: keyId,
            details: {
                name,
                permissions,
            },
        });

        return { keyId, plainKey, apiKey };
    }

    /**
     * Hashes an API key for secure storage
     */
    private hashAPIKey(plainKey: string): string {
        return crypto.createHash("sha256").update(plainKey).digest("hex");
    }

    /**
     * Validates an API key and returns the key details if valid
     */
    async validateAPIKey(plainKey: string): Promise<APIKey | null> {
        const keyHash = this.hashAPIKey(plainKey);

        // Query all active API keys and find matching hash
        const result = await this.repository.query<APIKey>(
            "APIKEYS#ACTIVE",
            ""
        );

        const matchingKey = result.items.find(
            (item) => item.keyHash === keyHash && item.status === "active"
        );

        if (!matchingKey) {
            return null;
        }

        // Update last used timestamp
        await this.updateLastUsed(matchingKey.keyId);

        return matchingKey;
    }

    /**
     * Updates the last used timestamp for an API key
     */
    private async updateLastUsed(keyId: string): Promise<void> {
        const keys = getAPIKeyKeys(keyId);
        await this.repository.update(keys.PK, keys.SK, {
            lastUsed: Date.now(),
        });
    }

    /**
     * Gets all API keys
     */
    async getAllAPIKeys(options?: {
        status?: "active" | "revoked";
        limit?: number;
        lastKey?: string;
    }): Promise<{ keys: APIKey[]; lastKey?: string }> {
        const status = options?.status || "active";
        const limit = options?.limit || 50;

        const result = await this.repository.query({
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `APIKEYS#${status.toUpperCase()}`,
            },
            Limit: limit,
            ExclusiveStartKey: options?.lastKey
                ? JSON.parse(options.lastKey)
                : undefined,
            ScanIndexForward: false, // Most recent first
        });

        return {
            keys: (result.Items?.map((item) => item.Data) as APIKey[]) || [],
            lastKey: result.LastEvaluatedKey
                ? JSON.stringify(result.LastEvaluatedKey)
                : undefined,
        };
    }

    /**
     * Gets API usage metrics for a specific key
     */
    async getAPIUsage(keyId: string): Promise<APIUsageMetrics | null> {
        // Get the API key details
        const keys = getAPIKeyKeys(keyId);
        const keyResult = await this.repository.get({
            PK: keys.PK,
            SK: keys.SK,
        });

        if (!keyResult?.Item) {
            return null;
        }

        const apiKey = keyResult.Item.Data as APIKey;

        // Get usage metrics from analytics events
        const now = Date.now();
        const oneDayAgo = now - 86400000;
        const oneWeekAgo = now - 604800000;
        const oneMonthAgo = now - 2592000000;

        // Query analytics events for this API key
        const usageResult = await this.repository.query({
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk AND GSI1SK > :timestamp",
            ExpressionAttributeValues: {
                ":pk": `APIKEY#${keyId}#USAGE`,
                ":timestamp": oneMonthAgo,
            },
        });

        const events = usageResult.Items || [];

        // Calculate metrics
        const totalRequests = events.length;
        const requestsToday = events.filter(
            (e) => e.Data.timestamp > oneDayAgo
        ).length;
        const requestsThisWeek = events.filter(
            (e) => e.Data.timestamp > oneWeekAgo
        ).length;
        const requestsThisMonth = events.length;

        // Calculate usage by endpoint
        const usageByEndpoint: Record<string, number> = {};
        events.forEach((event) => {
            const endpoint = event.Data.endpoint || "unknown";
            usageByEndpoint[endpoint] = (usageByEndpoint[endpoint] || 0) + 1;
        });

        // Calculate rate limit status (example: 1000 requests per hour)
        const oneHourAgo = now - 3600000;
        const requestsThisHour = events.filter(
            (e) => e.Data.timestamp > oneHourAgo
        ).length;
        const rateLimit = 1000;
        const remaining = Math.max(0, rateLimit - requestsThisHour);
        const resetAt = Math.ceil(now / 3600000) * 3600000; // Next hour boundary

        return {
            keyId,
            keyName: apiKey.name,
            totalRequests,
            requestsToday,
            requestsThisWeek,
            requestsThisMonth,
            lastUsed: apiKey.lastUsed,
            rateLimitStatus: {
                limit: rateLimit,
                remaining,
                resetAt,
            },
            usageByEndpoint,
        };
    }

    /**
     * Revokes an API key immediately
     */
    async revokeAPIKey(keyId: string, revokedBy: string): Promise<void> {
        const keys = getAPIKeyKeys(keyId);

        // Get current key data
        const result = await this.repository.get({
            PK: keys.PK,
            SK: keys.SK,
        });

        if (!result?.Item) {
            throw new Error("API key not found");
        }

        const apiKey = result.Item.Data as APIKey;

        if (apiKey.status === "revoked") {
            throw new Error("API key is already revoked");
        }

        // Update key status
        await this.repository.update({
            PK: keys.PK,
            SK: keys.SK,
            UpdateExpression:
                "SET #data.#status = :status, #data.#revokedAt = :timestamp, #data.#revokedBy = :revokedBy, GSI1PK = :gsi1pk",
            ExpressionAttributeNames: {
                "#data": "Data",
                "#status": "status",
                "#revokedAt": "revokedAt",
                "#revokedBy": "revokedBy",
            },
            ExpressionAttributeValues: {
                ":status": "revoked",
                ":timestamp": Date.now(),
                ":revokedBy": revokedBy,
                ":gsi1pk": "APIKEYS#REVOKED",
            },
        });

        // Create audit log
        await this.createAuditLog({
            action: "api_key_revoked",
            adminId: revokedBy,
            resourceType: "api_key",
            resourceId: keyId,
            details: {
                name: apiKey.name,
            },
        });
    }

    /**
     * Gets rate limit alerts
     */
    async getRateLimitAlerts(options?: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<RateLimitAlert[]> {
        const startDate = options?.startDate || new Date(Date.now() - 86400000); // Last 24 hours
        const endDate = options?.endDate || new Date();
        const limit = options?.limit || 100;

        const result = await this.repository.query({
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end",
            ExpressionAttributeValues: {
                ":pk": "ALERTS#RATE_LIMIT",
                ":start": startDate.getTime(),
                ":end": endDate.getTime(),
            },
            Limit: limit,
            ScanIndexForward: false, // Most recent first
        });

        return (result.Items?.map((item) => item.Data) as RateLimitAlert[]) || [];
    }

    /**
     * Records a rate limit violation
     */
    async recordRateLimitViolation(
        keyId: string,
        keyName: string,
        currentUsage: number,
        limit: number
    ): Promise<void> {
        const alertId = crypto.randomUUID();
        const timestamp = Date.now();

        const alert: RateLimitAlert = {
            alertId,
            keyId,
            keyName,
            timestamp,
            limitExceeded: currentUsage - limit,
            currentUsage,
            limit,
        };

        await this.repository.put({
            PK: `ALERT#${alertId}`,
            SK: "METADATA",
            EntityType: "RateLimitAlert",
            Data: alert,
            GSI1PK: "ALERTS#RATE_LIMIT",
            GSI1SK: timestamp,
        });
    }

    /**
     * Gets all third-party integrations
     */
    async getIntegrations(): Promise<ThirdPartyIntegration[]> {
        const result = await this.repository.query({
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": "CONFIG#INTEGRATIONS",
            },
        });

        return (result.Items?.map((item) => item.Data) as ThirdPartyIntegration[]) || [];
    }

    /**
     * Updates an integration status
     */
    async updateIntegrationStatus(
        integrationId: string,
        status: "active" | "inactive" | "error",
        updatedBy: string
    ): Promise<void> {
        await this.repository.update({
            PK: "CONFIG#INTEGRATIONS",
            SK: `INTEGRATION#${integrationId}`,
            UpdateExpression:
                "SET #data.#status = :status, #data.#lastSync = :timestamp",
            ExpressionAttributeNames: {
                "#data": "Data",
                "#status": "status",
                "#lastSync": "lastSync",
            },
            ExpressionAttributeValues: {
                ":status": status,
                ":timestamp": Date.now(),
            },
        });

        // Create audit log
        await this.createAuditLog({
            action: "integration_status_updated",
            adminId: updatedBy,
            resourceType: "integration",
            resourceId: integrationId,
            details: {
                status,
            },
        });
    }

    /**
     * Creates an audit log entry
     */
    private async createAuditLog(entry: {
        action: string;
        adminId: string;
        resourceType: string;
        resourceId: string;
        details: Record<string, any>;
    }): Promise<void> {
        const auditId = crypto.randomUUID();
        const timestamp = Date.now();

        await this.repository.put({
            PK: `AUDIT#${timestamp}`,
            SK: `ENTRY#${auditId}`,
            EntityType: "AuditLog",
            Data: {
                auditId,
                timestamp,
                action: entry.action,
                adminId: entry.adminId,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId,
                details: entry.details,
            },
            GSI1PK: `ADMIN#${entry.adminId}`,
            GSI1SK: timestamp,
        });
    }
}

// Export singleton instance
export const apiKeyService = new APIKeyService();
