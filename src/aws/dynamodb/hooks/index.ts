/**
 * DynamoDB React Hooks
 * 
 * Provides React hooks for accessing DynamoDB data with real-time updates via polling.
 * These hooks provide an interface similar to Firebase's useDoc and useCollection hooks.
 */

export { useItem, type UseItemResult, type UseItemOptions, type WithId as WithIdItem } from './use-item';
export { useQuery, type UseQueryResult, type UseQueryConfig, type WithId as WithIdQuery } from './use-query';
export { getCache, resetCache } from './cache';
