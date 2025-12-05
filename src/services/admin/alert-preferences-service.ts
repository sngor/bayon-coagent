/**
 * Alert Preferences Service
 * 
 * Manages SuperAdmin alert preferences including:
 * - Alert type subscriptions
 * - Notification frequency (immediate, batched, digest)
 * - Alert severity thresholds
 * - Quiet hours configuration
 */

import { getRepository } from '@/aws/dynamodb/repository';

export interface AlertPreferences {
    userId: string;
    email: string;
    alertTypes: {
        systemHealth: boolean;
        errorRates: boolean;
        performanceIssues: boolean;
        securityAlerts: boolean;
        billingAlerts: boolean;
    };
    frequency: 'immediate' | 'hourly' | 'daily';
    severityThreshold: 'info' | 'warning' | 'critical';
    quietHours?: {
        enabled: boolean;
        startHour: number; // 0-23
        endHour: number; // 0-23
        timezone: string;
    };
    digestTime?: {
        hour: number; // 0-23
        timezone: string;
    };
    updatedAt: number;
}

export class AlertPreferencesService {
    private repository = getRepository();

    /**
     * Gets alert preferences for a SuperAdmin
     */
    async getPreferences(userId: string): Promise<AlertPreferences> {
        const item = await this.repository.get(`USER#${userId}`, 'ALERT_PREFERENCES');

        if (!item) {
            // Return default preferences
            return this.getDefaultPreferences(userId);
        }

        return item.Data as AlertPreferences;
    }

    /**
     * Updates alert preferences for a SuperAdmin
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<AlertPreferences>
    ): Promise<void> {
        const current = await this.getPreferences(userId);

        const updated: AlertPreferences = {
            ...current,
            ...preferences,
            userId,
            updatedAt: Date.now(),
        };

        await this.repository.create({
            PK: `USER#${userId}`,
            SK: 'ALERT_PREFERENCES',
            EntityType: 'AlertPreferences',
            Data: updated,
        });
    }

    /**
     * Gets all SuperAdmins who should receive an alert
     */
    async getSuperAdminsForAlert(params: {
        alertType: keyof AlertPreferences['alertTypes'];
        severity: 'info' | 'warning' | 'critical';
    }): Promise<Array<{ userId: string; email: string; preferences: AlertPreferences }>> {
        const { alertType, severity } = params;

        // Get all SuperAdmins
        const superAdmins = await this.getAllSuperAdmins();

        const recipients: Array<{ userId: string; email: string; preferences: AlertPreferences }> = [];

        for (const admin of superAdmins) {
            const preferences = await this.getPreferences(admin.userId);

            // Check if alert type is enabled
            if (!preferences.alertTypes[alertType]) {
                continue;
            }

            // Check severity threshold
            const severityLevels = { info: 0, warning: 1, critical: 2 };
            if (severityLevels[severity] < severityLevels[preferences.severityThreshold]) {
                continue;
            }

            // Check quiet hours
            if (this.isInQuietHours(preferences)) {
                continue;
            }

            recipients.push({
                userId: admin.userId,
                email: admin.email,
                preferences,
            });
        }

        return recipients;
    }

    /**
     * Checks if current time is within quiet hours
     */
    private isInQuietHours(preferences: AlertPreferences): boolean {
        if (!preferences.quietHours?.enabled) {
            return false;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const { startHour, endHour } = preferences.quietHours;

        if (startHour < endHour) {
            return currentHour >= startHour && currentHour < endHour;
        } else {
            // Quiet hours span midnight
            return currentHour >= startHour || currentHour < endHour;
        }
    }

    /**
     * Gets all SuperAdmins
     */
    private async getAllSuperAdmins(): Promise<Array<{ userId: string; email: string }>> {
        // Query for all users with SuperAdmin role
        const items = await this.repository.query('ROLE#superadmin', '');

        return items.map(item => ({
            userId: item.Data.userId,
            email: item.Data.email,
        }));
    }

    /**
     * Gets default alert preferences
     */
    private getDefaultPreferences(userId: string): AlertPreferences {
        return {
            userId,
            email: '',
            alertTypes: {
                systemHealth: true,
                errorRates: true,
                performanceIssues: true,
                securityAlerts: true,
                billingAlerts: true,
            },
            frequency: 'immediate',
            severityThreshold: 'warning',
            quietHours: {
                enabled: false,
                startHour: 22,
                endHour: 8,
                timezone: 'America/Los_Angeles',
            },
            digestTime: {
                hour: 9,
                timezone: 'America/Los_Angeles',
            },
            updatedAt: Date.now(),
        };
    }
}

// Export singleton instance
let alertPreferencesService: AlertPreferencesService | null = null;

export function getAlertPreferencesService(): AlertPreferencesService {
    if (!alertPreferencesService) {
        alertPreferencesService = new AlertPreferencesService();
    }
    return alertPreferencesService;
}
