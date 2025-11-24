#!/usr/bin/env tsx
/**
 * Setup AWS Secrets Manager Secrets
 * 
 * This script helps populate OAuth credentials and API keys in AWS Secrets Manager.
 * Run this script after deploying the SAM template to set up your credentials.
 * 
 * Usage:
 *   npm run setup:secrets -- --environment development
 *   npm run setup:secrets -- --environment production
 * 
 * Requirements: 6.4 - Secure credential management
 */

import {
    SecretsManagerClient,
    PutSecretValueCommand,
    GetSecretValueCommand,
    ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const envIndex = args.indexOf('--environment');
    const environment = envIndex !== -1 ? args[envIndex + 1] : 'development';

    if (!['development', 'production'].includes(environment)) {
        console.error('Invalid environment. Must be "development" or "production"');
        process.exit(1);
    }

    console.log(`\n🔐 Setting up AWS Secrets Manager secrets for ${environment} environment\n`);

    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new SecretsManagerClient({ region });

    // List all secrets to verify they exist
    console.log('Checking existing secrets...\n');
    const listCommand = new ListSecretsCommand({});
    const secrets = await client.send(listCommand);

    const secretPrefix = `bayon-coagent/`;
    const existingSecrets = secrets.SecretList?.filter(s =>
        s.Name?.startsWith(secretPrefix) && s.Name?.endsWith(`-${environment}`)
    ) || [];

    if (existingSecrets.length === 0) {
        console.error(`No secrets found for environment: ${environment}`);
        console.error('Please deploy the SAM template first: npm run sam:deploy:dev');
        process.exit(1);
    }

    console.log('Found secrets:');
    existingSecrets.forEach(s => console.log(`  - ${s.Name}`));
    console.log('');

    const setupChoice = await question('Do you want to set up all secrets now? (y/n): ');
    if (setupChoice.toLowerCase() !== 'y') {
        console.log('Setup cancelled');
        rl.close();
        return;
    }

    // Setup Google OAuth
    await setupGoogleOAuth(client, environment);

    // Setup Facebook OAuth
    await setupFacebookOAuth(client, environment);

    // Setup Instagram OAuth
    await setupInstagramOAuth(client, environment);

    // Setup LinkedIn OAuth
    await setupLinkedInOAuth(client, environment);

    // Setup Twitter OAuth
    await setupTwitterOAuth(client, environment);

    // Setup MLS API
    await setupMLSAPI(client, environment);

    console.log('\n✅ All secrets have been set up successfully!\n');
    console.log('You can now use these credentials in your application.');
    console.log('To update a secret later, run this script again or use the AWS Console.\n');

    rl.close();
}

async function setupGoogleOAuth(client: SecretsManagerClient, environment: string) {
    console.log('\n--- Google OAuth Credentials ---');
    console.log('Get these from: https://console.cloud.google.com/apis/credentials\n');

    const clientId = await question('Google Client ID: ');
    const clientSecret = await question('Google Client Secret: ');
    const redirectUri = environment === 'production'
        ? await question('Production Redirect URI (e.g., https://yourdomain.com/api/oauth/google/callback): ')
        : 'http://localhost:3000/api/oauth/google/callback';

    if (!clientId || !clientSecret) {
        console.log('Skipping Google OAuth (missing credentials)');
        return;
    }

    const secretValue = {
        clientId,
        clientSecret,
        redirectUri,
    };

    await updateSecret(
        client,
        `bayon-coagent/oauth/google-${environment}`,
        secretValue
    );

    console.log('✓ Google OAuth credentials saved');
}

async function setupFacebookOAuth(client: SecretsManagerClient, environment: string) {
    console.log('\n--- Facebook OAuth Credentials ---');
    console.log('Get these from: https://developers.facebook.com/apps\n');

    const appId = await question('Facebook App ID: ');
    const appSecret = await question('Facebook App Secret: ');
    const redirectUri = environment === 'production'
        ? await question('Production Redirect URI (e.g., https://yourdomain.com/api/oauth/facebook/callback): ')
        : 'http://localhost:3000/api/oauth/facebook/callback';

    if (!appId || !appSecret) {
        console.log('Skipping Facebook OAuth (missing credentials)');
        return;
    }

    const secretValue = {
        appId,
        appSecret,
        redirectUri,
    };

    await updateSecret(
        client,
        `bayon-coagent/oauth/facebook-${environment}`,
        secretValue
    );

    console.log('✓ Facebook OAuth credentials saved');
}

