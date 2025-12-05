/**
 * Platform Configuration Service
 * 
 * Handles feature flags and platform settings management.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    getFeatureFlagKeys,
    getPlatformSettingKeys,
} from '@/aws/dynamodb/keys';
import { getCacheService, CacheKeys, CacheTTL } from './cache-service';

export interface FeatureFlag {
    flagId: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    targetUsers?: string[];
    targetRoles?: string[];
    createdAt: number;
    updatedAt: number;
    createdBy: string;
}

export interface PlatformSettings {
    settingId: string;
    category: 'general' | 'ai' | 'billing' | 'email' | 'security';
    key: string;
    value: any;
    description: string;
    updatedAt: number;
    updatedBy: string;
}

export class PlatformConfigService {
    private repository: DynamoDBRepository;
    private cache = getCacheService();

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Gets all feature flags
     * Uses in-memory caching (no expiry, invalidated on updates)
     */
    async getFeatureFlags(): Promise<FeatureFlag[]> {
        const cacheKey = CacheKeys.featureFlags();

        return this.cache.getOrSet(
            cacheKey,
            async () => {
                const result = await this.repository.query<FeatureFlag>(
                    'CONFIG#FEATURE_FLAGS',
                    'FLAG#'
                );

                return result.items;
            },
            Number.MAX_SAFE_INTEGER // No expiry
        );
    }

    /**
     * Creates or updates a feature flag
     * Invalidates cache on update
     */
    async setFeatureFlag(
        flagId: string,
        config: Partial<FeatureFlag>,
        adminId: string
    ): Promise<void> {
        const keys = getFeatureFlagKeys(flagId);
        const now = Date.now();

        // Check if flag exists
        const existing = await this.repository.get<FeatureFlag>(keys.PK, keys.SK);

        if (existing) {
            // Update existing flag
            await this.repository.update(keys.PK, keys.SK, {
                ...config,
                updatedAt: now,
            });
        } else {
            // Create new flag
            const newFlag: FeatureFlag = {
                flagId,
                name: config.name || flagId,
                description: config.description || '',
                enabled: config.enabled ?? false,
                rolloutPercentage: config.rolloutPercentage ?? 0,
                targetUsers: config.targetUsers,
                targetRoles: config.targetRoles,
                createdAt: now,
                updatedAt: now,
                createdBy: adminId,
            };

            await this.repository.create(
                keys.PK,
                keys.SK,
                'FeatureFlag',
                newFlag
            );
        }

        // Invalidate cache
        this.cache.invalidate(CacheKeys.featureFlags());
        this.cache.invalidate(CacheKeys.featureFlag(flagId));
    }

    /**
     * Checks if a feature is enabled for a user
     */
    async isFeatureEnabled(flagId: string, userId: string, userRole?: string): Promise<boolean> {
        const keys = getFeatureFlagKeys(flagId);
        const flag = await this.repository.get<FeatureFlag>(keys.PK, keys.SK);

        if (!flag || !flag.enabled) {
            return false;
        }

        // Check if user is in target users
        if (flag.targetUsers && flag.targetUsers.length > 0) {
            return flag.targetUsers.includes(userId);
        }

        // Check if user role is in target roles
        if (flag.targetRoles && flag.targetRoles.length > 0 && userRole) {
            return flag.targetRoles.includes(userRole);
        }

        // Check rollout percentage
        if (flag.rolloutPercentage < 100) {
            // Simple hash-based rollout
            const hash = this.hashString(userId + flagId);
            const userPercentage = hash % 100;
            return userPercentage < flag.rolloutPercentage;
        }

        return true;
    }

    /**
     * Gets platform settings by category
     */
    async getSettings(category?: string): Promise<PlatformSettings[]> {
        const pk = 'CONFIG#SETTINGS';
        const skPrefix = category ? `SETTING#${category}#` : 'SETTING#';

        const result = await this.repository.query<PlatformSettings>(pk, skPrefix);

        return result.items;
    }

    /**
     * Updates a platform setting
     */
    async updateSetting(
        category: string,
        key: string,
        value: any,
        adminId: string
    ): Promise<void> {
        const keys = getPlatformSettingKeys(category, key);
        const now = Date.now();

        // Check if setting exists
        const existing = await this.repository.get<PlatformSettings>(keys.PK, keys.SK);

        if (existing) {
            // Update existing setting
            await this.repository.update(keys.PK, keys.SK, {
                value,
                updatedAt: now,
                updatedBy: adminId,
            });
        } else {
            // Create new setting
            const newSetting: PlatformSettings = {
                settingId: `${category}#${key}`,
                category: category as PlatformSettings['category'],
                key,
                value,
                description: '',
                updatedAt: now,
                updatedBy: adminId,
            };

            await this.repository.create(
                keys.PK,
                keys.SK,
                'PlatformSetting',
                newSetting
            );
        }
    }

    /**
     * Simple string hash function for rollout percentage
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

// Export singleton instance
export const platformConfigService = new PlatformConfigService();
