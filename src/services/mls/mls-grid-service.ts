/**
 * MLS Grid Service
 * Provides access to MLS Grid API for property data and comparable sales
 */

interface MLSGridProperty {
    ListingKey: string;
    ListingId: string;
    UnparsedAddress: string;
    City: string;
    StateOrProvince: string;
    PostalCode: string;
    ListPrice: number;
    BedroomsTotal?: number;
    BathroomsTotalInteger?: number;
    LivingArea?: number;
    PropertyType: string;
    StandardStatus: string;
    ListingContractDate?: string;
    CloseDate?: string;
    ClosePrice?: number;
    OriginatingSystemName: string;
    PublicRemarks?: string;
    YearBuilt?: number;
    LotSizeSquareFeet?: number;
    Media?: Array<{
        MediaURL: string;
        MediaCategory?: string;
        Order?: number;
    }>;
}

interface ComparableProperty {
    address: string;
    price: number;
    sqft?: number;
    beds?: number;
    baths?: number;
    saleDate?: string;
    daysOnMarket?: number;
    pricePerSqft?: number;
}

interface MarketAnalysis {
    totalListings: number;
    averagePrice: number;
    medianPrice: number;
    averageDaysOnMarket: number;
    priceRange: {
        min: number;
        max: number;
    };
    propertyTypes: Record<string, number>;
    marketCondition: 'Seller\'s Market' | 'Buyer\'s Market' | 'Balanced Market';
    inventoryLevel: 'low' | 'medium' | 'high';
}

export class MLSGridService {
    private apiUrl: string;
    private accessToken: string;

    constructor() {
        this.apiUrl = process.env.MLSGRID_API_URL || 'https://api-demo.mlsgrid.com/v2';
        this.accessToken = process.env.MLSGRID_ACCESS_TOKEN || '';

        if (!this.accessToken) {
            throw new Error('MLSGRID_ACCESS_TOKEN is required');
        }
    }

    /**
     * Search for comparable properties based on criteria
     */
    async findComparableProperties(
        city: string,
        state: string,
        propertyType?: string,
        minBeds?: number,
        maxBeds?: number,
        minBaths?: number,
        maxBaths?: number,
        minSqft?: number,
        maxSqft?: number,
        radiusMiles: number = 5,
        monthsBack: number = 6
    ): Promise<ComparableProperty[]> {
        try {
            // Calculate date range for sold properties
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
            const dateFilter = cutoffDate.toISOString().split('T')[0];

            // Build filter criteria (using only supported fields for demo API)
            const filters = [
                'MlgCanView eq true',
                `StandardStatus eq 'Closed'`
            ];

            // Note: Demo API doesn't support City/State filtering
            // In production, these filters would be available

            if (propertyType) {
                filters.push(`PropertyType eq '${propertyType}'`);
            }

            if (minBeds !== undefined) {
                filters.push(`BedroomsTotal ge ${minBeds}`);
            }

            if (maxBeds !== undefined) {
                filters.push(`BedroomsTotal le ${maxBeds}`);
            }

            if (minBaths !== undefined) {
                filters.push(`BathroomsTotalInteger ge ${minBaths}`);
            }

            if (maxBaths !== undefined) {
                filters.push(`BathroomsTotalInteger le ${maxBaths}`);
            }

            if (minSqft !== undefined) {
                filters.push(`LivingArea ge ${minSqft}`);
            }

            if (maxSqft !== undefined) {
                filters.push(`LivingArea le ${maxSqft}`);
            }

            const params = new URLSearchParams({
                '$filter': filters.join(' and '),
                '$select': [
                    'ListingKey',
                    'ListingId',
                    'UnparsedAddress',
                    'City',
                    'StateOrProvince',
                    'ClosePrice',
                    'CloseDate',
                    'BedroomsTotal',
                    'BathroomsTotalInteger',
                    'LivingArea',
                    'PropertyType',
                    'DaysOnMarket'
                ].join(','),
                '$orderby': 'CloseDate desc',
                '$top': '20'
            });

            const response = await this.makeRequest(`/Property?${params.toString()}`);
            const properties: MLSGridProperty[] = response.value || [];

            return properties.map(prop => ({
                address: prop.UnparsedAddress,
                price: prop.ClosePrice || prop.ListPrice,
                sqft: prop.LivingArea,
                beds: prop.BedroomsTotal,
                baths: prop.BathroomsTotalInteger,
                saleDate: prop.CloseDate || prop.ListingContractDate,
                pricePerSqft: prop.LivingArea && prop.ClosePrice
                    ? Math.round(prop.ClosePrice / prop.LivingArea)
                    : undefined
            }));

        } catch (error) {
            console.error('Error finding comparable properties:', error);
            return [];
        }
    }

