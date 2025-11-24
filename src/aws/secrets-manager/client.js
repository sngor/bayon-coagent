"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = getSecret;
exports.clearSecretCache = clearSecretCache;
exports.clearSecret = clearSecret;
exports.getGoogleOAuthCredentials = getGoogleOAuthCredentials;
exports.getFacebookOAuthCredentials = getFacebookOAuthCredentials;
exports.getInstagramOAuthCredentials = getInstagramOAuthCredentials;
exports.getLinkedInOAuthCredentials = getLinkedInOAuthCredentials;
exports.getTwitterOAuthCredentials = getTwitterOAuthCredentials;
exports.getMLSAPICredentials = getMLSAPICredentials;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const client = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const secretCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
async function getSecret(secretName, useCache = true) {
    if (useCache) {
        const cached = secretCache.get(secretName);
        if (cached && cached.expiresAt > Date.now()) {
            console.log(`Using cached secret: ${secretName}`);
            return cached.value;
        }
    }
    console.log(`Fetching secret from Secrets Manager: ${secretName}`);
    try {
        const command = new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secretName,
        });
        const response = await client.send(command);
        if (!response.SecretString) {
            throw new Error(`Secret ${secretName} has no value`);
        }
        const secretValue = JSON.parse(response.SecretString);
        secretCache.set(secretName, {
            value: secretValue,
            expiresAt: Date.now() + CACHE_TTL,
        });
        return secretValue;
    }
    catch (error) {
        console.error(`Failed to get secret ${secretName}:`, error);
        throw error;
    }
}
function clearSecretCache() {
    secretCache.clear();
    console.log('Secret cache cleared');
}
function clearSecret(secretName) {
    secretCache.delete(secretName);
    console.log(`Cleared secret from cache: ${secretName}`);
}
async function getGoogleOAuthCredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/oauth/google-${environment}`;
    return getSecret(secretName);
}
async function getFacebookOAuthCredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/oauth/facebook-${environment}`;
    return getSecret(secretName);
}
async function getInstagramOAuthCredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/oauth/instagram-${environment}`;
    return getSecret(secretName);
}
async function getLinkedInOAuthCredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/oauth/linkedin-${environment}`;
    return getSecret(secretName);
}
async function getTwitterOAuthCredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/oauth/twitter-${environment}`;
    return getSecret(secretName);
}
async function getMLSAPICredentials(environment = process.env.NODE_ENV || 'development') {
    const secretName = `bayon-coagent/mls/api-credentials-${environment}`;
    return getSecret(secretName);
}
