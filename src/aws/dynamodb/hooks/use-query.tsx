'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getRepository } from '../repository';
import { DynamoDBError } from '../errors';
import { QueryOptions, DynamoDBKey } from '../types';
import { getCache } from './cache';

/**
 * Utility type to add an 'id' field to a given type T.
 */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useQuery hook.
 * @template T Type of the item data.
 */
export interface UseQueryResult<T> {
    data: WithId<T>[] | null; // Array of items with IDs, or null.
    isLoading: boolean; // True if loading.
    error: DynamoDBError | Error | null; // Error object, or null.
    refetch: () => Promise<void>; // Function to manually refetch the data
    hasMore: boolean; // True if there are more items to load
    loadMore: () => Promise<void>; // Function to load more items (pagination)
}

/**
 * Query configuration for the useQuery hook
 */
export interface UseQueryConfig extends QueryOptions {
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
     * Enable automatic pagination (load all items)
     * @default false
     */
    autoLoadAll?: boolean;

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
 * React hook to query DynamoDB items with optional polling and pagination.
 * Provides an interface similar to Firebase's useCollection hook.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the pk and skPrefix parameters or BAD THINGS WILL HAPPEN
 * use useMemo to memoize them per React guidance. Also make sure that their dependencies are stable.
 * 
 * @template T Optional type for item data. Defaults to any.
 * @param {string | null | undefined} pk - The partition key. Waits if null/undefined.
 * @param {string | null | undefined} skPrefix - Optional sort key prefix for filtering.
 * @param {UseQueryConfig} config - Configuration options for the query.
 * @returns {UseQueryResult<T>} Object with data, isLoading, error, refetch, hasMore, and loadMore.
 * 
 * @example
 * ```tsx
 * const pk = useMemo(() => `USER#${userId}`, [userId]);
 * const skPrefix = useMemo(() => 'CONTENT#', []);
 * const { data, isLoading, error } = useQuery<SavedContent>(pk, skPrefix);
 * ```
 * 
 * @example
 * // With polling and pagination
 * ```tsx
 * const pk = useMemo(() => `USER#${userId}`, [userId]);
 * const skPrefix = useMemo(() => 'PROJECT#', []);
 * const { data, isLoading, error, hasMore, loadMore } = useQuery<Project>(pk, skPrefix, {
 *   enablePolling: true,
 *   pollingInterval: 3000,
 *   limit: 20
 * });
 * ```
 */
export function useQuery<T = any>(
    pk: string | null | undefined,
    skPrefix?: string | null | undefined,
    config: UseQueryConfig = {}
): UseQueryResult<T> {
    const {
        enablePolling = false,
        pollingInterval = 5000,
        fetchOnMount = true,
        autoLoadAll = false,
        enableCache = true,
        cacheTTL = 30000,
        limit,
        scanIndexForward,
        filterExpression,
        expressionAttributeValues,
        expressionAttributeNames,
    } = config;

    type StateDataType = WithId<T>[] | null;

    const [data, setData] = useState<StateDataType>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<DynamoDBError | Error | null>(null);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<DynamoDBKey | undefined>(undefined);
    const [hasMore, setHasMore] = useState<boolean>(false);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const lastFetchRef = useRef<{ pk: string; skPrefix?: string } | null>(null);
    const isLoadingMoreRef = useRef<boolean>(false);

    // Extract ID from sort key
    const extractId = useCallback((sk: string): string => {
        return sk.includes('#') ? sk.split('#').slice(1).join('#') : sk;
    }, []);

    // Fetch function that can be called manually or by polling
    const fetchItems = useCallback(async (append: boolean = false) => {
        if (!pk) {
            setData(null);
            setIsLoading(false);
            setError(null);
            setHasMore(false);
            return;
        }

        // Check cache first (only for initial fetch, not pagination)
        if (!append && enableCache) {
            const cache = getCache();
            const cached = cache.get<WithId<T>[]>(pk, undefined, skPrefix || undefined);
            if (cached) {
                setData(cached);
                setIsLoading(false);
                setError(null);
                setHasMore(false); // Cached data doesn't have pagination info
                return;
            }
        }

        // Only set loading on initial fetch, not on polling updates or pagination
        if (!append && (!lastFetchRef.current || lastFetchRef.current.pk !== pk || lastFetchRef.current.skPrefix !== skPrefix)) {
            setIsLoading(true);
        }

        if (!append) {
            setError(null);
        }

        try {
            const repository = getRepository();

            const queryOptions: QueryOptions = {
                limit,
                scanIndexForward,
                filterExpression,
                expressionAttributeValues,
                expressionAttributeNames,
                exclusiveStartKey: append ? lastEvaluatedKey : undefined,
            };

            const result = await repository.query<T>(
                pk,
                skPrefix || undefined,
                queryOptions
            );

            if (!isMountedRef.current) return;

            const itemsWithIds = result.items.map((item: any) => {
                // Try to extract ID from the item's SK if available
                const id = item.SK ? extractId(item.SK) : Math.random().toString(36).substring(7);
                return { ...item, id } as WithId<T>;
            });

            if (append) {
                setData((prevData) => [...(prevData || []), ...itemsWithIds]);
            } else {
                setData(itemsWithIds);

                // Cache the result (only for initial fetch, not pagination)
                if (enableCache) {
                    const cache = getCache();
                    cache.set(itemsWithIds, pk, undefined, skPrefix || undefined, cacheTTL);
                }
            }

            setLastEvaluatedKey(result.lastEvaluatedKey);
            setHasMore(!!result.lastEvaluatedKey);
            setError(null);
            lastFetchRef.current = { pk, skPrefix: skPrefix || undefined };
        } catch (err: any) {
            if (!isMountedRef.current) return;

            const errorObj = err instanceof DynamoDBError ? err : new Error(err.message || 'Failed to query items');
            setError(errorObj);

            if (!append) {
                setData(null);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                isLoadingMoreRef.current = false;
            }
        }
    }, [pk, skPrefix, limit, scanIndexForward, filterExpression, expressionAttributeValues, expressionAttributeNames, lastEvaluatedKey, extractId, enableCache, cacheTTL]);

    // Load more items (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || isLoadingMoreRef.current) {
            return;
        }

        isLoadingMoreRef.current = true;
        await fetchItems(true);
    }, [hasMore, fetchItems]);

    // Refetch from beginning
    const refetch = useCallback(async () => {
        setLastEvaluatedKey(undefined);
        await fetchItems(false);
    }, [fetchItems]);

    // Setup polling
    useEffect(() => {
        if (!pk || !enablePolling) {
            return;
        }

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Set up new polling interval
        pollingIntervalRef.current = setInterval(() => {
            refetch();
        }, pollingInterval);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [pk, enablePolling, pollingInterval, refetch]);

    // Initial fetch
    useEffect(() => {
        if (!pk) {
            setData(null);
            setIsLoading(false);
            setError(null);
            setHasMore(false);
            lastFetchRef.current = null;
            setLastEvaluatedKey(undefined);
            return;
        }

        if (fetchOnMount) {
            setLastEvaluatedKey(undefined);
            fetchItems(false);
        }
    }, [pk, skPrefix, fetchOnMount, limit, scanIndexForward, filterExpression]); // Note: fetchItems not in deps to avoid infinite loop

    // Auto-load all items if enabled
    useEffect(() => {
        if (autoLoadAll && hasMore && !isLoading && !isLoadingMoreRef.current) {
            loadMore();
        }
    }, [autoLoadAll, hasMore, isLoading, loadMore]);

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

    return { data, isLoading, error, refetch, hasMore, loadMore };
}