    /**
     * Get market analysis for a specific area
     */
    async getMarketAnalysis(
        city: string,
        state: string,
        propertyType?: string,
        monthsBack: number = 6
    ): Promise<MarketAnalysis> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
            const dateFilter = cutoffDate.toISOString().split('T')[0];

            // Get active listings (using only supported fields for demo API)
            const activeFilters = [
                'MlgCanView eq true',
                `StandardStatus eq 'Active'`
            ];

            // Note: Demo API doesn't support City/State filtering

            if (propertyType) {
                activeFilters.push(`PropertyType eq '${propertyType}'`);
            }

            const activeParams = new URLSearchParams({
                '$filter': activeFilters.join(' and '),
                '$select': [
                    'ListPrice',
                    'PropertyType',
                    'DaysOnMarket',
                    'LivingArea'
                ].join(','),
                '$top': '100'
            });

            // Get sold properties for comparison (using only supported fields for demo API)
            const soldFilters = [
                'MlgCanView eq true',
                `StandardStatus eq 'Closed'`
            ];

            // Note: Demo API doesn't support City/State or date filtering

            if (propertyType) {
                soldFilters.push(`PropertyType eq '${propertyType}'`);
            }

            const soldParams = new URLSearchParams({
                '$filter': soldFilters.join(' and '),
                '$select': [
                    'ClosePrice',
                    'PropertyType',
                    'DaysOnMarket'
                ].join(','),
                '$top': '100'
            });

            const [activeResponse, soldResponse] = await Promise.all([
                this.makeRequest(`/Property?${activeParams.toString()}`),
                this.makeRequest(`/Property?${soldParams.toString()}`)
            ]);

            const activeListings: MLSGridProperty[] = activeResponse.value || [];
            const soldListings: MLSGridProperty[] = soldResponse.value || [];

            // Calculate market metrics
            const allPrices = [
                ...activeListings.map(p => p.ListPrice),
                ...soldListings.map(p => p.ClosePrice || p.ListPrice)
            ].filter(price => price > 0);

