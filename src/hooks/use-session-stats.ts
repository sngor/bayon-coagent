'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpenHouseSession, InterestLevelDistribution } from '@/lib/open-house/types';

/**
 * Real-time Session Statistics Hook
 * 
 * Polls for session statistics at regular intervals for active sessions.
 * Validates Requirements: 11.1, 11.2
 */

export interface SessionStats {
    visitorCount: number;
    interestLevelDistribution: InterestLevelDistribution;
    elapsedTime: number; // in minutes
    elapsedTimeFormatted: string; // formatted as "Xh Ym"
    isActive: boolean;
}

interface UseSessionStatsOptions {
    sessionId: string;
    initialSession: OpenHouseSession;
    pollingInterval?: number; // in milliseconds, default 2000 (2 seconds)
    enabled?: boolean; // whether polling is enabled
}

export function useSessionStats({
    sessionId,
    initialSession,
    pollingInterval = 2000,
    enabled = true,
}: UseSessionStatsOptions) {
    const [stats, setStats] = useState<SessionStats>(() =>
        calculateStats(initialSession)
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate statistics from session data
    const calculateStats = useCallback((session: OpenHouseSession): SessionStats => {
        const isActive = session.status === 'active';

        // Calculate elapsed time
        let elapsedTime = 0;
        let elapsedTimeFormatted = '0m';

        if (isActive && session.actualStartTime) {
            const startTime = new Date(session.actualStartTime);
            const now = new Date();
            const elapsedMs = now.getTime() - startTime.getTime();
            elapsedTime = Math.floor(elapsedMs / 60000); // Convert to minutes

            const hours = Math.floor(elapsedTime / 60);
            const minutes = elapsedTime % 60;

            if (hours > 0) {
                elapsedTimeFormatted = `${hours}h ${minutes}m`;
            } else {
                elapsedTimeFormatted = `${minutes}m`;
            }
        }

        return {
            visitorCount: session.visitorCount || 0,
            interestLevelDistribution: session.interestLevelDistribution || {
                high: 0,
                medium: 0,
                low: 0,
            },
            elapsedTime,
            elapsedTimeFormatted,
            isActive,
        };
    }, []);

    // Fetch latest session data
    const fetchStats = useCallback(async () => {
        if (!enabled) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/open-house/sessions/${sessionId}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch session stats');
            }

            const data = await response.json();

            if (data.session) {
                const newStats = calculateStats(data.session);
                setStats(newStats);
            }
        } catch (err) {
            console.error('Error fetching session stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, enabled, calculateStats]);

    // Set up polling for active sessions
    useEffect(() => {
        // Only poll if enabled and session is active
        if (!enabled || !stats.isActive) {
            return;
        }

        // Initial fetch
        fetchStats();

        // Set up polling interval
        const intervalId = setInterval(() => {
            fetchStats();
        }, pollingInterval);

        // Cleanup
        return () => {
            clearInterval(intervalId);
        };
    }, [enabled, stats.isActive, pollingInterval, fetchStats]);

    // Update elapsed time every minute for active sessions
    useEffect(() => {
        if (!stats.isActive) return;

        const intervalId = setInterval(() => {
            setStats((prevStats) => {
                const newElapsedTime = prevStats.elapsedTime + 1;
                const hours = Math.floor(newElapsedTime / 60);
                const minutes = newElapsedTime % 60;

                const elapsedTimeFormatted = hours > 0
                    ? `${hours}h ${minutes}m`
                    : `${minutes}m`;

                return {
                    ...prevStats,
                    elapsedTime: newElapsedTime,
                    elapsedTimeFormatted,
                };
            });
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [stats.isActive]);

    return {
        stats,
        isLoading,
        error,
        refresh: fetchStats,
    };
}
