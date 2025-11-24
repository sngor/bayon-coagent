/**
 * AWS Secrets Manager Secret Rotation Lambda Handler
 * 
 * This Lambda function handles automatic rotation of OAuth credentials
 * and API keys stored in AWS Secrets Manager.
 * 
 * Requirements: 6.4 - Automatic secret rotation policies
 * 
 * Rotation Steps:
 * 1. createSecret: Generate new credentials (if applicable)
 * 2. setSecret: Store new credentials in the secret
 * 3. testSecret: Verify new credentials work
 * 4. finishSecret: Mark rotation as complete
 */

import {
    SecretsManagerClient,
    GetSecretValueCommand,
    PutSecretValueCommand,
    UpdateSecretVersionStageCommand,
    DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

interface RotationEvent {
    Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
    SecretId: string;
    Token: string;
    ClientRequestToken: string;
}

interface RotationContext {
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

/**
 * Lambda handler for secret rotation
 */
export async function handler(
    event: RotationEvent,
    context: RotationContext
): Promise<void> {
    console.log('Secret rotation event:', JSON.stringify(event, null, 2));

    const { Step, SecretId, Token } = event;

    try {
        switch (Step) {
            case 'createSecret':
                await createSecret(SecretId, Token);
                break;
            case 'setSecret':
                await setSecret(SecretId, Token);
                break;
            case 'testSecret':
                await testSecret(SecretId, Token);
                break;
            case 'finishSecret':
                await finishSecret(SecretId, Token);
                break;
            default:
                throw new Error(`Invalid rotation step: ${Step}`);
        }

        console.log(`Successfully completed rotation step: ${Step}`);
    } catch (error) {
        console.error(`Failed to complete rotation step ${Step}:`, error);
        throw error;
    }
}

/**
 * Step 1: Create a new version of the secret
 * 
 * For OAuth credentials, we don't generate new credentials automatically
 * as they require manual setup with the OAuth provider. Instead, we
 * prepare the secret for manual update.
 */
async function createSecret(secretId: string, token: string): Promise<void> {
    console.log(`Creating new secret version for ${secretId}`);

    // Check if the secret already has a AWSPENDING version
    const describeCommand = new DescribeSecretCommand({ SecretId: secretId });
    const secretMetadata = await client.send(describeCommand);

    if (secretMetadata.VersionIdsToStages?.[token]?.includes('AWSPENDING')) {
        console.log('Secret version already exists with AWSPENDING stage');
        return;
    }

    // Get the current secret value
    const getCommand = new GetSecretValueCommand({
        SecretId: secretId,
        VersionStage: 'AWSCURRENT',
    });
    const currentSecret = await client.send(getCommand);

    if (!currentSecret.SecretString) {
        throw new Error('Current secret has no value');
    }

    // For OAuth secrets, we keep the same structure but mark for rotation
    const secretValue = JSON.parse(currentSecret.SecretString);
    secretValue._rotationRequired = true;
    secretValue._rotationDate = new Date().toISOString();

    // Create new version with AWSPENDING stage
    const putCommand = new PutSecretValueCommand({
        SecretId: secretId,
        ClientRequestToken: token,
        SecretString: JSON.stringify(secretValue),
        VersionStages: ['AWSPENDING'],
    });

    await client.send(putCommand);
    console.log('Created new secret version with AWSPENDING stage');
}

/**
 * Step 2: Set the secret value
 * 
 * This step is typically used to update the secret in the service
 * that uses it. For OAuth credentials, this is a no-op since the
 * credentials must be manually updated with the OAuth provider.
 */
async function setSecret(secretId: string, token: string): Promise<void> {
    console.log(`Setting secret for ${secretId}`);

    // For OAuth credentials, we don't need to do anything here
    // The credentials must be manually updated with the OAuth provider
    // and then manually updated in Secrets Manager

    // Log a warning that manual action is required
    console.warn(
        `MANUAL ACTION REQUIRED: OAuth credentials for ${secretId} need to be rotated. ` +
        `Please update the credentials with the OAuth provider and then update the secret in Secrets Manager.`
    );
}

/**
 * Step 3: Test the secret
 * 
 * Verify that the new secret works. For OAuth credentials, we check
 * that the secret has the required fields.
 */
async function testSecret(secretId: string, token: string): Promise<void> {
    console.log(`Testing secret for ${secretId}`);

    // Get the pending secret version
    const getCommand = new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: token,
        VersionStage: 'AWSPENDING',
    });

    const pendingSecret = await client.send(getCommand);

    if (!pendingSecret.SecretString) {
        throw new Error('Pending secret has no value');
    }

    const secretValue = JSON.parse(pendingSecret.SecretString);

    // Validate secret structure based on secret name
    if (secretId.includes('/oauth/google')) {
        validateGoogleOAuthSecret(secretValue);
    } else if (secretId.includes('/oauth/facebook')) {
        validateFacebookOAuthSecret(secretValue);
    } else if (secretId.includes('/oauth/instagram')) {
        validateInstagramOAuthSecret(secretValue);
    } else if (secretId.includes('/oauth/linkedin')) {
        validateLinkedInOAuthSecret(secretValue);
    } else if (secretId.includes('/oauth/twitter')) {
        validateTwitterOAuthSecret(secretValue);
    } else if (secretId.includes('/mls/api-credentials')) {
        validateMLSAPISecret(secretValue);
    } else {
        console.warn(`Unknown secret type for ${secretId}, skipping validation`);
    }

    console.log('Secret validation passed');
}

