/**
 * Client Authentication Service
 * 
 * This module provides authentication functionality specifically for client portal users.
 * It uses a separate Cognito user pool from the main agent authentication system.
 * 
 * Key features:
 * - Invitation-based account creation
 * - Password complexity validation
 * - 24-hour session expiration
 * - Token-based invitation system with 7-day expiration
 */

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    GlobalSignOutCommand,
    GetUserCommand,
    AuthFlowType,
    InitiateAuthCommandOutput,
    GetUserCommandOutput,
    AdminSetUserPasswordCommand,
    AdminCreateUserCommand,
    AdminGetUserCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getConfig, getAWSCredentials } from '../config';
import { randomBytes } from 'crypto';

/**
 * Client user information
 */
export interface ClientUser {
    id: string;
    email: string;
    emailVerified: boolean;
    agentId: string;
    attributes: Record<string, string>;
}

/**
 * Client authentication session
 * Sessions expire after 24 hours as per requirements
 */
export interface ClientAuthSession {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresAt: number; // Timestamp when session expires (24 hours from creation)
    clientId: string;
    agentId: string;
}

/**
 * Invitation token for client account setup
 * Tokens expire after 7 days as per requirements
 */
export interface ClientInvitation {
    token: string;
    clientId: string;
    email: string;
    agentId: string;
    expiresAt: number; // Timestamp when invitation expires (7 days from creation)
    createdAt: number;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Password complexity requirements as per Requirement 2.2:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Generate a secure invitation token
 * Returns a URL-safe random token
 */
export function generateInvitationToken(): string {
    // Generate 32 bytes of random data and convert to URL-safe base64
    return randomBytes(32).toString('base64url');
}

/**
 * Create a client invitation with 7-day expiration
 * As per Requirement 2.1: invitation tokens expire after 7 days
 */
export function createClientInvitation(
    clientId: string,
    email: string,
    agentId: string
): ClientInvitation {
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    return {
        token: generateInvitationToken(),
        clientId,
        email,
        agentId,
        expiresAt: now + sevenDaysInMs,
        createdAt: now,
    };
}

/**
 * Validate an invitation token
 * Returns true if token is not expired
 */
export function isInvitationValid(invitation: ClientInvitation): boolean {
    return Date.now() < invitation.expiresAt;
}

/**
 * Client Authentication Client
 * Handles all authentication operations for client portal users
 */
export class ClientAuthClient {
    private client: CognitoIdentityProviderClient;
    private clientUserPoolId: string;
    private clientAppClientId: string;

    constructor() {
        const config = getConfig();
        const credentials = getAWSCredentials();

        // Use separate client Cognito configuration
        // Falls back to agent Cognito if client-specific config is not set
        this.clientUserPoolId = config.clientCognito.userPoolId;
        this.clientAppClientId = config.clientCognito.clientId;

        console.log('Client Cognito Config:', {
            region: config.region,
            endpoint: config.clientCognito.endpoint,
            userPoolId: this.clientUserPoolId,
            clientId: this.clientAppClientId,
        });

        this.client = new CognitoIdentityProviderClient({
            region: config.region,
            endpoint: config.clientCognito.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });
    }

    /**
     * Create a client account in Cognito
     * This is called by agents when they create a new client
     * The client will receive an invitation to set their password
     */
    async createClientAccount(
        email: string,
        agentId: string,
        clientId: string
    ): Promise<void> {
        try {
            const command = new AdminCreateUserCommand({
                UserPoolId: this.clientUserPoolId,
                Username: email,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email,
                    },
                    {
                        Name: 'email_verified',
                        Value: 'true', // Auto-verify email since agent is creating the account
                    },
                    {
                        Name: 'custom:agentId',
                        Value: agentId,
                    },
                    {
                        Name: 'custom:clientId',
                        Value: clientId,
                    },
                ],
                MessageAction: 'SUPPRESS', // Don't send Cognito's default email, we'll send our own invitation
                DesiredDeliveryMediums: ['EMAIL'],
            });