async function setupInstagramOAuth(client: SecretsManagerClient, environment: string) {
    console.log('\n--- Instagram OAuth Credentials ---');
    console.log('Get these from: https://developers.facebook.com/apps (Instagram Basic Display)\n');

    const appId = await question('Instagram App ID: ');
    const appSecret = await question('Instagram App Secret: ');
    const redirectUri = environment === 'production'
        ? await question('Production Redirect URI (e.g., https://yourdomain.com/api/oauth/instagram/callback): ')
        : 'http://localhost:3000/api/oauth/instagram/callback';

    if (!appId || !appSecret) {
        console.log('Skipping Instagram OAuth (missing credentials)');
        return;
    }

    const secretValue = {
        appId,
        appSecret,
        redirectUri,
    };

    await updateSecret(
        client,
        `bayon-coagent/oauth/instagram-${environment}`,
        secretValue
    );

    console.log('✓ Instagram OAuth credentials saved');
}

async function setupLinkedInOAuth(client: SecretsManagerClient, environment: string) {
    console.log('\n--- LinkedIn OAuth Credentials ---');
    console.log('Get these from: https://www.linkedin.com/developers/apps\n');

    const clientId = await question('LinkedIn Client ID: ');
    const clientSecret = await question('LinkedIn Client Secret: ');
    const redirectUri = environment === 'production'
        ? await question('Production Redirect URI (e.g., https://yourdomain.com/api/oauth/linkedin/callback): ')
        : 'http://localhost:3000/api/oauth/linkedin/callback';

    if (!clientId || !clientSecret) {
        console.log('Skipping LinkedIn OAuth (missing credentials)');
        return;
    }

    const secretValue = {
        clientId,
        clientSecret,
        redirectUri,
    };

    await updateSecret(
        client,
        `bayon-coagent/oauth/linkedin-${environment}`,
        secretValue
    );

    console.log('✓ LinkedIn OAuth credentials saved');
}

async function setupTwitterOAuth(client: SecretsManagerClient, environment: string) {
    console.log('\n--- Twitter OAuth Credentials ---');
    console.log('Get these from: https://developer.twitter.com/en/portal/dashboard\n');

    const apiKey = await question('Twitter API Key: ');
    const apiSecret = await question('Twitter API Secret: ');
    const bearerToken = await question('Twitter Bearer Token: ');
    const redirectUri = environment === 'production'
        ? await question('Production Redirect URI (e.g., https://yourdomain.com/api/oauth/twitter/callback): ')
        : 'http://localhost:3000/api/oauth/twitter/callback';

    if (!apiKey || !apiSecret || !bearerToken) {
        console.log('Skipping Twitter OAuth (missing credentials)');
        return;
    }

    const secretValue = {
        apiKey,
        apiSecret,
        bearerToken,
        redirectUri,
    };

    await updateSecret(
        client,
        `bayon-coagent/oauth/twitter-${environment}`,
        secretValue
    );

    console.log('✓ Twitter OAuth credentials saved');
}

async function setupMLSAPI(client: SecretsManagerClient, environment: string) {
    console.log('\n--- MLS API Credentials ---');
    console.log('Get these from your MLS provider\n');

    const mlsgridApiKey = await question('MLSGrid API Key: ');
    const mlsgridApiSecret = await question('MLSGrid API Secret: ');
    const mlsgridBaseUrl = await question('MLSGrid Base URL (default: https://api.mlsgrid.com/v2): ') || 'https://api.mlsgrid.com/v2';

    const bridgeApiKey = await question('Bridge Interactive API Key: ');
    const bridgeBaseUrl = await question('Bridge Interactive Base URL (default: https://api.bridgeinteractive.com/v2): ') || 'https://api.bridgeinteractive.com/v2';

    if (!mlsgridApiKey || !mlsgridApiSecret || !bridgeApiKey) {
        console.log('Skipping MLS API (missing credentials)');
        return;
    }

    const secretValue = {
        mlsgrid: {
            apiKey: mlsgridApiKey,
            apiSecret: mlsgridApiSecret,
            baseUrl: mlsgridBaseUrl,
        },
        bridgeInteractive: {
            apiKey: bridgeApiKey,
            baseUrl: bridgeBaseUrl,
        },
    };

    await updateSecret(
        client,
        `bayon-coagent/mls/api-credentials-${environment}`,
        secretValue
    );

    console.log('✓ MLS API credentials saved');
}

async function updateSecret(
    client: SecretsManagerClient,
    secretName: string,
    secretValue: any
): Promise<void> {
    try {
        const command = new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify(secretValue, null, 2),
        });

        await client.send(command);
    } catch (error) {
        console.error(`Failed to update secret ${secretName}:`, error);
        throw error;
    }
}

// Run the script
main().catch((error) => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
});
