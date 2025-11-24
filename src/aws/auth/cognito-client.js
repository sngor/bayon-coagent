"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoAuthClient = void 0;
exports.getCognitoClient = getCognitoClient;
exports.resetCognitoClient = resetCognitoClient;
exports.getCurrentUser = getCurrentUser;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const config_1 = require("../config");
class CognitoAuthClient {
    constructor() {
        const config = (0, config_1.getConfig)();
        const credentials = (0, config_1.getAWSCredentials)();
        console.log('Cognito Config:', {
            region: config.region,
            endpoint: config.cognito.endpoint,
            clientId: config.cognito.clientId,
            userPoolId: config.cognito.userPoolId,
        });
        this.client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: config.region,
            endpoint: config.cognito.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });
        this.clientId = config.cognito.clientId;
    }
    async signUp(email, password) {
        try {
            const command = new client_cognito_identity_provider_1.SignUpCommand({
                ClientId: this.clientId,
                Username: email,
                Password: password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email,
                    },
                ],
            });
            const response = await this.client.send(command);
            return {
                userSub: response.UserSub || '',
                userConfirmed: response.UserConfirmed || false,
            };
        }
        catch (error) {
            throw this.handleError(error, 'Failed to sign up');
        }
    }
    async confirmSignUp(email, code) {
        try {
            const command = new client_cognito_identity_provider_1.ConfirmSignUpCommand({
                ClientId: this.clientId,
                Username: email,
                ConfirmationCode: code,
            });
            await this.client.send(command);
        }
        catch (error) {
            throw this.handleError(error, 'Failed to confirm sign up');
        }
    }
    async resendConfirmationCode(email) {
        try {
            const command = new client_cognito_identity_provider_1.ResendConfirmationCodeCommand({
                ClientId: this.clientId,
                Username: email,
            });
            await this.client.send(command);
        }
        catch (error) {
            throw this.handleError(error, 'Failed to resend confirmation code');
        }
    }
    async signIn(email, password) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                AuthFlow: client_cognito_identity_provider_1.AuthFlowType.USER_PASSWORD_AUTH,
                ClientId: this.clientId,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });
            const response = await this.client.send(command);
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
            this.storeSession(session);
            return session;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to sign in');
        }
    }
    async signOut(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GlobalSignOutCommand({
                AccessToken: accessToken,
            });
            await this.client.send(command);
            this.clearSession();
        }
        catch (error) {
            this.clearSession();
            throw this.handleError(error, 'Failed to sign out');
        }
    }
    async getCurrentUser(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GetUserCommand({
                AccessToken: accessToken,
            });
            const response = await this.client.send(command);
            const attributes = {};
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
        }
        catch (error) {
            throw this.handleError(error, 'Failed to get current user');
        }
    }
    async refreshSession(refreshToken) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                AuthFlow: client_cognito_identity_provider_1.AuthFlowType.REFRESH_TOKEN_AUTH,
                ClientId: this.clientId,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });
            const response = await this.client.send(command);
            if (!response.AuthenticationResult) {
                throw new Error('Token refresh failed: No authentication result');
            }
            const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;
            if (!AccessToken || !IdToken) {
                throw new Error('Token refresh failed: Missing tokens');
            }
            return {
                accessToken: AccessToken,
                idToken: IdToken,
                refreshToken,
                expiresAt: Date.now() + (ExpiresIn || 3600) * 1000,
            };
        }
        catch (error) {
            throw this.handleError(error, 'Failed to refresh session');
        }
    }
    async getSession() {
        try {
            const sessionData = this.getStoredSession();
            if (!sessionData) {
                return null;
            }
            if (!sessionData.accessToken || !sessionData.refreshToken || !sessionData.expiresAt) {
                console.warn('Invalid session data structure, clearing session');
                this.clearSession();
                return null;
            }
            const now = Date.now();
            const expirationBuffer = 5 * 60 * 1000;
            if (sessionData.expiresAt - now < expirationBuffer) {
                try {
                    const newSession = await this.refreshSession(sessionData.refreshToken);
                    this.storeSession(newSession);
                    return newSession;
                }
                catch (error) {
                    console.warn('Token refresh failed, clearing session:', error);
                    this.clearSession();
                    return null;
                }
            }
            try {
                await this.getCurrentUser(sessionData.accessToken);
                return sessionData;
            }
            catch (error) {
                console.warn('Access token validation failed, attempting refresh:', error);
                try {
                    const newSession = await this.refreshSession(sessionData.refreshToken);
                    this.storeSession(newSession);
                    return newSession;
                }
                catch (refreshError) {
                    console.warn('Token refresh failed after validation error, clearing session:', refreshError);
                    this.clearSession();
                    return null;
                }
            }
        }
        catch (error) {
            console.error('Failed to get session:', error);
            this.clearSession();
            return null;
        }
    }
    storeSession(session) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cognito_session', JSON.stringify(session));
        }
    }
    getStoredSession() {
        if (typeof window === 'undefined') {
            return null;
        }
        const sessionStr = localStorage.getItem('cognito_session');
        if (!sessionStr) {
            return null;
        }
        try {
            return JSON.parse(sessionStr);
        }
        catch (error) {
            console.error('Failed to parse stored session:', error);
            return null;
        }
    }
    clearSession() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cognito_session');
        }
    }
    handleError(error, defaultMessage) {
        if (error instanceof Error) {
            const message = error.message;
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
exports.CognitoAuthClient = CognitoAuthClient;
let cognitoClient = null;
function getCognitoClient() {
    if (!cognitoClient) {
        cognitoClient = new CognitoAuthClient();
    }
    return cognitoClient;
}
function resetCognitoClient() {
    cognitoClient = null;
}
async function getCurrentUser(userId) {
    if (userId) {
        return {
            id: userId,
            email: '',
            emailVerified: true,
            attributes: {},
        };
    }
    try {
        const client = getCognitoClient();
        const session = await client.getSession();
        if (!session) {
            return null;
        }
        return await client.getCurrentUser(session.accessToken);
    }
    catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}
