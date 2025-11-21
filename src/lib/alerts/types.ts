/**
 * Market Intelligence Alerts - Type Definitions
 * 
 * Defines TypeScript types for all alert-related data structures
 * including alerts, settings, and neighborhood profiles.
 */

// ==================== Alert Types ====================

export type AlertType =
    | "life-event-lead"
    | "competitor-new-listing"
    | "competitor-price-reduction"
    | "competitor-withdrawal"
    | "neighborhood-trend"
    | "price-reduction";

export type AlertPriority = "high" | "medium" | "low";

export type AlertStatus = "unread" | "read" | "dismissed" | "archived";

export interface BaseAlert {
    id: string;
    userId: string;
    type: AlertType;
    priority: AlertPriority;
    status: AlertStatus;
    createdAt: string;
    readAt?: string;
    dismissedAt?: string;
}

export interface LifeEventAlert extends BaseAlert {
    type: "life-event-lead";
    data: {
        prospectLocation: string;
        eventType:
        | "marriage"
        | "divorce"
        | "job-change"
        | "retirement"
        | "birth"
        | "death";
        eventDate: string;
        leadScore: number;
        recommendedAction: string;
        additionalEvents?: string[];
    };
}

export interface CompetitorAlert extends BaseAlert {
    type:
    | "competitor-new-listing"
    | "competitor-price-reduction"
    | "competitor-withdrawal";
    data: {
        competitorName: string;
        propertyAddress: string;
        listingPrice?: number;
        originalPrice?: number;
        newPrice?: number;
        priceReduction?: number;
        priceReductionPercent?: number;
        daysOnMarket?: number;
    };
}

export interface NeighborhoodTrendAlert extends BaseAlert {
    type: "neighborhood-trend";
    data: {
        neighborhood: string;
        trendType: "price-increase" | "inventory-decrease" | "dom-decrease";
        currentValue: number;
        previousValue: number;
        changePercent: number;
        historicalContext: {
            avg90Day: number;
            avg365Day: number;
        };
    };
}

export interface PriceReductionAlert extends BaseAlert {
    type: "price-reduction";
    data: {
        propertyAddress: string;
        originalPrice: number;
        newPrice: number;
        priceReduction: number;
        priceReductionPercent: number;
        daysOnMarket: number;
        propertyDetails: {
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            propertyType: string;
        };
    };
}

export type Alert =
    | LifeEventAlert
    | CompetitorAlert
    | NeighborhoodTrendAlert
    | PriceReductionAlert;

// ==================== Alert Settings ====================

export interface AlertSettings {
    userId: string;
    enabledAlertTypes: AlertType[];
    frequency: "real-time" | "daily" | "weekly";
    digestTime?: string; // HH:MM format for daily/weekly digests
    leadScoreThreshold: number; // 50-90
    priceRangeFilters?: {
        min?: number;
        max?: number;
    };
    targetAreas: TargetArea[];
    trackedCompetitors: string[]; // Competitor IDs
    updatedAt: string;
}

export interface TargetArea {
    id: string;
    type: "zip" | "city" | "polygon";
    value: string | GeoPolygon;
    label: string;
}

export interface GeoPolygon {
    coordinates: Array<{ lat: number; lng: number }>;
}

// ==================== Neighborhood Profile ====================

export interface NeighborhoodProfile {
    id: string;
    userId: string;
    location: string;
    generatedAt: string;

    marketData: {
        medianSalePrice: number;
        avgDaysOnMarket: number;
        salesVolume: number;
        inventoryLevel: number;
        priceHistory: Array<{
            month: string;
            medianPrice: number;
        }>;
    };

    demographics: {
        population: number;
        medianHouseholdIncome: number;
        ageDistribution: {
            under18: number;
            age18to34: number;
            age35to54: number;
            age55to74: number;
            over75: number;
        };
        householdComposition: {
            familyHouseholds: number;
            nonFamilyHouseholds: number;
            averageHouseholdSize: number;
        };
    };

