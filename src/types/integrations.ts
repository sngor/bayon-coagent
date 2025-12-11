/**
 * Integration types and interfaces
 */

export type IntegrationCategory = 'ai' | 'analytics' | 'communication' | 'storage' | 'payment' | 'search';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface IntegrationUsage {
    requests: number;
    limit: number;
    cost: number;
}

export interface Integration {
    id: string;
    name: string;
    description: string;
    category: IntegrationCategory;
    status: IntegrationStatus;
    apiKey?: string;
    endpoint?: string;
    lastSync?: string;
    usage?: IntegrationUsage;
    config?: Record<string, any>;
}

export interface IntegrationStats {
    total: number;
    active: number;
    totalRequests: number;
    totalCost: number;
}