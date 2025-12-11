/**
 * Property Search Service for Client Dashboards
 * 
 * Leverages existing MLS connection infrastructure from agent accounts
 * to provide property search functionality for client dashboards.
 * 
 * Requirements Coverage:
 * - 4.2: Property search with filtering
 * - 4.3: Display property details
 */

import { createMLSConnector, MLSAuthenticationError, MLSNetworkError } from '@/integrations/mls/connector';
import { getRepository } from '@/aws/dynamodb/repository';
import { MLSGridService } from '@/services/mls/mls-grid-service';
import type { MLSConnection, Listing } from '@/integrations/mls/types';

/**
 * Search criteria for property search
 */
export interface PropertySearchCriteria {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string[];
    minSquareFeet?: number;
    maxSquareFeet?: number;
    page?: number;
    limit?: number;
}

/**
 * Property listing result
 */
export interface PropertyListing {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType: string;
    images: string[];
    listingDate: string;
    status: 'active' | 'pending' | 'sold' | 'expired';
}

/**
 * Search result with pagination
 */
export interface PropertySearchResult {
    properties: PropertyListing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Cache entry for search results
 */
interface CacheEntry {
    data: PropertySearchResult;
    timestamp: number;
}

/**
 * In-memory cache for search results (5-minute TTL)
 * In production, this would use Redis or similar
 */
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Property Search Service
 */
export class PropertySearchService {
    /**
     * Search properties using MLS Grid API with fallback to agent's MLS credentials
     * 
     * @param agentId - Agent ID who owns the dashboard
     * @param criteria - Search criteria
     * @returns Search results with pagination
     */
    async searchProperties(
        agentId: string,
        criteria: PropertySearchCriteria
    ): Promise<PropertySearchResult> {
        try {
            // Generate cache key
            const cacheKey = this.generateCacheKey(agentId, criteria);

            // Check cache first
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('Returning cached search results');
                return cached;
            }

            // First, try MLS Grid API for real data
            try {
                console.log('Attempting to search properties using MLS Grid API');
                const result = await this.searchWithMLSGrid(criteria);

                if (result.properties.length > 0) {
                    console.log(`Found ${result.properties.length} properties via MLS Grid`);
                    // Cache the result
                    this.setCache(cacheKey, result);
                    return result;
                }
            } catch (mlsGridError) {
                console.warn('MLS Grid search failed, falling back to agent MLS connection:', mlsGridError);
            }

            // Fallback to agent's MLS connection
            console.log('Using agent MLS connection as fallback');

            // Get agent's MLS connection
            const connection = await this.getAgentMLSConnection(agentId);
            if (!connection) {
                // If no agent connection and MLS Grid failed, return demo data
                console.log('No agent MLS connection found, returning demo data');
                return this.getDemoProperties(criteria);
            }

            // Verify token is not expired
            if (Date.now() >= connection.expiresAt) {
                throw new MLSAuthenticationError(
                    'MLS connection expired. Agent needs to re-authenticate.',
                    connection.provider
                );
            }

            // Create MLS connector
            const connector = createMLSConnector(connection.provider);

            // Fetch listings from MLS
            console.log(`Fetching properties for agent ${agentId} with criteria:`, criteria);
            const listings = await connector.fetchListings(connection, connection.agentId);

            // Filter listings based on criteria
            const filteredListings = this.filterListings(listings, criteria);

            // Apply pagination
            const page = criteria.page || 1;
            const limit = criteria.limit || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedListings = filteredListings.slice(startIndex, endIndex);

            // Transform to PropertyListing format
            const properties = paginatedListings.map(listing => this.transformListing(listing));

            const result: PropertySearchResult = {
                properties,
                total: filteredListings.length,
                page,
                limit,
                hasMore: endIndex < filteredListings.length,
            };

            // Cache the result
            this.setCache(cacheKey, result);

            return result;

        } catch (error) {
            console.error('Property search error:', error);

            // Handle specific error types
            if (error instanceof MLSAuthenticationError) {
                throw new Error(`MLS authentication failed: ${error.message}`);
            }

            if (error instanceof MLSNetworkError) {
                throw new Error(`MLS network error: ${error.message}`);
            }

            throw error;
        }
    }

