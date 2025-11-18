/**
 * AWS Cognito Authentication Module
 * 
 * This module exports all authentication-related functionality
 * for AWS Cognito integration.
 */

export {
  CognitoAuthClient,
  getCognitoClient,
  resetCognitoClient,
  type CognitoUser,
  type AuthSession,
  type SignUpResult,
} from './cognito-client';

export {
  AuthProvider,
  useAuth,
} from './auth-provider';

export {
  useUser,
  useAuthMethods,
  useSession,
  type UserAuthState,
} from './use-user';

export {
  decodeToken,
  isTokenExpired,
  getUserIdFromToken,
  verifyTokenBasic,
  extractTokenFromHeader,
  verifyAuthToken,
  getCognitoPublicKeys,
  verifyTokenSignature,
  createAuthHeader,
  type DecodedToken,
} from './token-verification';
