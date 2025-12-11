/**
 * AWS Cognito Client Module
 * 
 * This module provides authentication functionality using AWS Cognito.
 * It handles user registration, sign-in, sign-out, session management,
 * and token refresh operations.
 */

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  AuthFlowType,
  SignUpCommandOutput,
  InitiateAuthCommandOutput,
  GetUserCommandOutput,
  AdminGetUserCommandOutput,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { getConfig, getAWSCredentials } from '../config';
import { UserRole } from '../dynamodb/admin-types';

export interface CognitoUser {
  id: string;
  email: string;
  emailVerified: boolean;
  attributes: Record<string, string>;
}

export interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpResult {
  userSub: string;
  userConfirmed: boolean;
}

/**
 * Cognito Authentication Client
 */
export class CognitoAuthClient {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private userPoolId: string;

  constructor() {
    const config = getConfig();
    const credentials = getAWSCredentials();

    console.log('Environment Variables:', {
      AWS_REGION: process.env.AWS_REGION,
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      USE_LOCAL_AWS: process.env.USE_LOCAL_AWS,
      NODE_ENV: process.env.NODE_ENV,
    });

    console.log('Cognito Config:', {
      region: config.region,
      endpoint: config.cognito.endpoint,
      clientId: config.cognito.clientId,
      userPoolId: config.cognito.userPoolId,
      environment: config.environment,
    });

    this.client = new CognitoIdentityProviderClient({
      region: String(config.region), // Ensure region is a string
      endpoint: config.cognito.endpoint,
      credentials: credentials.accessKeyId && credentials.secretAccessKey
        ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
        : undefined,
    });

    this.clientId = config.cognito.clientId;
    this.userPoolId = config.cognito.userPoolId;
  }

  /**
   * Register a new user with email and password
   */
  async signUp(
    email: string,
    password: string,
    givenName?: string,
    familyName?: string
  ): Promise<SignUpResult> {
    try {
      const userAttributes = [
        {
          Name: 'email',
          Value: email,
        },
      ];

      // Add name attributes if provided
      if (givenName) {
        userAttributes.push({
          Name: 'given_name',
          Value: givenName,
        });
      }
      if (familyName) {
        userAttributes.push({
          Name: 'family_name',
          Value: familyName,
        });
      }

      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: userAttributes,
      });

      const response: SignUpCommandOutput = await this.client.send(command);