/**
 * Step 4: Finish the rotation
 * 
 * Move the AWSPENDING version to AWSCURRENT and remove AWSCURRENT from the old version
 */
async function finishSecret(secretId: string, token: string): Promise<void> {
    console.log(`Finishing secret rotation for ${secretId}`);

    // Get the current version
    const describeCommand = new DescribeSecretCommand({ SecretId: secretId });
    const metadata = await client.send(describeCommand);

    let currentVersion: string | undefined;
    if (metadata.VersionIdsToStages) {
        for (const [versionId, stages] of Object.entries(metadata.VersionIdsToStages)) {
            if (stages.includes('AWSCURRENT')) {
                currentVersion = versionId;
                break;
            }
        }
    }

    // Move AWSCURRENT stage to the new version
    const updateCurrentCommand = new UpdateSecretVersionStageCommand({
        SecretId: secretId,
        VersionStage: 'AWSCURRENT',
        MoveToVersionId: token,
        RemoveFromVersionId: currentVersion,
    });

    await client.send(updateCurrentCommand);
    console.log('Moved AWSCURRENT stage to new version');
}

// Validation functions for different secret types

function validateGoogleOAuthSecret(secret: any): void {
    if (!secret.clientId || !secret.clientSecret || !secret.redirectUri) {
        throw new Error('Google OAuth secret missing required fields: clientId, clientSecret, redirectUri');
    }
}

function validateFacebookOAuthSecret(secret: any): void {
    if (!secret.appId || !secret.appSecret || !secret.redirectUri) {
        throw new Error('Facebook OAuth secret missing required fields: appId, appSecret, redirectUri');
    }
}

function validateInstagramOAuthSecret(secret: any): void {
    if (!secret.appId || !secret.appSecret || !secret.redirectUri) {
        throw new Error('Instagram OAuth secret missing required fields: appId, appSecret, redirectUri');
    }
}

function validateLinkedInOAuthSecret(secret: any): void {
    if (!secret.clientId || !secret.clientSecret || !secret.redirectUri) {
        throw new Error('LinkedIn OAuth secret missing required fields: clientId, clientSecret, redirectUri');
    }
}

function validateTwitterOAuthSecret(secret: any): void {
    if (!secret.apiKey || !secret.apiSecret || !secret.bearerToken || !secret.redirectUri) {
        throw new Error('Twitter OAuth secret missing required fields: apiKey, apiSecret, bearerToken, redirectUri');
    }
}

function validateMLSAPISecret(secret: any): void {
    if (!secret.mlsgrid || !secret.bridgeInteractive) {
        throw new Error('MLS API secret missing required fields: mlsgrid, bridgeInteractive');
    }

    if (!secret.mlsgrid.apiKey || !secret.mlsgrid.apiSecret || !secret.mlsgrid.baseUrl) {
        throw new Error('MLS API secret mlsgrid missing required fields: apiKey, apiSecret, baseUrl');
    }

    if (!secret.bridgeInteractive.apiKey || !secret.bridgeInteractive.baseUrl) {
        throw new Error('MLS API secret bridgeInteractive missing required fields: apiKey, baseUrl');
    }
}
