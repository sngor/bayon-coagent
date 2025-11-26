'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getRepository } from '../repository';
import { DynamoDBError } from '../errors';
import { getCache } from './cache';

/**
 * Utility type to add an 'id' field to a given type T.
 */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useItem hook.
 * @template T Type of the item data.
 */
export interface UseItemResult<T> {
    data: WithId<T> | null; // Item data with ID, or null.
    isLoading: boolean; // True if loading.
    error: DynamoDBError | Error | null; // Error object, or null.
    refetch: () => Promise<void>; // Function to manually refetch the data
}

/**
 * Options for configuring the useItem hook
 */
export interface UseItemOptions {
    /**
     * Enable polling for real-time updates
     * @default false
     */
    enablePolling?: boolean;

    /**
     * Polling interval in milliseconds
     * @default 5000 (5 seconds)
     */
    pollingInterval?: number;

    /**
     * Whether to fetch immediately on mount
     * @default true
     */
    fetchOnMount?: boolean;

    /**
     * Enable caching
     * @default true
     */
    enableCache?: boolean;

    /**
     * Cache TTL in milliseconds
     * @default 30000 (30 seconds)
     */
    cacheTTL?: number;
}

/**
 * React hook to fetch and optionally poll a single DynamoDB item.
 * Provides an interface similar to Firebase's useDoc hook.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the pk and sk parameters or BAD THINGS WILL HAPPEN
 * use useMemo to memoize them per React guidance. Also make sure that their dependencies are stable.
 * 
 * @template T Optional type for item data. Defaults to any.
 * @param {string | null | undefined} pk - The partition key. Waits if null/undefined.
 * @param {string | null | undefined} sk - The sort key. Waits if null/undefined.
 * @param {UseItemOptions} options - Configuration options for the hook.
 * @returns {UseItemResult<T>} Object with data, isLoading, error, and refetch.
 * 
 * @example
 * ```tsx
 * const pk = useMemo(() => `USER#${userId}`, [userId]);
 * const sk = useMemo(() => 'PROFILE', []);
 * const { data, isLoading, error } = useItem<UserProfile>(pk, sk);
 * ```
 * 
 * @example
 * // With polling enabled
 * ```tsx
 * const pk = useMemo(() => `USER#${userId}`, [userId]);
 * const sk = useMemo(() => `AGENT#main`, []);
 * const { data, isLoading, error } = useItem<AgentProfile>(pk, sk, {
 *   enablePolling: true,
 *   pollingInterval: 3000
 * });
 * ```
 */
export function useItem<T = any>(
    pk: string | null | undefined,
    sk: string | null | undefined,
    options: UseItemOptions = {}
): UseItemResult<T> {
    const {
        enablePolling = false,
        pollingInterval = 5000,
        fetchOnMount = true,
        enableCache = true,
        cacheTTL = 30000,
    } = options;

    type StateDataType = WithId<T> | null;

    const [data, setData] = useState<StateDataType>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<DynamoDBError | Error | null>(null);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const lastFetchRef = useRef<{ pk: string; sk: string } | null>(null);

    // Fetch function that can be called manually or by polling
    const fetchItem = useCallback(async () => {
        if (!pk || !sk) {
            setData(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        // Check cache first
        if (enableCache) {
            const cache = getCache();
            const cached = cache.get<WithId<T>>(pk, sk);
            if (cached) {
                setData(cached);
                setIsLoading(false);
                setError(null);
                return;
            }
        }

        // Only set loading on initial fetch, not on polling updates
        if (!lastFetchRef.current || lastFetchRef.current.pk !== pk || lastFetchRef.current.sk !== sk) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const repository = getRepository();
            const result = await repository.get<T>(pk, sk);

            if (!isMountedRef.current) return;

            if (result) {
                // Extract ID from sort key (e.g., "AGENT#main" -> "main")
                const id = sk.includes('#') ? sk.split('#').slice(1).join('#') : sk;
                const dataWithId = { ...result, id } as WithId<T>;
                setData(dataWithId);

                // Cache the result
                if (enableCache) {
                    const cache = getCache();
                    cache.set(dataWithId, pk, sk, undefined, cacheTTL);
                }
            } else {
                setData(null);
            }

            setError(null);
            lastFetchRef.current = { pk, sk };
        } catch (err: any) {
            if (!isMountedRef.current) return;

            const errorObj = err instanceof DynamoDBError ? err : new Error(err.message || 'Failed to fetch item');
            setError(errorObj);
            setData(null);
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [pk, sk, enableCache, cacheTTL]);

    // Setup polling
    useEffect(() => {
        if (!pk || !sk || !enablePolling) {
            return;
        }

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Set up new polling interval
        pollingIntervalRef.current = setInterval(() => {
            fetchItem();
        }, pollingInterval);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [pk, sk, enablePolling, pollingInterval, fetchItem]);

    // Initial fetch
    useEffect(() => {
        if (!pk || !sk) {
            setData(null);
            setIsLoading(false);
            setError(null);
            lastFetchRef.current = null;
            return;
        }

        if (fetchOnMount) {
            fetchItem();
        }
    }, [pk, sk, fetchOnMount, fetchItem]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    return { data, isLoading, error, refetch: fetchItem };
}