    schools: Array<{
        name: string;
        type: "public" | "private";
        grades: string;
        rating: number; // 1-10
        distance: number; // miles
    }>;

    amenities: {
        restaurants: Array<{ name: string; category: string; distance: number }>;
        shopping: Array<{ name: string; category: string; distance: number }>;
        parks: Array<{ name: string; distance: number }>;
        healthcare: Array<{ name: string; type: string; distance: number }>;
        entertainment: Array<{ name: string; category: string; distance: number }>;
    };

    walkabilityScore: number; // 0-100

    aiInsights: string; // Generated narrative

    exportUrls?: {
        pdf?: string;
        html?: string;
    };
}

// ==================== Life Event Analysis ====================

export interface LifeEvent {
    id: string;
    personId: string;
    eventType: "marriage" | "divorce" | "job-change" | "retirement" | "birth" | "death";
    eventDate: string;
    location: string;
    confidence: number; // 0-100
    source: string;
    additionalData?: Record<string, any>;
}

export interface Prospect {
    id: string;
    location: string;
    events: LifeEvent[];
    leadScore: number;
    lastAnalyzed: string;
}

// ==================== Competitor Monitoring ====================

export interface Competitor {
    id: string;
    name: string;
    agency: string;
    licenseNumber?: string;
    targetAreas: string[];
    isActive: boolean;
    addedAt: string;
}

export interface ListingEvent {
    id: string;
    competitorId: string;
    propertyAddress: string;
    eventType: "new-listing" | "price-reduction" | "withdrawal" | "expiration";
    eventDate: string;
    listingPrice?: number;
    originalPrice?: number;
    newPrice?: number;
    daysOnMarket?: number;
    mlsNumber?: string;
}

// ==================== Trend Analysis ====================

export interface TrendIndicators {
    neighborhood: string;
    period: string; // YYYY-MM format
    medianPrice: number;
    priceChange: number; // percentage
    inventoryLevel: number;
    inventoryChange: number; // percentage
    avgDaysOnMarket: number;
    domChange: number; // percentage
    salesVolume: number;
    calculatedAt: string;
}

export interface MarketData {
    neighborhood: string;
    date: string;
    medianPrice: number;
    inventoryLevel: number;
    avgDaysOnMarket: number;
    salesVolume: number;
}

// ==================== Filter and Query Types ====================

export interface AlertFilters {
    types?: AlertType[];
    status?: AlertStatus[];
    priority?: AlertPriority[];
    dateRange?: {
        start: string;
        end: string;
    };
    searchQuery?: string;
}

export interface AlertQueryOptions {
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "priority" | "type";
    sortOrder?: "asc" | "desc";
}

// ==================== API Response Types ====================

export interface AlertsResponse {
    alerts: Alert[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
}

export interface AlertSettingsResponse {
    settings: AlertSettings;
}

export interface NeighborhoodProfileResponse {
    profile: NeighborhoodProfile;
}

// ==================== External API Data Types ====================

export interface PublicRecordsData {
    personId: string;
    name: string;
    address: string;
    events: Array<{
        type: string;
        date: string;
        details: Record<string, any>;
    }>;
}

export interface MLSListingData {
    mlsNumber: string;
    address: string;
    price: number;
    status: string;
    listDate: string;
    agentId: string;
    agentName: string;
    daysOnMarket: number;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
}

export interface DemographicsData {
    area: string;
    population: number;
    medianIncome: number;
    ageGroups: Record<string, number>;
    householdData: Record<string, number>;
}

export interface SchoolData {
    name: string;
    type: "public" | "private";
    grades: string;
    rating: number;
    address: string;
    distance: number;
}

export interface AmenityData {
    name: string;
    category: string;
    type: string;
    address: string;
    distance: number;
    rating?: number;
}

export interface WalkabilityData {
    score: number;
    description: string;
    factors: {
        walkability: number;
        transitScore: number;
        bikeScore: number;
    };
}