            await this.client.send(command);
        } catch (error) {
            throw this.handleError(error, 'Failed to create client account');
        }
    }

    /**
     * Set client password
     * Called when client accepts invitation and sets their password
     * Validates password complexity before setting
     */
    async setClientPassword(
        email: string,
        password: string
    ): Promise<void> {
        // Validate password complexity
        const validation = validatePasswordComplexity(password);
        if (!validation.valid) {
            throw new Error(`Password does not meet complexity requirements: ${validation.errors.join(', ')}`);
        }

        try {
            const command = new AdminSetUserPasswordCommand({
                UserPoolId: this.clientUserPoolId,
                Username: email,
                Password: password,
                Permanent: true, // Make the password permanent (not temporary)
            });

            await this.client.send(command);
        } catch (error) {
            throw this.handleError(error, 'Failed to set client password');
        }
    }

    /**
     * Sign in a client with email and password
     * Returns a session with 24-hour expiration as per Requirement 2.3
     */
    async signIn(email: string, password: string): Promise<ClientAuthSession> {
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                ClientId: this.clientAppClientId,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });

            const response: InitiateAuthCommandOutput = await this.client.send(command);

            if (!response.AuthenticationResult) {
                throw new Error('Authentication failed: No authentication result');
            }

            const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;

            if (!AccessToken || !IdToken || !RefreshToken) {
                throw new Error('Authentication failed: Missing tokens');
            }

            // Get user details to extract agentId and clientId
            const user = await this.getCurrentUser(AccessToken);

            // Calculate expiration time (24 hours from now as per requirements)
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
            const expiresAt = Date.now() + twentyFourHoursInMs;

            const session: ClientAuthSession = {
                accessToken: AccessToken,
                idToken: IdToken,
                refreshToken: RefreshToken,
                expiresAt,
                clientId: user.id,
                agentId: user.agentId,
            };

            // Store the session
            this.storeSession(session);

            return session;
        } catch (error) {
            throw this.handleError(error, 'Failed to sign in');
        }
    }

    /**
     * Sign out the current client (global sign out)
     */
    async signOut(accessToken: string): Promise<void> {
        try {
            const command = new GlobalSignOutCommand({
                AccessToken: accessToken,
            });

            await this.client.send(command);

            // Clear the stored session
            this.clearSession();
        } catch (error) {
            // Even if sign out fails on the server, clear local session
            this.clearSession();
            throw this.handleError(error, 'Failed to sign out');
        }
    }

    /**
     * Get the current authenticated client's information
     */
    async getCurrentUser(accessToken: string): Promise<ClientUser> {
        try {
            const command = new GetUserCommand({
                AccessToken: accessToken,
            });

            const response: GetUserCommandOutput = await this.client.send(command);

            const attributes: Record<string, string> = {};
            let email = '';
            let emailVerified = false;
            let agentId = '';

            if (response.UserAttributes) {
                for (const attr of response.UserAttributes) {
                    if (attr.Name && attr.Value) {
                        attributes[attr.Name] = attr.Value;

                        if (attr.Name === 'email') {
                            email = attr.Value;
                        }
                        if (attr.Name === 'email_verified') {
                            emailVerified = attr.Value === 'true';
                        }
                        if (attr.Name === 'custom:agentId') {
                            agentId = attr.Value;
                        }
                    }
                }
            }

            return {
                id: response.Username || '',
                email,
                emailVerified,
                agentId,
                attributes,
            };
        } catch (error) {
            throw this.handleError(error, 'Failed to get current user');
        }
    }

    /**
     * Refresh the access token using a refresh token
     * Maintains 24-hour session expiration
     */
    async refreshSession(refreshToken: string): Promise<ClientAuthSession> {
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
                ClientId: this.clientAppClientId,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });

            const response: InitiateAuthCommandOutput = await this.client.send(command);

            if (!response.AuthenticationResult) {
                throw new Error('Token refresh failed: No authentication result');
            }

            const { AccessToken, IdToken, RefreshToken: NewRefreshToken } = response.AuthenticationResult;

            if (!AccessToken || !IdToken) {
                throw new Error('Token refresh failed: Missing tokens');
            }

            // Get user details
            const user = await this.getCurrentUser(AccessToken);

            // Calculate new expiration time (24 hours from now)
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
            const expiresAt = Date.now() + twentyFourHoursInMs;

            const session: ClientAuthSession = {
                accessToken: AccessToken,
                idToken: IdToken,
                refreshToken: NewRefreshToken || refreshToken,
                expiresAt,
                clientId: user.id,
                agentId: user.agentId,
            };

            this.storeSession(session);

            return session;
        } catch (error) {
            throw this.handleError(error, 'Failed to refresh session');
        }
    }

    /**
     * Get the current session from storage
     * Automatically refreshes if session is expired or about to expire
     */
    async getSession(): Promise<ClientAuthSession | null> {
        try {
            const sessionData = this.getStoredSession();

            if (!sessionData) {
                return null;
            }

            // Validate session data structure
            if (!sessionData.accessToken || !sessionData.refreshToken || !sessionData.expiresAt) {
                console.warn('Invalid session data structure, clearing session');
                this.clearSession();
                return null;
            }

            // Check if session is expired
            const now = Date.now();

            if (sessionData.expiresAt <= now) {
                // Session is expired, try to refresh
                try {
                    const newSession = await this.refreshSession(sessionData.refreshToken);
                    return newSession;
                } catch (error) {
                    console.warn('Session refresh failed, clearing session:', error);
                    this.clearSession();
                    return null;
                }
            }

            // Session is still valid
            return sessionData;
        } catch (error) {
            console.error('Failed to get session:', error);
            this.clearSession();
            return null;
        }
    }

    /**
     * Deactivate a client account
     * As per Requirement 1.3: prevents future logins
     */
    async deactivateClient(email: string): Promise<void> {
        try {
            const command = new AdminDisableUserCommand({
                UserPoolId: this.clientUserPoolId,
                Username: email,
            });

            await this.client.send(command);
        } catch (error) {
            throw this.handleError(error, 'Failed to deactivate client');
        }
    }

    /**
     * Reactivate a client account
     */
    async reactivateClient(email: string): Promise<void> {
        try {
            const command = new AdminEnableUserCommand({
                UserPoolId: this.clientUserPoolId,
                Username: email,
            });

            await this.client.send(command);
        } catch (error) {
            throw this.handleError(error, 'Failed to reactivate client');
        }
    }

    /**
     * Get client information by email (admin operation)
     */
    async getClientByEmail(email: string): Promise<ClientUser | null> {
        try {
            const command = new AdminGetUserCommand({
                UserPoolId: this.clientUserPoolId,
                Username: email,
            });

            const response = await this.client.send(command);

            const attributes: Record<string, string> = {};
            let userEmail = '';
            let emailVerified = false;
            let agentId = '';

            if (response.UserAttributes) {
                for (const attr of response.UserAttributes) {
                    if (attr.Name && attr.Value) {
                        attributes[attr.Name] = attr.Value;

                        if (attr.Name === 'email') {
                            userEmail = attr.Value;
                        }
                        if (attr.Name === 'email_verified') {
                            emailVerified = attr.Value === 'true';
                        }
                        if (attr.Name === 'custom:agentId') {
                            agentId = attr.Value;
                        }
                    }
                }
            }

            return {
                id: response.Username || '',
                email: userEmail,
                emailVerified,
                agentId,
                attributes,
            };
        } catch (error) {
            if (error instanceof Error && error.message.includes('UserNotFoundException')) {
                return null;
            }
            throw this.handleError(error, 'Failed to get client');
        }
    }

    /**
     * Store session in localStorage
     */
    private storeSession(session: ClientAuthSession): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('client_portal_session', JSON.stringify(session));
        }
    }

    /**
     * Get stored session from localStorage
     */
    private getStoredSession(): ClientAuthSession | null {
        if (typeof window === 'undefined') {
            return null;
        }

        const sessionStr = localStorage.getItem('client_portal_session');
        if (!sessionStr) {
            return null;
        }

        try {
            return JSON.parse(sessionStr) as ClientAuthSession;
        } catch (error) {
            console.error('Failed to parse stored session:', error);
            return null;
        }
    }

    /**
     * Clear session from localStorage
     */
    private clearSession(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('client_portal_session');
        }
    }

    /**
     * Handle and format errors
     */
    private handleError(error: unknown, defaultMessage: string): Error {
        if (error instanceof Error) {
            const message = error.message;

            // Token-related errors
            if (message.includes('Access Token has expired') || message.includes('Token expired')) {
                return new Error('Your session has expired. Please sign in again.');
            }
            if (message.includes('Invalid Access Token') || message.includes('Invalid token')) {
                return new Error('Your session is invalid. Please sign in again.');
            }
            if (message.includes('NotAuthorizedException') && message.includes('Refresh Token')) {
                return new Error('Your session has expired. Please sign in again.');
            }

            // User-related errors
            if (message.includes('UserNotFoundException')) {
                return new Error('No account found with this email.');
            }
            if (message.includes('NotAuthorizedException')) {
                return new Error('Incorrect email or password. Please try again.');
            }
            if (message.includes('UserNotConfirmedException')) {
                return new Error('Your account is not yet set up. Please use your invitation link.');
            }
            if (message.includes('InvalidPasswordException')) {
                return new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
            }
            if (message.includes('TooManyRequestsException')) {
                return new Error('Too many attempts. Please wait a few minutes and try again.');
            }
            if (message.includes('LimitExceededException')) {
                return new Error('Attempt limit exceeded. Please try again later.');
            }

            return new Error(`${defaultMessage}: ${message}`);
        }

        return new Error(defaultMessage);
    }
}

// Export a singleton instance
let clientAuthClient: ClientAuthClient | null = null;

/**
 * Get the singleton Client Auth client instance
 */
export function getClientAuthClient(): ClientAuthClient {
    if (!clientAuthClient) {
        clientAuthClient = new ClientAuthClient();
    }
    return clientAuthClient;
}

/**
 * Reset the Client Auth client (useful for testing)
 */
export function resetClientAuthClient(): void {
    clientAuthClient = null;
}