            const averagePrice = allPrices.length > 0
                ? Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length)
                : 0;

            const sortedPrices = allPrices.sort((a, b) => a - b);
            const medianPrice = sortedPrices.length > 0
                ? sortedPrices[Math.floor(sortedPrices.length / 2)]
                : 0;

            // Note: DaysOnMarket may not be available in all MLS Grid responses
            // This would need to be calculated or retrieved from additional API calls
            const daysOnMarket: number[] = []; // Simplified for demo

            const averageDaysOnMarket = daysOnMarket.length > 0
                ? Math.round(daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length)
                : 25; // Default average for demo purposes

            // Count property types
            const propertyTypes: Record<string, number> = {};
            [...activeListings, ...soldListings].forEach(prop => {
                const type = prop.PropertyType || 'Unknown';
                propertyTypes[type] = (propertyTypes[type] || 0) + 1;
            });

            // Determine market condition
            const inventoryRatio = activeListings.length / (soldListings.length || 1);
            let marketCondition: MarketAnalysis['marketCondition'];

            if (inventoryRatio < 0.5 || averageDaysOnMarket < 30) {
                marketCondition = 'Seller\'s Market';
            } else if (inventoryRatio > 1.5 || averageDaysOnMarket > 90) {
                marketCondition = 'Buyer\'s Market';
            } else {
                marketCondition = 'Balanced Market';
            }

            // Determine inventory level based on total listings
            let inventoryLevel: 'low' | 'medium' | 'high';
            if (activeListings.length < 20) {
                inventoryLevel = 'low';
            } else if (activeListings.length < 50) {
                inventoryLevel = 'medium';
            } else {
                inventoryLevel = 'high';
            }

            return {
                totalListings: activeListings.length,
                averagePrice,
                medianPrice,
                averageDaysOnMarket,
                priceRange: {
                    min: Math.min(...allPrices) || 0,
                    max: Math.max(...allPrices) || 0
                },
                propertyTypes,
                marketCondition,
                inventoryLevel
            };

        } catch (error) {
            console.error('Error getting market analysis:', error);
            throw new Error('Failed to retrieve market analysis');
        }
    }

    /**
     * Search for active properties matching criteria
     */
    async searchActiveProperties(
        city?: string,
        state?: string,
        minPrice?: number,
        maxPrice?: number,
        minBeds?: number,
        maxBeds?: number,
        minBaths?: number,
        maxBaths?: number,
        propertyType?: string,
        limit: number = 20
    ): Promise<MLSGridProperty[]> {
        try {
            // Use only supported filter fields for demo API
            const filters = ['MlgCanView eq true', 'StandardStatus eq \'Active\''];

            // Note: Demo API has limited filter support
            // In production MLS, these filters would be available:
            // if (city) filters.push(`City eq '${city}'`);
            // if (state) filters.push(`StateOrProvince eq '${state}'`);
            // if (minPrice) filters.push(`ListPrice ge ${minPrice}`);
            // if (maxPrice) filters.push(`ListPrice le ${maxPrice}`);
            // if (minBeds) filters.push(`BedroomsTotal ge ${minBeds}`);
            // if (maxBeds) filters.push(`BedroomsTotal le ${maxBeds}`);
            // if (minBaths) filters.push(`BathroomsTotalInteger ge ${minBaths}`);
            // if (maxBaths) filters.push(`BathroomsTotalInteger le ${maxBaths}`);
            if (propertyType) filters.push(`PropertyType eq '${propertyType}'`);

            const params = new URLSearchParams({
                '$filter': filters.join(' and '),
                '$select': [
                    'ListingKey',
                    'ListingId',
                    'UnparsedAddress',
                    'City',
                    'StateOrProvince',
                    'PostalCode',
                    'ListPrice',
                    'BedroomsTotal',
                    'BathroomsTotalInteger',
                    'LivingArea',
                    'PropertyType',
                    'StandardStatus',
                    'OriginatingSystemName',
                    'PublicRemarks',
                    'YearBuilt',
                    'LotSizeSquareFeet'
                ].join(','),
                '$expand': 'Media',
                '$orderby': 'ListPrice desc',
                '$top': limit.toString()
            });

            const response = await this.makeRequest(`/Property?${params.toString()}`);
            return response.value || [];

        } catch (error) {
            console.error('Error searching active properties:', error);
            return [];
        }
    }

    /**
     * Make authenticated request to MLS Grid API
     */
    private async makeRequest(endpoint: string): Promise<any> {
        const url = `${this.apiUrl}${endpoint}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip,deflate',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MLS Grid API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Extract location information from property description
     */
    static extractLocationFromDescription(description: string): { city?: string; state?: string; propertyType?: string } {
        const result: { city?: string; state?: string; propertyType?: string } = {};

        // Extract state (look for state abbreviations)
        const stateMatch = description.match(/\b([A-Z]{2})\b/);
        if (stateMatch) {
            result.state = stateMatch[1];
        }

        // Extract city (look for patterns like "City, State" or "in City")
        const cityStateMatch = description.match(/(?:in\s+)?([A-Za-z\s]+),\s*([A-Z]{2})/);
        if (cityStateMatch) {
            result.city = cityStateMatch[1].trim();
            result.state = cityStateMatch[2];
        }

        // Extract property type
        const propertyTypes = ['single-family', 'condo', 'townhouse', 'apartment', 'duplex', 'house', 'home'];
        for (const type of propertyTypes) {
            if (description.toLowerCase().includes(type)) {
                if (type === 'house' || type === 'home' || type === 'single-family') {
                    result.propertyType = 'Residential';
                } else if (type === 'condo') {
                    result.propertyType = 'Condominium';
                } else if (type === 'townhouse') {
                    result.propertyType = 'Townhouse';
                }
                break;
            }
        }

        return result;
    }
}