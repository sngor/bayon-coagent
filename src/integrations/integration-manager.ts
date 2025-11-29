/**
 * Integration Manager
 * 
 * Central manager for all third-party integrations.
 * Provides a unified interface for managing integration connections,
 * service registry, and health monitoring.
 */

import {
    IntegrationProvider,
    IntegrationType,
    IntegrationConnection,
    IntegrationStatus,
    IntegrationHealth,
    IntegrationResult,
    BaseIntegration,
    IntegrationCredentials
} from './types';
import { integrationRepository } from './integration-repository';

/**
 * Integration Service Interface
 * All integration providers must implement this interface
 */
export interface IntegrationService {
    provider: IntegrationProvider;
    type: IntegrationType;

    /**
     * Initialize connection (e.g., start OAuth flow or validate credentials)
     */
    connect(userId: string, config?: Record<string, any>): Promise<IntegrationResult<string>>;

    /**
     * Disconnect and cleanup
     */
    disconnect(userId: string): Promise<IntegrationResult<void>>;

    /**
     * Validate connection health
     */
    validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>>;

    /**
     * Refresh credentials if needed (e.g., OAuth token refresh)
     */
    refresh?(connection: IntegrationConnection): Promise<IntegrationResult<IntegrationConnection>>;
}

/**
 * Integration Service Registry
 */
class IntegrationRegistry {
    private services: Map<IntegrationProvider, IntegrationService> = new Map();

    /**
     * Register an integration service
     */
    register(service: IntegrationService): void {
        this.services.set(service.provider, service);
    }

    /**
     * Get integration service by provider
     */
    get(provider: IntegrationProvider): IntegrationService | undefined {
        return this.services.get(provider);
    }

    /**
     * Check if provider is registered
     */
    has(provider: IntegrationProvider): boolean {
        return this.services.has(provider);
    }

    /**
     * List all registered providers
     */
    list(): IntegrationProvider[] {
        return Array.from(this.services.keys());
    }

    /**
     * List providers by type
     */
    listByType(type: IntegrationType): IntegrationProvider[] {
        return Array.from(this.services.values())
            .filter(service => service.type === type)
            .map(service => service.provider);
    }
}

/**
 * Integration Manager Class
 */
export class IntegrationManager {
    private registry: IntegrationRegistry;

    constructor() {
        this.registry = new IntegrationRegistry();
    }

    /**
     * Register an integration service
     */
    registerService(service: IntegrationService): void {
        this.registry.register(service);
    }

    /**
     * Get integration service
     */
    getService(provider: IntegrationProvider): IntegrationService | undefined {
        return this.registry.get(provider);
    }

    /**
     * Connect to an integration
     */
    async connect(
        userId: string,
        provider: IntegrationProvider,
        config?: Record<string, any>
    ): Promise<IntegrationResult<string>> {
        const service = this.registry.get(provider);

        if (!service) {
            return {
                success: false,
                error: `Integration provider '${provider}' is not registered`
            };
        }

        try {
            return await service.connect(userId, config);
        } catch (error) {
            console.error(`Failed to connect to ${provider}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Disconnect from an integration
     */
    async disconnect(
        userId: string,
        provider: IntegrationProvider
    ): Promise<IntegrationResult<void>> {
        const service = this.registry.get(provider);

        if (!service) {
            return {
                success: false,
                error: `Integration provider '${provider}' is not registered`
            };
        }

        try {
            // Call service disconnect
            const result = await service.disconnect(userId);

            // Remove from database
            if (result.success) {
                await integrationRepository.deleteByProvider(userId, provider);
            }

            return result;
        } catch (error) {
            console.error(`Failed to disconnect from ${provider}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Disconnection failed'
            };
        }
    }

    /**
     * Get integration connection
     */
    async getConnection(
        userId: string,
        provider: IntegrationProvider
    ): Promise<IntegrationConnection | null> {
        try {
            return await integrationRepository.getByProvider(userId, provider);
        } catch (error) {
            console.error(`Failed to get connection for ${provider}:`, error);
            return null;
        }
    }

    /**
     * List all connections for a user
     */
    async listConnections(userId: string): Promise<IntegrationConnection[]> {
        try {
            return await integrationRepository.listByUser(userId);
        } catch (error) {
            console.error('Failed to list connections:', error);
            return [];
        }
    }

    /**
     * List connections by type
     */
    async listConnectionsByType(
        userId: string,
        type: IntegrationType
    ): Promise<IntegrationConnection[]> {
        try {
            return await integrationRepository.listByType(userId, type);
        } catch (error) {
            console.error(`Failed to list ${type} connections:`, error);
            return [];
        }
    }

    /**
     * Validate integration connection
     */
    async validateConnection(
        userId: string,
        provider: IntegrationProvider
    ): Promise<IntegrationHealth> {
        const service = this.registry.get(provider);
        const health: IntegrationHealth = {
            provider,
            isConnected: false,
            isValid: false,
            lastChecked: Date.now(),
            healthScore: 0,
            issues: []
        };

        if (!service) {
            health.issues.push(`Provider '${provider}' is not registered`);
            return health;
        }

        try {
            const connection = await this.getConnection(userId, provider);

            if (!connection) {
                health.issues.push('No connection found');
                return health;
            }

            health.isConnected = true;

            // Check if credentials are expired
            if (connection.expiresAt && connection.expiresAt < Date.now()) {
                health.issues.push('Credentials expired');
                health.healthScore = 25;

                // Try to refresh if service supports it
                if (service.refresh) {
                    try {
                        const refreshResult = await service.refresh(connection);
                        if (refreshResult.success && refreshResult.data) {
                            await integrationRepository.update(refreshResult.data);
                            health.issues = [];
                            health.isValid = true;
                            health.healthScore = 100;
                            return health;
                        }
                    } catch (error) {
                        health.issues.push('Failed to refresh credentials');
                    }
                }

                await integrationRepository.updateStatus(
                    userId,
                    connection.id,
                    'expired',
                    'Credentials expired'
                );
                return health;
            }

            // Validate connection with the service
            const validationResult = await service.validate(connection);

            if (validationResult.success) {
                health.isValid = true;
                health.healthScore = 100;

                await integrationRepository.updateStatus(
                    userId,
                    connection.id,
                    'active'
                );
            } else {
                health.issues.push(validationResult.error || 'Validation failed');
                health.healthScore = 25;

                await integrationRepository.updateStatus(
                    userId,
                    connection.id,
                    'error',
                    validationResult.error
                );
            }

            return health;
        } catch (error) {
            health.issues.push(error instanceof Error ? error.message : 'Unknown error');
            return health;
        }
    }

    /**
     * Get health status for all user's integrations
     */
    async getHealthStatus(userId: string): Promise<{
        integrations: IntegrationHealth[];
        overallHealth: number;
    }> {
        const connections = await this.listConnections(userId);

        const healthChecks = await Promise.all(
            connections.map(conn => this.validateConnection(userId, conn.provider))
        );

        const overallHealth = healthChecks.length > 0
            ? Math.round(
                healthChecks.reduce((sum, health) => sum + health.healthScore, 0) /
                healthChecks.length
            )
            : 0;

        return {
            integrations: healthChecks,
            overallHealth
        };
    }

    /**
     * List all available integration providers
     */
    listAvailableProviders(): IntegrationProvider[] {
        return this.registry.list();
    }

    /**
     * List available providers by type
     */
    listProvidersByType(type: IntegrationType): IntegrationProvider[] {
        return this.registry.listByType(type);
    }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();
