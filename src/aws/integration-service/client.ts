/**
 * Integration Service Client
 * 
 * Client for calling the Integration Service Lambda functions via API Gateway.
 * Provides OAuth and MLS integration functionality.
 * 
 * Requirements: 1.5 - Backward compatibility with existing client applications
 */

import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@smithy/protocol-http';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

const INTEGRATION_SERVICE_URL =
    process.env.INTEGRATION_SERVICE_API_URL ||
    process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_API_URL ||
    '';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Sign a request with AWS Signature V4
 */
async function signRequest(request: HttpRequest): Promise<HttpRequest> {
    const signer = new SignatureV4({
        service: 'execute-api',
        region: AWS_REGION,
        credentials: defaultProvider(),
        sha256: Sha256,
    });

    return signer.sign(request) as Promise<HttpRequest>;
}

/**
 * Make a signed request to the Integration Service API
 */
async function makeSignedRequest(
    path: string,
    method: string = 'GET',
    body?: any
): Promise<Response> {
    const url = new URL(path, INTEGRATION_SERVICE_URL);

    const request = new HttpRequest({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
            'Content-Type': 'application/json',
            host: url.hostname,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const signedRequest = await signRequest(request);

    return fetch(url.toString(), {
        method: signedRequest.method,
        headers: signedRequest.headers as HeadersInit,
        body: signedRequest.body,
    });
}

/**
 * OAuth Integration Client
 */
export class OAuthIntegrationClient {
    /**
     * Initiate Google OAuth flow
     */
    async initiateGoogleOAuth(userId: string): Promise<{ authUrl: string; state: string }> {
        const response = await makeSignedRequest(
            `/oauth/google/authorize?userId=${userId}`,
            'GET'
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to initiate Google OAuth');
        }

        const data = await response.json();
        return data.data;
    }

    /**
     * Initiate social media OAuth flow
     */
    async initiateSocialOAuth(
        platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter',
        userId: string
    ): Promise<{ authUrl: string; state: string }> {
        const response = await makeSignedRequest(
            `/oauth/${platform}/authorize?userId=${userId}`,
            'GET'
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `Failed to initiate ${platform} OAuth`);
        }

        const data = await response.json();
        return data.data;
    }
}

/**
 * MLS Integration Client
 */
export class MLSIntegrationClient {
    /**
     * Trigger MLS data sync
     */
    async syncMLSData(
        userId: string,
        provider: 'mlsgrid' | 'bridgeInteractive',
        agentId: string,
        syncType: 'full' | 'incremental' = 'full'
    ): Promise<{
        syncId: string;
        totalListings: number;
        syncedListings: number;
        failedListings: number;
    }> {
        const response = await makeSignedRequest('/mls/sync', 'POST', {
            userId,
            provider,
            agentId,
            syncType,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to sync MLS data');
        }

        const data = await response.json();
        return data.data;
    }

    /**
     * Get MLS sync status
     */
    async getSyncStatus(
        userId: string,
        syncId: string
    ): Promise<{
        syncId: string;
        provider: string;
        agentId: string;
        syncType: string;
        status: string;
        startedAt: number;
        completedAt?: number;
        totalListings: number;
        syncedListings: number;
        failedListings: number;
        error?: string;
    }> {
        const response = await makeSignedRequest(
            `/mls/status/${syncId}?userId=${userId}`,
            'GET'
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get sync status');
        }

        const data = await response.json();
        return data.data;
    }
}

// Export singleton instances
export const oauthClient = new OAuthIntegrationClient();
export const mlsClient = new MLSIntegrationClient();
