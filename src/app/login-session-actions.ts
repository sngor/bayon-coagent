'use server';

/**
 * Server Actions for Login Session Management
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getLoginSessionKeys } from '@/aws/dynamodb/keys';
import { LoginSession, LoginHistory } from '@/lib/types/login-session-types';
import { headers } from 'next/headers';

/**
 * Track a new login session
 */
export async function trackLoginSession(userId: string): Promise<void> {
  try {
    const repository = getRepository();
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Get request headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;

    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Create session data
    const sessionData: LoginSession = {
      sessionId,
      userId,
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      isActive: true,
    };

    // Save to DynamoDB
    const keys = getLoginSessionKeys(userId, sessionId);
    await repository.create(
      keys.PK,
      keys.SK,
      'LoginSession',
      sessionData
    );
  } catch (error) {
    console.error('Failed to track login session:', error);
    // Don't throw - login tracking shouldn't block authentication
  }
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(userId: string, limit: number = 10): Promise<LoginSession[]> {
  try {
    const repository = getRepository();
    const pk = `USER#${userId}`;
    const skPrefix = 'SESSION#';

    const result = await repository.query<LoginSession>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });

    return result.items;
  } catch (error) {
    console.error('Failed to get login history:', error);
    return [];
  }
}

/**
 * Mark all sessions as inactive except the current one
 */
export async function signOutAllDevices(userId: string, currentSessionId?: string): Promise<void> {
  try {
    const repository = getRepository();
    const sessions = await getLoginHistory(userId, 100);

    // Update all sessions except current to inactive
    for (const session of sessions) {
      if (session.sessionId !== currentSessionId && session.isActive) {
        const keys = getLoginSessionKeys(userId, session.sessionId);
        await repository.update(keys.PK, keys.SK, { isActive: false });
      }
    }
  } catch (error) {
    console.error('Failed to sign out all devices:', error);
    throw new Error('Failed to sign out all devices');
  }
}
