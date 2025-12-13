/**
 * API Client for Lambda Functions
 * Replaces direct server actions with API Gateway + Lambda calls
 */

import { getCurrentUser } from '@/aws/auth/cognito-client';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    correlationId?: string;
}

class ApiClient {
    private baseUrls: Record<string, string>;

    constructor() {
        // Get API Gateway URLs from environment
        this.baseUrls = {
            ai: process.env.NEXT_PUBLIC_AI_SERVICE_API_URL || '',
            integration: process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_API_URL || '',
            background: process.env.NEXT_PUBLIC_BACKGROUND_SERVICE_API_URL || '',
            admin: process.env.NEXT_PUBLIC_ADMIN_SERVICE_API_URL || '',
        };
    }

    private async getAuthHeaders(): Promise<Record<string, string>> {
        try {
            const user = await getCurrentUser();
            if (!user?.accessToken) {
                throw new Error('No authentication token available');
            }

            return {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json',
            };
        } catch (error) {
            console.error('Failed to get auth headers:', error);
            throw new Error('Authentication required');
        }
    }

    private async makeRequest<T>(
        service: keyof typeof this.baseUrls,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const baseUrl = this.baseUrls[service];
        if (!baseUrl) {
            throw new Error(`API URL not configured for service: ${service}`);
        }

        const url = `${baseUrl}${endpoint}`;
        const headers = await this.getAuthHeaders();

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error: any) {
            console.error(`API request failed: ${url}`, error);
            throw error;
        }
    }

    // ==========================================
    // AI Service Methods
    // ==========================================

    async generateContent(type: string, input: any) {
        return this.makeRequest('ai', '/content', {
            method: 'POST',
            body: JSON.stringify({ type, input }),
        });
    }

    async runResearch(type: string, input: any) {
        return this.makeRequest('ai', '/research', {
            method: 'POST',
            body: JSON.stringify({ type, input }),
        });
    }

    async analyzeBrand(type: string, input: any) {
        return this.makeRequest('ai', '/brand', {
            method: 'POST',
            body: JSON.stringify({ type, input }),
        });
    }

    // ==========================================
    // Integration Service Methods
    // ==========================================

    async connectOAuth(provider: string) {
        return this.makeRequest('integration', `/oauth?action=connect&provider=${provider}`, {
            method: 'GET',
        });
    }

    async exchangeOAuthToken(provider: string, code: string) {
        return this.makeRequest('integration', `/oauth?action=exchange-token&provider=${provider}`, {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async getOAuthStatus(provider: string) {
        return this.makeRequest('integration', `/oauth?action=get-status&provider=${provider}`, {
            method: 'GET',
        });
    }

    async disconnectOAuth(provider: string) {
        return this.makeRequest('integration', `/oauth?action=disconnect&provider=${provider}`, {
            method: 'DELETE',
        });
    }

    async uploadFile(file: File, key?: string) {
        const formData = new FormData();
        formData.append('file', file);
        if (key) formData.append('key', key);

        const headers = await this.getAuthHeaders();
        delete headers['Content-Type']; // Let browser set multipart boundary

        return this.makeRequest('integration', '/files', {
            method: 'POST',
            headers,
            body: formData,
        });
    }

    async getFileUrl(key: string, expiresIn?: number) {
        const params = new URLSearchParams({ key });
        if (expiresIn) params.append('expiresIn', expiresIn.toString());

        return this.makeRequest('integration', `/files?${params.toString()}`, {
            method: 'GET',
        });
    }

    async deleteFile(key: string) {
        return this.makeRequest('integration', `/files?key=${key}`, {
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// ==========================================
// Typed API Methods (replacing server actions)
// ==========================================

// Content Generation
export async function generateNeighborhoodGuide(input: any) {
    return apiClient.generateContent('neighborhood-guide', input);
}

export async function generateBlogPost(input: any) {
    return apiClient.generateContent('blog-post', input);
}

export async function generateSocialMediaPost(input: any) {
    return apiClient.generateContent('social-media-post', input);
}

export async function generateVideoScript(input: any) {
    return apiClient.generateContent('video-script', input);
}

export async function generateMarketUpdate(input: any) {
    return apiClient.generateContent('market-update', input);
}

export async function generateFutureCast(input: any) {
    return apiClient.generateContent('future-cast', input);
}

// Research
export async function runResearchAgent(input: any) {
    return apiClient.runResearch('research-agent', input);
}

export async function runPropertyValuation(input: any) {
    return apiClient.runResearch('property-valuation', input);
}

export async function runRenovationROI(input: any) {
    return apiClient.runResearch('renovation-roi', input);
}

// Brand Analysis
export async function findCompetitors(input: any) {
    return apiClient.analyzeBrand('find-competitors', input);
}

export async function enrichCompetitorData(input: any) {
    return apiClient.analyzeBrand('enrich-competitor', input);
}

export async function runNapAudit(input: any) {
    return apiClient.analyzeBrand('nap-audit', input);
}

export async function generateAgentBio(input: any) {
    return apiClient.analyzeBrand('agent-bio', input);
}

export async function generateMarketingPlan(input: any) {
    return apiClient.analyzeBrand('marketing-plan', input);
}

// OAuth Integration
export async function connectGoogleBusinessProfile() {
    return apiClient.connectOAuth('google-business');
}

export async function getGoogleConnectionStatus() {
    return apiClient.getOAuthStatus('google-business');
}

export async function exchangeGoogleToken(code: string) {
    return apiClient.exchangeOAuthToken('google-business', code);
}

// File Management
export async function uploadFileToS3(file: File, key?: string) {
    return apiClient.uploadFile(file, key);
}

export async function getPresignedUrl(key: string, expiresIn?: number) {
    return apiClient.getFileUrl(key, expiresIn);
}

export async function deleteFileFromS3(key: string) {
    return apiClient.deleteFile(key);
}