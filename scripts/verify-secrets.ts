#!/usr/bin/env tsx
/**
 * Verify AWS Secrets Manager Setup
 * 
 * This script verifies that all OAuth credentials and API keys are properly
 * configured in AWS Secrets Manager.
 * 
 * Usage:
 *   npm run verify:secrets -- --environment development
 *   npm run verify:secrets -- --environment production
 */

import {
    SecretsManagerClient,
    ListSecretsCommand,
    GetSecretValueCommand,
    DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

interface SecretInfo {
    name: string;
    exists: boolean;
    hasValue: boolean;
    isValid: boolean;
    rotationEnabled: boolean;
    lastRotated?: string;
    nextRotation?: string;
    errors: string[];
}

async function main() {
    const args = process.argv.slice(2);
    const envIndex = args.indexOf('--environment');
    const environment = envIndex !== -1 ? args[envIndex + 1] : 'development';

    if (!['development', 'production'].includes(environment)) {
        console.error('Invalid environment. Must be "development" or "production"');
        process.exit(1);
    }

    console.log(`\n🔐 Verifying AWS Secrets Manager setup for ${environment} environment\n`);

    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new SecretsManagerClient({ region });

    const expectedSecrets = [
        'bayon-coagent/oauth/google',
        'bayon-coagent/oauth/facebook',
        'bayon-coagent/oauth/instagram',
        'bayon-coagent/oauth/linkedin',
        'bayon-coagent/oauth/twitter',
        'bayon-coagent/mls/api-credentials',
    ];

    const results: SecretInfo[] = [];

    for (const secretBase of expectedSecrets) {
        const secretName = `${secretBase}-${environment}`;
        const info = await verifySecret(client, secretName);
        results.push(info);
    }

    // Print results
    console.log('\n📊 Verification Results:\n');
    console.log('─'.repeat(80));

    let allValid = true;
    for (const result of results) {
        const status = result.isValid ? '✅' : '❌';
        console.log(`${status} ${result.name}`);

        if (!result.exists) {
            console.log('   ⚠️  Secret does not exist');
            allValid = false;
        } else {
            if (!result.hasValue) {
                console.log('   ⚠️  Secret has no value (empty)');
                allValid = false;
            }
            if (!result.isValid) {
                console.log('   ⚠️  Secret validation failed:');
                result.errors.forEach(err => console.log(`      - ${err}`));
                allValid = false;
            }
            if (result.rotationEnabled) {
                console.log(`   🔄 Rotation enabled`);
                if (result.lastRotated) {
                    console.log(`      Last rotated: ${result.lastRotated}`);
                }
                if (result.nextRotation) {
                    console.log(`      Next rotation: ${result.nextRotation}`);
                }
            } else {
                console.log('   ⚠️  Rotation not enabled');
            }
        }
        console.log('');
    }

    console.log('─'.repeat(80));

    if (allValid) {
        console.log('\n✅ All secrets are properly configured!\n');
        process.exit(0);
    } else {
        console.log('\n❌ Some secrets need attention. See details above.\n');
        console.log('To set up secrets, run: npm run setup:secrets -- --environment ' + environment);
        console.log('');
        process.exit(1);
    }
}

async function verifySecret(
    client: SecretsManagerClient,
    secretName: string
): Promise<SecretInfo> {
    const info: SecretInfo = {
        name: secretName,
        exists: false,
        hasValue: false,
        isValid: false,
        rotationEnabled: false,
        errors: [],
    };

    try {
        // Check if secret exists and get metadata
        const describeCommand = new DescribeSecretCommand({ SecretId: secretName });
        const metadata = await client.send(describeCommand);

        info.exists = true;
        info.rotationEnabled = metadata.RotationEnabled || false;

        if (metadata.LastRotatedDate) {
            info.lastRotated = metadata.LastRotatedDate.toISOString();
        }

        if (metadata.NextRotationDate) {
            info.nextRotation = metadata.NextRotationDate.toISOString();
        }

        // Get secret value
        const getCommand = new GetSecretValueCommand({ SecretId: secretName });
        const secretData = await client.send(getCommand);

        if (!secretData.SecretString) {
            info.errors.push('Secret has no value');
            return info;
        }

        info.hasValue = true;

        // Parse and validate secret
        let secretValue: any;
        try {
            secretValue = JSON.parse(secretData.SecretString);
        } catch (error) {
            info.errors.push('Secret is not valid JSON');
            return info;
        }

        // Validate based on secret type
        if (secretName.includes('/oauth/google')) {
            validateGoogleOAuth(secretValue, info);
        } else if (secretName.includes('/oauth/facebook')) {
            validateFacebookOAuth(secretValue, info);
        } else if (secretName.includes('/oauth/instagram')) {
            validateInstagramOAuth(secretValue, info);
        } else if (secretName.includes('/oauth/linkedin')) {
            validateLinkedInOAuth(secretValue, info);
        } else if (secretName.includes('/oauth/twitter')) {
            validateTwitterOAuth(secretValue, info);
        } else if (secretName.includes('/mls/api-credentials')) {
            validateMLSAPI(secretValue, info);
        }

        info.isValid = info.errors.length === 0;
    } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
            info.errors.push('Secret not found');
        } else {
            info.errors.push(`Error: ${error.message}`);
        }
    }

    return info;
}

