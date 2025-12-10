'use client';

/**
 * Client-side logging utility
 * 
 * This module provides client-side logging capabilities that can send
 * logs to the server for CloudWatch integration.
 */

/**
 * Log context for client-side logs
 */
interface ClientLogContext {
    [key: string]: any;
}

/**
 * Logs an error from the client-side to the server
 * 
 * @param operation - The operation that failed
 * @param context - Additional context about the error
 */
export async function logError(
    operation: string,
    context: ClientLogContext
): Promise<void> {
    try {
        // In production, send to server endpoint for CloudWatch logging
        if (process.env.NODE_ENV === 'production') {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation,
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                }),
            }).catch((err) => {
                // Silently fail if logging fails
                console.error('Failed to send error log to server:', err);
            });
        }

        // Always log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${operation}]`, context);
        }
    } catch (err) {
        // Silently fail - don't want logging to cause more errors
        console.error('Failed to log error:', err);
    }
}

/**
 * Logs a warning from the client-side
 * 
 * @param operation - The operation that generated the warning
 * @param context - Additional context about the warning
 */
export async function logWarning(
    operation: string,
    context: ClientLogContext
): Promise<void> {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[${operation}]`, context);
        }
    } catch (err) {
        // Silently fail
        console.error('Failed to log warning:', err);
    }
}

/**
 * Logs info from the client-side
 * 
 * @param operation - The operation
 * @param context - Additional context
 */
export async function logInfo(
    operation: string,
    context: ClientLogContext
): Promise<void> {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.info(`[${operation}]`, context);
        }
    } catch (err) {
        // Silently fail
        console.error('Failed to log info:', err);
    }
}
