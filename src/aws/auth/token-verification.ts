/**
 * JWT Token Verification Module
 * 
 * This module provides utilities for verifying JWT tokens from AWS Cognito.
 * It can be used in middleware or API routes to protect resources.
 */

import { getConfig } from '../config';

/**
 * Decoded JWT token payload
 */
export interface DecodedToken {
  sub: string; // User ID
  email?: string;
  email_verified?: boolean;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  token_use: 'access' | 'id';
  [key: string]: unknown;
}

/**
 * Decode a JWT token without verification (for inspection only)
 * WARNING: This does not verify the token signature!
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded) as DecodedToken;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Extract user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.sub || null;
}

/**
 * Verify token format and expiration
 * Note: This performs basic validation but does NOT verify the signature.
 * For production use, you should verify the signature against Cognito's public keys.
 */
export function verifyTokenBasic(token: string): {
  valid: boolean;
  error?: string;
  decoded?: DecodedToken;
} {
  // Check token format
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Invalid token format' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT format' };
  }

  // Decode token
  const decoded = decodeToken(token);
  if (!decoded) {
    return { valid: false, error: 'Failed to decode token' };
  }

  // Check expiration
  if (isTokenExpired(token)) {
    return { valid: false, error: 'Token expired' };
  }

  // Check token type (should be access token for API calls)
  if (decoded.token_use !== 'access' && decoded.token_use !== 'id') {
    return { valid: false, error: 'Invalid token type' };
  }

  return { valid: true, decoded };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware helper to verify authentication
 * Returns the decoded token if valid, or null if invalid
 */
export function verifyAuthToken(authHeader: string | null): DecodedToken | null {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }

  const result = verifyTokenBasic(token);
  if (!result.valid) {
    return null;
  }

  return result.decoded || null;
}

/**
 * Get Cognito public keys for signature verification
 * In production, you should cache these keys and refresh periodically
 */
export async function getCognitoPublicKeys(): Promise<Record<string, string>> {
  const config = getConfig();
  const region = config.region;
  const userPoolId = config.cognito.userPoolId;

  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  try {
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }

    const jwks = await response.json();
    return jwks;
  } catch (error) {
    console.error('Failed to fetch Cognito public keys:', error);
    throw error;
  }
}

/**
 * Verify token signature (advanced)
 * Note: This requires additional libraries like 'jsonwebtoken' or 'jose'
 * For now, this is a placeholder that performs basic validation
 */
export async function verifyTokenSignature(token: string): Promise<boolean> {
  // TODO: Implement full signature verification using Cognito's public keys
  // This would require:
  // 1. Fetch JWKS from Cognito
  // 2. Find the correct key based on token's 'kid' header
  // 3. Verify signature using the public key
  
  // For now, perform basic validation
  const result = verifyTokenBasic(token);
  return result.valid;
}

/**
 * Create an authorization header with Bearer token
 */
export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
