/**
 * Secure Storage Utilities
 * 
 * Provides secure storage for sensitive data with encryption and proper
 * session management. Replaces localStorage for sensitive tokens.
 */

import { z } from 'zod';

// Session data schema for validation
const SessionSchema = z.object({
  accessToken: z.string(),
  idToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  userId: z.string().optional(),
});

export type SessionData = z.infer<typeof SessionSchema>;

/**
 * Secure storage interface for session management
 */
export class SecureStorage {
  private static readonly SESSION_KEY = 'bayon_session';
  private static readonly ENCRYPTION_KEY = 'bayon_encrypt';

  /**
   * Simple XOR encryption for client-side storage
   * Note: This is not cryptographically secure, but better than plain text
   * For production, consider using Web Crypto API or server-side sessions
   */
  private static encrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private static decrypt(encryptedData: string, key: string): string {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  }

  /**
   * Generate a client-specific encryption key
   */
  private static getEncryptionKey(): string {
    if (typeof window === 'undefined') return 'server-key';
    
    let key = localStorage.getItem(this.ENCRYPTION_KEY);
    if (!key) {
      // Generate a random key for this client
      key = Math.random().toString(36).substring(2, 15) + 
            Math.random().toString(36).substring(2, 15);
      localStorage.setItem(this.ENCRYPTION_KEY, key);
    }
    return key;
  }

  /**
   * Store session data securely
   */
  static setSession(session: SessionData): void {
    if (typeof window === 'undefined') return;

    try {
      // Validate session data
      const validatedSession = SessionSchema.parse(session);
      
      const sessionString = JSON.stringify(validatedSession);
      const encryptedSession = this.encrypt(sessionString, this.getEncryptionKey());
      
      // Use sessionStorage instead of localStorage for better security
      sessionStorage.setItem(this.SESSION_KEY, encryptedSession);
      
      // Set expiration cleanup
      this.scheduleCleanup(validatedSession.expiresAt);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Retrieve session data securely
   */
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    try {
      const encryptedSession = sessionStorage.getItem(this.SESSION_KEY);
      if (!encryptedSession) return null;

      const sessionString = this.decrypt(encryptedSession, this.getEncryptionKey());
      if (!sessionString) return null;

      const session = JSON.parse(sessionString);
      const validatedSession = SessionSchema.parse(session);

      // Check if session is expired
      if (Date.now() > validatedSession.expiresAt) {
        this.clearSession();
        return null;
      }

      return validatedSession;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      this.clearSession(); // Clear corrupted session
      return null;
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(this.SESSION_KEY);
    // Don't remove encryption key - it can be reused
  }

  /**
   * Check if session exists and is valid
   */
  static hasValidSession(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Schedule automatic cleanup when session expires
   */
  private static scheduleCleanup(expiresAt: number): void {
    const timeUntilExpiry = expiresAt - Date.now();
    
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.clearSession();
      }, timeUntilExpiry);
    }
  }

  /**
   * Update session expiration time
   */
  static updateExpiration(expiresAt: number): void {
    const session = this.getSession();
    if (session) {
      session.expiresAt = expiresAt;
      this.setSession(session);
    }
  }

  /**
   * Get session expiration time
   */
  static getExpirationTime(): number | null {
    const session = this.getSession();
    return session?.expiresAt || null;
  }
}

/**
 * Hook for React components to use secure session storage
 */
export function useSecureSession() {
  const getSession = () => SecureStorage.getSession();
  const setSession = (session: SessionData) => SecureStorage.setSession(session);
  const clearSession = () => SecureStorage.clearSession();
  const hasValidSession = () => SecureStorage.hasValidSession();

  return {
    getSession,
    setSession,
    clearSession,
    hasValidSession,
  };
}