function validateGoogleOAuth(secret: any, info: SecretInfo): void {
    if (!secret.clientId || secret.clientId === '') {
        info.errors.push('Missing or empty clientId');
    }
    if (!secret.clientSecret || secret.clientSecret === '') {
        info.errors.push('Missing or empty clientSecret');
    }
    if (!secret.redirectUri || secret.redirectUri === '') {
        info.errors.push('Missing or empty redirectUri');
    }
}

function validateFacebookOAuth(secret: any, info: SecretInfo): void {
    if (!secret.appId || secret.appId === '') {
        info.errors.push('Missing or empty appId');
    }
    if (!secret.appSecret || secret.appSecret === '') {
        info.errors.push('Missing or empty appSecret');
    }
    if (!secret.redirectUri || secret.redirectUri === '') {
        info.errors.push('Missing or empty redirectUri');
    }
}

function validateInstagramOAuth(secret: any, info: SecretInfo): void {
    if (!secret.appId || secret.appId === '') {
        info.errors.push('Missing or empty appId');
    }
    if (!secret.appSecret || secret.appSecret === '') {
        info.errors.push('Missing or empty appSecret');
    }
    if (!secret.redirectUri || secret.redirectUri === '') {
        info.errors.push('Missing or empty redirectUri');
    }
}

function validateLinkedInOAuth(secret: any, info: SecretInfo): void {
    if (!secret.clientId || secret.clientId === '') {
        info.errors.push('Missing or empty clientId');
    }
    if (!secret.clientSecret || secret.clientSecret === '') {
        info.errors.push('Missing or empty clientSecret');
    }
    if (!secret.redirectUri || secret.redirectUri === '') {
        info.errors.push('Missing or empty redirectUri');
    }
}

function validateTwitterOAuth(secret: any, info: SecretInfo): void {
    if (!secret.apiKey || secret.apiKey === '') {
        info.errors.push('Missing or empty apiKey');
    }
    if (!secret.apiSecret || secret.apiSecret === '') {
        info.errors.push('Missing or empty apiSecret');
    }
    if (!secret.bearerToken || secret.bearerToken === '') {
        info.errors.push('Missing or empty bearerToken');
    }
    if (!secret.redirectUri || secret.redirectUri === '') {
        info.errors.push('Missing or empty redirectUri');
    }
}

function validateMLSAPI(secret: any, info: SecretInfo): void {
    if (!secret.mlsgrid) {
        info.errors.push('Missing mlsgrid configuration');
    } else {
        if (!secret.mlsgrid.apiKey || secret.mlsgrid.apiKey === '') {
            info.errors.push('Missing or empty mlsgrid.apiKey');
        }
        if (!secret.mlsgrid.apiSecret || secret.mlsgrid.apiSecret === '') {
            info.errors.push('Missing or empty mlsgrid.apiSecret');
        }
        if (!secret.mlsgrid.baseUrl || secret.mlsgrid.baseUrl === '') {
            info.errors.push('Missing or empty mlsgrid.baseUrl');
        }
    }

    if (!secret.bridgeInteractive) {
        info.errors.push('Missing bridgeInteractive configuration');
    } else {
        if (!secret.bridgeInteractive.apiKey || secret.bridgeInteractive.apiKey === '') {
            info.errors.push('Missing or empty bridgeInteractive.apiKey');
        }
        if (!secret.bridgeInteractive.baseUrl || secret.bridgeInteractive.baseUrl === '') {
            info.errors.push('Missing or empty bridgeInteractive.baseUrl');
        }
    }
}

// Run the script
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