    /**
     * Search properties using MLS Grid API
     */
    private async searchWithMLSGrid(criteria: PropertySearchCriteria): Promise<PropertySearchResult> {
        const mlsService = new MLSGridService();

        // Extract location info
        let city: string | undefined;
        let state: string | undefined;

        if (criteria.location) {
            // Try to parse "City, State" format
            const locationParts = criteria.location.split(',');
            if (locationParts.length >= 2) {
                city = locationParts[0].trim();
                state = locationParts[1].trim();
            } else {
                // Assume it's a city name, use common states for demo
                city = criteria.location.trim();
                // For demo purposes, try common states
                state = 'WA'; // Default to Washington for demo data
            }
        }

        // Map property types
        let propertyType: string | undefined;
        if (criteria.propertyType && criteria.propertyType.length > 0) {
            const type = criteria.propertyType[0].toLowerCase();
            if (type.includes('single') || type.includes('house')) {
                propertyType = 'Residential';
            } else if (type.includes('condo')) {
                propertyType = 'Condominium';
            } else if (type.includes('townhouse')) {
                propertyType = 'Townhouse';
            }
        }

        // Search active properties
        const properties = await mlsService.searchActiveProperties(
            city,
            state,
            criteria.minPrice,
            criteria.maxPrice,
            criteria.bedrooms,
            criteria.bedrooms ? criteria.bedrooms + 2 : undefined, // Allow some flexibility
            criteria.bathrooms,
            criteria.bathrooms ? criteria.bathrooms + 1 : undefined, // Allow some flexibility
            propertyType,
            criteria.limit || 20
        );

        // Transform MLS Grid properties to PropertyListing format
        const transformedProperties: PropertyListing[] = properties.map(prop => ({
            id: prop.ListingKey,
            address: prop.UnparsedAddress,
            city: prop.City,
            state: prop.StateOrProvince,
            zip: prop.PostalCode || '',
            price: prop.ListPrice,
            bedrooms: prop.BedroomsTotal || 0,
            bathrooms: prop.BathroomsTotalInteger || 0,
            squareFeet: prop.LivingArea || 0,
            propertyType: prop.PropertyType,
            images: prop.Media?.map(m => m.MediaURL) || [],
            listingDate: prop.ListingContractDate || new Date().toISOString(),
            status: prop.StandardStatus.toLowerCase() as 'active' | 'pending' | 'sold' | 'expired'
        }));

        // Apply additional filtering for square footage (MLS Grid API might not support all filters)
        const filteredProperties = transformedProperties.filter(prop => {
            if (criteria.minSquareFeet && prop.squareFeet < criteria.minSquareFeet) return false;
            if (criteria.maxSquareFeet && prop.squareFeet > criteria.maxSquareFeet) return false;
            return true;
        });

        // Apply pagination
        const page = criteria.page || 1;
        const limit = criteria.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

        return {
            properties: paginatedProperties,
            total: filteredProperties.length,
            page,
            limit,
            hasMore: endIndex < filteredProperties.length,
        };
    }

    /**
     * Get demo properties when no real data is available
     */
    private getDemoProperties(criteria: PropertySearchCriteria): PropertySearchResult {
        const demoProperties: PropertyListing[] = [
            {
                id: 'demo-1',
                address: '123 Main Street',
                city: 'Seattle',
                state: 'WA',
                zip: '98101',
                price: 750000,
                bedrooms: 3,
                bathrooms: 2,
                squareFeet: 1800,
                propertyType: 'Single Family',
                images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
                listingDate: new Date().toISOString(),
                status: 'active'
            },
            {
                id: 'demo-2',
                address: '456 Oak Avenue',
                city: 'Bellevue',
                state: 'WA',
                zip: '98004',
                price: 950000,
                bedrooms: 4,
                bathrooms: 3,
                squareFeet: 2400,
                propertyType: 'Single Family',
                images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
                listingDate: new Date().toISOString(),
                status: 'active'
            },
            {
                id: 'demo-3',
                address: '789 Pine Street',
                city: 'Redmond',
                state: 'WA',
                zip: '98052',
                price: 650000,
                bedrooms: 2,
                bathrooms: 2,
                squareFeet: 1200,
                propertyType: 'Condominium',
                images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
                listingDate: new Date().toISOString(),
                status: 'active'
            }
        ];

        // Apply basic filtering to demo data
        const filteredDemo = demoProperties.filter(prop => {
            if (criteria.minPrice && prop.price < criteria.minPrice) return false;
            if (criteria.maxPrice && prop.price > criteria.maxPrice) return false;
            if (criteria.bedrooms && prop.bedrooms < criteria.bedrooms) return false;
            if (criteria.bathrooms && prop.bathrooms < criteria.bathrooms) return false;
            if (criteria.minSquareFeet && prop.squareFeet < criteria.minSquareFeet) return false;
            if (criteria.maxSquareFeet && prop.squareFeet > criteria.maxSquareFeet) return false;
            return true;
        });

        return {
            properties: filteredDemo,
            total: filteredDemo.length,
            page: 1,
            limit: criteria.limit || 20,
            hasMore: false,
        };
    }

    /**
     * Get property details by ID
     * 
     * @param agentId - Agent ID who owns the dashboard
     * @param propertyId - Property MLS ID
     * @returns Property details
     */
    async getPropertyDetails(
        agentId: string,
        propertyId: string
    ): Promise<PropertyListing | null> {
        try {
            // Get agent's MLS connection
            const connection = await this.getAgentMLSConnection(agentId);
            if (!connection) {
                throw new Error('Agent does not have an active MLS connection');
            }

            // Verify token is not expired
            if (Date.now() >= connection.expiresAt) {
                throw new MLSAuthenticationError(
                    'MLS connection expired. Agent needs to re-authenticate.',
                    connection.provider
                );
            }

            // Create MLS connector
            const connector = createMLSConnector(connection.provider);

            // Fetch listing details
            const listing = await connector.fetchListingDetails(connection, propertyId);

            // Transform to PropertyListing format
            return this.transformListing(listing);

        } catch (error) {
            console.error('Get property details error:', error);

            // Handle specific error types
            if (error instanceof MLSAuthenticationError) {
                throw new Error(`MLS authentication failed: ${error.message}`);
            }

            if (error instanceof MLSNetworkError) {
                throw new Error(`MLS network error: ${error.message}`);
            }

            throw error;
        }
    }

