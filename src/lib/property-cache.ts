/**
 * Property Caching Utilities for Mobile Enhancements
 * 
 * This module provides utilities for caching property data locally
 * to support offline property comparisons.
 */

import { cachedContentStore } from './indexeddb-wrapper';
import { CachedContentItem, createExpirationTimestamp, isExpired } from './indexeddb-schema';

export interface CachedProperty {
    id: string;
    address: string;
    price: number;
    size: number;
    beds: number;
    baths: number;
    features: string[];
    photos: string[];
    mlsNumber?: string;
    listingAgent?: string;
    description?: string;
    yearBuilt?: number;
    lotSize?: number;
    propertyType?: string;
    status?: 'active' | 'pending' | 'sold' | 'off-market';
}

/**
 * Cache property data for offline access
 */
export async function cacheProperty(property: CachedProperty): Promise<void> {
    try {
        const cacheItem: CachedContentItem = {
            id: `property-${property.id}`,
            type: 'property',
            data: property,
            cachedAt: Date.now(),
            expiresAt: createExpirationTimestamp(24), // Cache for 24 hours
            location: property.address
        };

        await cachedContentStore.put(cacheItem);
        console.log(`Property cached: ${property.address} (${property.id})`);
    } catch (error) {
        console.error('Failed to cache property:', error);
        throw error;
    }
}

/**
 * Cache multiple properties in batch
 */
export async function cacheProperties(properties: CachedProperty[]): Promise<void> {
    try {
        const cacheItems: CachedContentItem[] = properties.map(property => ({
            id: `property-${property.id}`,
            type: 'property',
            data: property,
            cachedAt: Date.now(),
            expiresAt: createExpirationTimestamp(24), // Cache for 24 hours
            location: property.address
        }));

        await Promise.all(cacheItems.map(item => cachedContentStore.put(item)));
        console.log(`${properties.length} properties cached successfully`);
    } catch (error) {
        console.error('Failed to cache properties:', error);
        throw error;
    }
}

/**
 * Get cached property by ID
 */
export async function getCachedProperty(propertyId: string): Promise<CachedProperty | null> {
    try {
        const cacheItem = await cachedContentStore.get(`property-${propertyId}`);

        if (!cacheItem) {
            return null;
        }

        // Check if cache has expired
        if (isExpired(cacheItem.expiresAt)) {
            console.log(`Cached property expired: ${propertyId}`);
            await cachedContentStore.delete(`property-${propertyId}`);
            return null;
        }

        return cacheItem.data as CachedProperty;
    } catch (error) {
        console.error('Failed to get cached property:', error);
        return null;
    }
}

/**
 * Get multiple cached properties by IDs
 */
export async function getCachedProperties(propertyIds: string[]): Promise<CachedProperty[]> {
    try {
        const properties: CachedProperty[] = [];

        for (const propertyId of propertyIds) {
            const property = await getCachedProperty(propertyId);
            if (property) {
                properties.push(property);
            }
        }

        return properties;
    } catch (error) {
        console.error('Failed to get cached properties:', error);
        return [];
    }
}

/**
 * Get all cached properties
 */
export async function getAllCachedProperties(): Promise<CachedProperty[]> {
    try {
        const allCacheItems = await cachedContentStore.getAll();
        const propertyItems = allCacheItems.filter(item =>
            item.type === 'property' && !isExpired(item.expiresAt)
        );

        // Clean up expired items
        const expiredItems = allCacheItems.filter(item =>
            item.type === 'property' && isExpired(item.expiresAt)
        );

        if (expiredItems.length > 0) {
            await Promise.all(expiredItems.map(item => cachedContentStore.delete(item.id)));
            console.log(`Cleaned up ${expiredItems.length} expired property cache items`);
        }

        return propertyItems.map(item => item.data as CachedProperty);
    } catch (error) {
        console.error('Failed to get all cached properties:', error);
        return [];
    }
}

/**
 * Search cached properties by location/address
 */
export async function searchCachedProperties(query: string): Promise<CachedProperty[]> {
    try {
        const allProperties = await getAllCachedProperties();
        const lowerQuery = query.toLowerCase();

        return allProperties.filter(property =>
            property.address.toLowerCase().includes(lowerQuery) ||
            property.features.some(feature => feature.toLowerCase().includes(lowerQuery)) ||
            property.propertyType?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Failed to search cached properties:', error);
        return [];
    }
}

/**
 * Clear all cached properties
 */
export async function clearPropertyCache(): Promise<void> {
    try {
        const allCacheItems = await cachedContentStore.getAll();
        const propertyItems = allCacheItems.filter(item => item.type === 'property');

        await Promise.all(propertyItems.map(item => cachedContentStore.delete(item.id)));
        console.log(`Cleared ${propertyItems.length} cached properties`);
    } catch (error) {
        console.error('Failed to clear property cache:', error);
        throw error;
    }
}

/**
 * Get cache statistics
 */
export async function getPropertyCacheStats(): Promise<{
    totalCached: number;
    expired: number;
    fresh: number;
    oldestCacheTime: number;
    newestCacheTime: number;
}> {
    try {
        const allCacheItems = await cachedContentStore.getAll();
        const propertyItems = allCacheItems.filter(item => item.type === 'property');

        const expired = propertyItems.filter(item => isExpired(item.expiresAt));
        const fresh = propertyItems.filter(item => !isExpired(item.expiresAt));

        const cacheTimes = propertyItems.map(item => item.cachedAt);
        const oldestCacheTime = cacheTimes.length > 0 ? Math.min(...cacheTimes) : 0;
        const newestCacheTime = cacheTimes.length > 0 ? Math.max(...cacheTimes) : 0;

        return {
            totalCached: propertyItems.length,
            expired: expired.length,
            fresh: fresh.length,
            oldestCacheTime,
            newestCacheTime
        };
    } catch (error) {
        console.error('Failed to get property cache stats:', error);
        return {
            totalCached: 0,
            expired: 0,
            fresh: 0,
            oldestCacheTime: 0,
            newestCacheTime: 0
        };
    }
}

/**
 * Check if property is cached and fresh
 */
export async function isPropertyCached(propertyId: string): Promise<boolean> {
    try {
        const property = await getCachedProperty(propertyId);
        return property !== null;
    } catch (error) {
        console.error('Failed to check if property is cached:', error);
        return false;
    }
}

/**
 * Update cached property data
 */
export async function updateCachedProperty(property: CachedProperty): Promise<void> {
    try {
        await cacheProperty(property);
        console.log(`Property cache updated: ${property.address} (${property.id})`);
    } catch (error) {
        console.error('Failed to update cached property:', error);
        throw error;
    }
}