/**
 * MLS Integration Types
 * Core TypeScript interfaces for MLS data structures
 */

export interface MLSCredentials {
    provider: string; // e.g., "flexmls", "crmls", "bright"
    username: string;
    password: string;
    mlsId?: string;
}

export interface MLSConnection {
    id: string;
    userId: string;
    provider: string;
    agentId: string;
    brokerageId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    createdAt: number;
}

export interface Address {
    street?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
}

export interface Photo {
    url: string;
    caption?: string;
    order: number;
}

export type ListingStatus = "active" | "pending" | "sold" | "expired";

export interface Listing {
    listingId?: string; // Internal ID for DynamoDB
    mlsId: string;
    mlsNumber: string;
    address: Address;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType: string;
    status: ListingStatus;
    listDate: string;
    description?: string;
    photos: Photo[];
    features: string[];
}

export interface ListingDetails extends Listing {
    lotSize?: number;
    yearBuilt?: number;
    parking?: string;
    heating?: string;
    cooling?: string;
    flooring?: string[];
    appliances?: string[];
    exteriorFeatures?: string[];
    interiorFeatures?: string[];
    communityFeatures?: string[];
}

export interface StatusUpdate {
    mlsId: string;
    mlsNumber: string;
    oldStatus: ListingStatus;
    newStatus: ListingStatus;
    updatedAt: number;
}