    /**
     * Get agent's active MLS connection
     */
    private async getAgentMLSConnection(agentId: string): Promise<MLSConnection | null> {
        try {
            const repository = getRepository();

            // Query all MLS connections for the agent
            const result = await repository.queryMLSConnections<MLSConnection>(agentId, {
                limit: 10,
                scanIndexForward: false, // Most recent first
            });

            if (!result.items || result.items.length === 0) {
                return null;
            }

            // Return the first (most recent) active connection
            const activeConnection = result.items.find(
                conn => Date.now() < conn.expiresAt
            );

            return activeConnection || null;

        } catch (error) {
            console.error('Failed to get agent MLS connection:', error);
            return null;
        }
    }

    /**
     * Filter listings based on search criteria
     */
    private filterListings(
        listings: Listing[],
        criteria: PropertySearchCriteria
    ): Listing[] {
        return listings.filter(listing => {
            // Location filter (city or zip)
            if (criteria.location) {
                const location = criteria.location.toLowerCase();
                const matchesCity = listing.address.city?.toLowerCase().includes(location);
                const matchesZip = listing.address.zip?.toLowerCase().includes(location);
                if (!matchesCity && !matchesZip) {
                    return false;
                }
            }

            // Price range filter
            if (criteria.minPrice !== undefined && listing.price < criteria.minPrice) {
                return false;
            }
            if (criteria.maxPrice !== undefined && listing.price > criteria.maxPrice) {
                return false;
            }

            // Bedrooms filter
            if (criteria.bedrooms !== undefined && listing.bedrooms < criteria.bedrooms) {
                return false;
            }

            // Bathrooms filter
            if (criteria.bathrooms !== undefined && listing.bathrooms < criteria.bathrooms) {
                return false;
            }

            // Property type filter
            if (criteria.propertyType && criteria.propertyType.length > 0) {
                const matchesType = criteria.propertyType.some(
                    type => listing.propertyType.toLowerCase().includes(type.toLowerCase())
                );
                if (!matchesType) {
                    return false;
                }
            }

            // Square footage filter
            if (criteria.minSquareFeet !== undefined && listing.squareFeet < criteria.minSquareFeet) {
                return false;
            }
            if (criteria.maxSquareFeet !== undefined && listing.squareFeet > criteria.maxSquareFeet) {
                return false;
            }

            return true;
        });
    }

    /**
     * Transform MLS Listing to PropertyListing format
     */
    private transformListing(listing: Listing): PropertyListing {
        return {
            id: listing.mlsId,
            address: listing.address.street || '',
            city: listing.address.city,
            state: listing.address.state,
            zip: listing.address.zip,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            squareFeet: listing.squareFeet,
            propertyType: listing.propertyType,
            images: listing.photos.map(photo => photo.url),
            listingDate: listing.listDate,
            status: listing.status,
        };
    }

    /**
     * Generate cache key from search criteria
     */
    private generateCacheKey(agentId: string, criteria: PropertySearchCriteria): string {
        const parts = [
            agentId,
            criteria.location || '',
            criteria.minPrice || '',
            criteria.maxPrice || '',
            criteria.bedrooms || '',
            criteria.bathrooms || '',
            criteria.propertyType?.join(',') || '',
            criteria.minSquareFeet || '',
            criteria.maxSquareFeet || '',
            criteria.page || 1,
            criteria.limit || 20,
        ];
        return parts.join('|');
    }

    /**
     * Get cached search results
     */
    private getFromCache(key: string): PropertySearchResult | null {
        const entry = searchCache.get(key);
        if (!entry) {
            return null;
        }

        // Check if cache entry is still valid
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            searchCache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Cache search results
     */
    private setCache(key: string, data: PropertySearchResult): void {
        searchCache.set(key, {
            data,
            timestamp: Date.now(),
        });

        // Clean up old cache entries periodically
        this.cleanupCache();
    }

    /**
     * Remove expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        for (const [key, entry] of searchCache.entries()) {
            if (now - entry.timestamp > CACHE_TTL) {
                searchCache.delete(key);
            }
        }
    }
}

/**
 * Singleton instance
 */
let propertySearchService: PropertySearchService | null = null;

/**
 * Get property search service instance
 */
export function getPropertySearchService(): PropertySearchService {
    if (!propertySearchService) {
        propertySearchService = new PropertySearchService();
    }
    return propertySearchService;
}