      return {
        userSub: response.UserSub || '',
        userConfirmed: response.UserConfirmed || false,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to sign up');
    }
  }

  /**
   * Confirm user sign up with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      });

      await this.client.send(command);
    } catch (error) {
      throw this.handleError(error, 'Failed to confirm sign up');
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.client.send(command);
    } catch (error) {
      throw this.handleError(error, 'Failed to resend confirmation code');
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      const resolvedRegion = typeof this.client.config.region === 'function'
        ? await this.client.config.region()
        : this.client.config.region;

      console.log('SignIn attempt with:', {
        clientId: this.clientId,
        userPoolId: this.userPoolId,
        email: email,
        region: resolvedRegion,
      });

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
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

      const session = {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        expiresAt: Date.now() + (ExpiresIn || 3600) * 1000,
      };

      // Store the session
      this.storeSession(session);

      return session;
    } catch (error) {
      throw this.handleError(error, 'Failed to sign in');
    }
  }

  /**
   * Sign out the current user (global sign out)
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
   * Get the current authenticated user's information
   */
  async getCurrentUser(accessToken: string): Promise<CognitoUser> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response: GetUserCommandOutput = await this.client.send(command);

      const attributes: Record<string, string> = {};
      let email = '';
      let emailVerified = false;

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
          }
        }
      }

      return {
        id: response.Username || '',
        email,
        emailVerified,
        attributes,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get current user');
    }
  }

  /**
   * Refresh the access token using a refresh token
   */
  async refreshSession(refreshToken: string): Promise<AuthSession> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response: InitiateAuthCommandOutput = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed: No authentication result');
      }

      const { AccessToken, IdToken, RefreshToken: NewRefreshToken, ExpiresIn } = response.AuthenticationResult;

      if (!AccessToken || !IdToken) {
        throw new Error('Token refresh failed: Missing tokens');
      }

      return {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: NewRefreshToken || refreshToken, // Use new refresh token if available, else keep old one
        expiresAt: Date.now() + (ExpiresIn || 3600) * 1000,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to refresh session');
    }
  }

  /**
   * Get the current session from storage
   */
  async getSession(): Promise<AuthSession | null> {
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

      // Check if token is expired or about to expire (within 5 minutes)
      const now = Date.now();
      const expirationBuffer = 5 * 60 * 1000; // 5 minutes

      if (sessionData.expiresAt - now < expirationBuffer) {
        // Token is expired or about to expire, refresh it
        try {
          const newSession = await this.refreshSession(sessionData.refreshToken);
          this.storeSession(newSession);
          return newSession;
        } catch (error) {
          console.warn('Token refresh failed, clearing session:', error);
          // Refresh failed, clear session
          this.clearSession();
          return null;
        }
      }

      // Validate the token is still valid by attempting to get user
      try {
        await this.getCurrentUser(sessionData.accessToken);
        return sessionData;
      } catch (error) {
        console.warn('Access token validation failed, attempting refresh:', error);
        // Token is invalid, try to refresh
        try {
          const newSession = await this.refreshSession(sessionData.refreshToken);
          this.storeSession(newSession);
          return newSession;
        } catch (refreshError) {
          console.warn('Token refresh failed after validation error, clearing session:', refreshError);
          this.clearSession();
          return null;
        }
      }
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognito_session', JSON.stringify(session));
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionStr = localStorage.getItem('cognito_session');
    if (!sessionStr) {
      return null;
    }

    try {
      return JSON.parse(sessionStr) as AuthSession;
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
      localStorage.removeItem('cognito_session');
    }
  }

  /**
   * Updates a user's custom role attribute (Admin operation)
   * Requires admin credentials
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        UserAttributes: [
          {
            Name: 'custom:role',
            Value: role,
          },
        ],
      });

      await this.client.send(command);
    } catch (error) {
      throw this.handleError(error, 'Failed to update user role');
    }
  }

  /**
   * Gets a user's role from Cognito attributes (Admin operation)
   * Requires admin credentials
   */
  async getUserRole(userId: string): Promise<UserRole> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
      });

      const response: AdminGetUserCommandOutput = await this.client.send(command);

      if (!response.UserAttributes) {
        return 'user'; // Default role
      }

      const roleAttr = response.UserAttributes.find(
        (attr) => attr.Name === 'custom:role'
      );

      if (!roleAttr || !roleAttr.Value) {
        return 'user'; // Default role
      }

      // Validate the role value
      const role = roleAttr.Value as UserRole;
      if (role !== 'user' && role !== 'admin' && role !== 'superadmin') {
        return 'user'; // Default to user if invalid
      }

      return role;
    } catch (error) {
      throw this.handleError(error, 'Failed to get user role');
    }
  }

  /**
   * Admin operation: Update user attributes
   * Requires admin credentials
   */
  async adminUpdateUserAttributes(
    userId: string,
    attributes: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        UserAttributes: attributes as AttributeType[],
      });

      await this.client.send(command);
    } catch (error) {
      throw this.handleError(error, 'Failed to update user attributes');
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      // Map common Cognito errors to user-friendly messages
      const message = error.message;

      // Token-related errors (most common in server actions)
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
        return new Error('No account found with this email. Please sign up first.');
      }
      if (message.includes('NotAuthorizedException')) {
        return new Error('Incorrect email or password. Please try again.');
      }
      if (message.includes('UserNotConfirmedException')) {
        return new Error('Please verify your email with the confirmation code sent to your inbox before signing in.');
      }
      if (message.includes('UsernameExistsException')) {
        return new Error('An account with this email already exists. Please sign in instead.');
      }
      if (message.includes('InvalidPasswordException')) {
        return new Error('Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.');
      }
      if (message.includes('TooManyRequestsException')) {
        return new Error('Too many attempts. Please wait a few minutes and try again.');
      }
      if (message.includes('CodeMismatchException')) {
        return new Error('Invalid verification code. Please check and try again.');
      }
      if (message.includes('ExpiredCodeException')) {
        return new Error('Verification code has expired. Please request a new one.');
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
let cognitoClient: CognitoAuthClient | null = null;

/**
 * Get the singleton Cognito client instance
 */
export function getCognitoClient(): CognitoAuthClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoAuthClient();
  }
  return cognitoClient;
}

/**
 * Reset the Cognito client (useful for testing)
 */
export function resetCognitoClient(): void {
  cognitoClient = null;
}

/**
 * Get the current authenticated user
 * 
 * This function attempts to get the current user from the session stored in localStorage.
 * Note: This only works in client-side contexts. Server actions should pass userId explicitly.
 * 
 * @param userId - Optional user ID to return directly (for server-side use)
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser(userId?: string): Promise<CognitoUser | null> {
  // If userId is provided (server-side), return a minimal user object
  if (userId) {
    return {
      id: userId,
      email: '', // Email not available in server context
      emailVerified: true,
      attributes: {},
    };
  }

  // Client-side: get from session
  try {
    const client = getCognitoClient();
    const session = await client.getSession();

    if (!session) {
      return null;
    }

    return await client.getCurrentUser(session.accessToken);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}
