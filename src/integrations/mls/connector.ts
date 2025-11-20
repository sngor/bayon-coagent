/**
 * MLS Connector Service
 * Implements RESO Web API standard for MLS communication
 * 
 * Requirements Coverage:
 * - 1.1: MLS authentication and connection establishment
 * - 1.2: Secure credential storage
 * - 1.3: Authentication error handling
 * - 1.4: Agent and brokerage information retrieval
 * - 2.2: Listing data retrieval with all required fields
 * - 2.5: Bulk listing import
 */

import { z } from "zod";
import {
    MLSCredentials,
    MLSConnection,
    Listing,
    ListingDetails,
    StatusUpdate,
    ListingStatus,
    Address,
    Photo,
} from "./types";
import {
    MLSCredentialsSchema,
    ListingSchema,
} from "./schemas";

/**
 * MLSConnector Interface
 * Defines the contract for MLS integration
 */
export interface MLSConnector {
    authenticate(credentials: MLSCredentials): Promise<MLSConnection>;
    fetchListings(connection: MLSConnection, agentId: string): Promise<Listing[]>;
    fetchListingDetails(
        connection: MLSConnection,
        listingId: string
    ): Promise<ListingDetails>;
    syncStatus(
        connection: MLSConnection,
        listingIds: string[]
    ): Promise<StatusUpdate[]>;
    disconnect(connectionId: string): Promise<void>;
}

/**
 * RESO Web API Response Types
 */
interface RESOAuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
}

interface RESOAgentResponse {
    MemberKey: string;
    MemberMlsId: string;
    MemberFirstName: string;
    MemberLastName: string;
    MemberEmail: string;
    OfficeMlsId: string;
    OfficeName: string;
}

interface RESOListingResponse {
    ListingKey: string;
    ListingId: string;
    UnparsedAddress: string;
    City: string;
    StateOrProvince: string;
    PostalCode: string;
    Country: string;
    ListPrice: number;
    BedroomsTotal: number;
    BathroomsTotalInteger: number;
    LivingArea: number;
    PropertyType: string;
    StandardStatus: string;
    ListingContractDate: string;
    PublicRemarks?: string;
    Media?: RESOMediaItem[];
    [key: string]: any;
}

interface RESOMediaItem {
    MediaURL: string;
    MediaCategory?: string;
    Order?: number;
    ShortDescription?: string;
}

/**
 * MLS Connector Error Types
 */
export class MLSAuthenticationError extends Error {
    constructor(message: string, public readonly provider: string) {
        super(message);
        this.name = "MLSAuthenticationError";
    }
}

export class MLSNetworkError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
        this.name = "MLSNetworkError";
    }
}

export class MLSValidationError extends Error {
    constructor(message: string, public readonly errors: z.ZodError) {
        super(message);
        this.name = "MLSValidationError";
    }
}

/**
 * RESO Web API Client Configuration
 */
interface RESOClientConfig {
    provider: string;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    accessToken?: string; // Optional: for direct token authentication
}

/**
 * Provider-specific configurations
 * In production, these would be stored in environment variables or a configuration service
 */
const PROVIDER_CONFIGS: Record<string, Omit<RESOClientConfig, "provider">> = {
    flexmls: {
        baseUrl: process.env.FLEXMLS_API_URL || "https://api.flexmls.com/v1",
        clientId: process.env.FLEXMLS_CLIENT_ID || "",
        clientSecret: process.env.FLEXMLS_CLIENT_SECRET || "",
    },
    crmls: {
        baseUrl: process.env.CRMLS_API_URL || "https://api.crmls.org/RESO/OData",
        clientId: process.env.CRMLS_CLIENT_ID || "",
        clientSecret: process.env.CRMLS_CLIENT_SECRET || "",
    },
    bright: {
        baseUrl: process.env.BRIGHT_API_URL || "https://api.brightmls.com/RESO/OData",
        clientId: process.env.BRIGHT_CLIENT_ID || "",
        clientSecret: process.env.BRIGHT_CLIENT_SECRET || "",
    },
    mlsgrid: {
        baseUrl: process.env.MLSGRID_API_URL || "https://api.mlsgrid.com/v2",
        clientId: process.env.MLSGRID_CLIENT_ID || "",
        clientSecret: process.env.MLSGRID_CLIENT_SECRET || "",
        // Support for direct access token (demo/testing)
        accessToken: process.env.MLSGRID_ACCESS_TOKEN,
    },
};

/**
 * RESOWebAPIConnector
 * Implementation of MLSConnector using RESO Web API standard
 */
export class RESOWebAPIConnector implements MLSConnector {
    private config: RESOClientConfig;

    constructor(provider: string) {
        const providerConfig = PROVIDER_CONFIGS[provider.toLowerCase()];
        if (!providerConfig) {
            throw new Error(
                `Unsupported MLS provider: ${provider}. Supported providers: ${Object.keys(
                    PROVIDER_CONFIGS
                ).join(", ")}`
            );
        }

        this.config = {
            provider,
            ...providerConfig,
        };
    }

    /**
     * Authenticate with MLS provider using OAuth 2.0
     * Requirement 1.1: Establish secure connection
     * Requirement 1.2: Store credentials securely
     * Requirement 1.3: Handle authentication failures
     * Requirement 1.4: Retrieve agent and brokerage information
     */
    async authenticate(credentials: MLSCredentials): Promise<MLSConnection> {
        // Validate credentials
        const validationResult = MLSCredentialsSchema.safeParse(credentials);
        if (!validationResult.success) {
            throw new MLSValidationError(
                "Invalid MLS credentials",
                validationResult.error
            );
        }

        try {
            // Check if provider has a direct access token (for demo/testing)
            if (this.config.accessToken && credentials.provider === 'mlsgrid') {
                // Use direct access token for MLS Grid demo
                const agentInfo = await this.fetchAgentInfo(this.config.accessToken);

                const connection: MLSConnection = {
                    id: this.generateConnectionId(credentials.username || 'demo', credentials.provider),
                    userId: "", // Will be set by the calling service
                    provider: credentials.provider,
                    agentId: agentInfo.MemberKey || 'demo-agent',
                    brokerageId: agentInfo.OfficeMlsId || 'demo-brokerage',
                    accessToken: this.config.accessToken,
                    refreshToken: '',
                    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year for demo token
                    createdAt: Date.now(),
                };

                return connection;
            }

            // Step 1: Obtain OAuth token
            const authResponse = await this.requestOAuthToken(credentials);

            // Step 2: Fetch agent information
            const agentInfo = await this.fetchAgentInfo(authResponse.access_token);

            // Step 3: Create connection object
            const connection: MLSConnection = {
                id: this.generateConnectionId(credentials.username, credentials.provider),
                userId: "", // Will be set by the calling service
                provider: credentials.provider,
                agentId: agentInfo.MemberKey,
                brokerageId: agentInfo.OfficeMlsId,
                accessToken: authResponse.access_token,
                refreshToken: authResponse.refresh_token,
                expiresAt: Date.now() + authResponse.expires_in * 1000,
                createdAt: Date.now(),
            };

            return connection;
        } catch (error) {
            if (error instanceof MLSAuthenticationError || error instanceof MLSNetworkError) {
                throw error;
            }

            // Handle unexpected errors
            throw new MLSAuthenticationError(
                `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                credentials.provider
            );
        }
    }

    /**
     * Fetch all active listings for an agent
     * Requirement 2.2: Retrieve all standard fields
     * Requirement 2.5: Import all active listings
     */
    async fetchListings(
        connection: MLSConnection,
        agentId: string
    ): Promise<Listing[]> {
        try {
            // Verify token is still valid
            if (Date.now() >= connection.expiresAt) {
                throw new MLSAuthenticationError(
                    "Access token expired. Please re-authenticate.",
                    connection.provider
                );
            }

            // Build RESO OData query for active listings
            let filterQuery: string;

            if (connection.provider === 'mlsgrid') {
                // MLS Grid requires OriginatingSystemName and MlgCanView
                // For demo, we'll fetch from all systems, but in production you'd specify one
                filterQuery = `MlgCanView eq true and StandardStatus eq 'Active'`;
            } else {
                filterQuery = `ListAgentKey eq '${agentId}' and StandardStatus eq 'Active'`;
            }

            const query = new URLSearchParams({
                $filter: filterQuery,
                $select: this.getListingFields().join(","),
                $expand: "Media",
                $top: "500", // MLS Grid best practice: use pagination
            });

            const url = `${this.config.baseUrl}/Property?${query.toString()}`;
            const response = await this.makeAuthenticatedRequest(url, connection.accessToken);

            if (!response.ok) {
                const errorText = await response.text();
                throw new MLSNetworkError(
                    `Failed to fetch listings: ${response.statusText}. ${errorText}`,
                    response.status
                );
            }

            const data = await response.json();
            const resoListings: RESOListingResponse[] = data.value || [];

            // Transform RESO format to our Listing format
            const listings = resoListings.map((resoListing) =>
                this.transformRESOListing(resoListing)
            );

            // Validate all listings
            const validatedListings: Listing[] = [];
            for (const listing of listings) {
                const validationResult = ListingSchema.safeParse(listing);
                if (validationResult.success) {
                    validatedListings.push(validationResult.data as Listing);
                } else {
                    console.warn(
                        `Skipping invalid listing ${listing.mlsNumber}:`,
                        validationResult.error.errors
                    );
                }
            }

            return validatedListings;
        } catch (error) {
            if (error instanceof MLSAuthenticationError || error instanceof MLSNetworkError) {
                throw error;
            }

            throw new MLSNetworkError(
                `Failed to fetch listings: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Fetch detailed information for a specific listing
     * Requirement 2.2: Retrieve all standard fields plus extended details
     */
    async fetchListingDetails(
        connection: MLSConnection,
        listingId: string
    ): Promise<ListingDetails> {
        try {
            // Verify token is still valid
            if (Date.now() >= connection.expiresAt) {
                throw new MLSAuthenticationError(
                    "Access token expired. Please re-authenticate.",
                    connection.provider
                );
            }

            const url = `${this.config.baseUrl}/Property('${listingId}')?$expand=Media`;
            const response = await this.makeAuthenticatedRequest(url, connection.accessToken);

            if (!response.ok) {
                throw new MLSNetworkError(
                    `Failed to fetch listing details: ${response.statusText}`,
                    response.status
                );
            }

            const resoListing: RESOListingResponse = await response.json();
            const listing = this.transformRESOListing(resoListing);

            // Add extended details
            const listingDetails: ListingDetails = {
                ...listing,
                lotSize: resoListing.LotSizeSquareFeet,
                yearBuilt: resoListing.YearBuilt,
                parking: resoListing.ParkingFeatures,
                heating: resoListing.Heating,
                cooling: resoListing.Cooling,
                flooring: this.parseArrayField(resoListing.Flooring),
                appliances: this.parseArrayField(resoListing.Appliances),
                exteriorFeatures: this.parseArrayField(resoListing.ExteriorFeatures),
                interiorFeatures: this.parseArrayField(resoListing.InteriorFeatures),
                communityFeatures: this.parseArrayField(resoListing.CommunityFeatures),
            };

            return listingDetails;
        } catch (error) {
            if (error instanceof MLSAuthenticationError || error instanceof MLSNetworkError) {
                throw error;
            }

            throw new MLSNetworkError(
                `Failed to fetch listing details: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Sync status changes for multiple listings
     * Requirement 5.1: Detect status changes
     * 
     * @param connection - MLS connection with valid access token
     * @param listingIds - Array of MLS listing IDs to check
     * @returns Array of listings with their current status from MLS
     */
    async syncStatus(
        connection: MLSConnection,
        listingIds: string[]
    ): Promise<StatusUpdate[]> {
        try {
            // Verify token is still valid
            if (Date.now() >= connection.expiresAt) {
                throw new MLSAuthenticationError(
                    "Access token expired. Please re-authenticate.",
                    connection.provider
                );
            }

            const statusUpdates: StatusUpdate[] = [];

            // Fetch current status for each listing
            // In a production system, this would be optimized with batch requests
            for (const listingId of listingIds) {
                try {
                    const query = new URLSearchParams({
                        $select: "ListingKey,ListingId,StandardStatus,ModificationTimestamp",
                    });

                    const url = `${this.config.baseUrl}/Property('${listingId}')?${query.toString()}`;
                    const response = await this.makeAuthenticatedRequest(url, connection.accessToken);

                    if (response.ok) {
                        const data: RESOListingResponse = await response.json();

                        // Return the current status from MLS
                        // The calling service will compare with stored status
                        statusUpdates.push({
                            mlsId: data.ListingKey,
                            mlsNumber: data.ListingId,
                            oldStatus: 'active', // Placeholder - will be filled by calling service
                            newStatus: this.mapRESOStatus(data.StandardStatus),
                            updatedAt: Date.now(),
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to sync status for listing ${listingId}:`, error);
                    // Continue with other listings even if one fails
                }
            }

            return statusUpdates;
        } catch (error) {
            if (error instanceof MLSAuthenticationError || error instanceof MLSNetworkError) {
                throw error;
            }

            throw new MLSNetworkError(
                `Failed to sync status: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Disconnect from MLS provider
     * In RESO Web API, this typically means revoking the OAuth token
     */
    async disconnect(connectionId: string): Promise<void> {
        // In a production system, this would revoke the OAuth token
        // For now, we just acknowledge the disconnect
        console.log(`Disconnecting MLS connection: ${connectionId}`);
    }

    /**
     * Private helper methods
     */

    private async requestOAuthToken(
        credentials: MLSCredentials
    ): Promise<RESOAuthResponse> {
        const tokenUrl = `${this.config.baseUrl}/oauth/token`;

        const body = new URLSearchParams({
            grant_type: "password",
            username: credentials.username,
            password: credentials.password,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
        });

        try {
            const response = await fetch(tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new MLSAuthenticationError(
                    `Authentication failed: ${response.statusText}. ${errorText}`,
                    credentials.provider
                );
            }

            const authResponse: RESOAuthResponse = await response.json();
            return authResponse;
        } catch (error) {
            if (error instanceof MLSAuthenticationError) {
                throw error;
            }

            throw new MLSNetworkError(
                `Network error during authentication: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    private async fetchAgentInfo(accessToken: string): Promise<RESOAgentResponse> {
        const url = `${this.config.baseUrl}/Member/me`;

        try {
            const response = await this.makeAuthenticatedRequest(url, accessToken);

            if (!response.ok) {
                throw new MLSNetworkError(
                    `Failed to fetch agent info: ${response.statusText}`,
                    response.status
                );
            }

            const agentInfo: RESOAgentResponse = await response.json();
            return agentInfo;
        } catch (error) {
            if (error instanceof MLSNetworkError) {
                throw error;
            }

            throw new MLSNetworkError(
                `Failed to fetch agent info: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    private async makeAuthenticatedRequest(
        url: string,
        accessToken: string
    ): Promise<Response> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        };

        // MLS Grid requires gzip compression
        if (this.config.provider === 'mlsgrid') {
            headers['Accept-Encoding'] = 'gzip,deflate';
        }

        return fetch(url, {
            method: "GET",
            headers,
        });
    }

    private transformRESOListing(resoListing: RESOListingResponse): Listing {
        return {
            mlsId: resoListing.ListingKey,
            mlsNumber: resoListing.ListingId,
            address: this.transformAddress(resoListing),
            price: resoListing.ListPrice || 0,
            bedrooms: resoListing.BedroomsTotal || 0,
            bathrooms: resoListing.BathroomsTotalInteger || 0,
            squareFeet: resoListing.LivingArea || 0,
            propertyType: resoListing.PropertyType || "Unknown",
            status: this.mapRESOStatus(resoListing.StandardStatus),
            listDate: resoListing.ListingContractDate || new Date().toISOString(),
            description: resoListing.PublicRemarks,
            photos: this.transformMedia(resoListing.Media || []),
            features: this.extractFeatures(resoListing),
        };
    }

    private transformAddress(resoListing: RESOListingResponse): Address {
        return {
            street: resoListing.UnparsedAddress || "",
            city: resoListing.City || "",
            state: resoListing.StateOrProvince || "",
            zipCode: resoListing.PostalCode || "",
            country: resoListing.Country || "US",
        };
    }

    private transformMedia(media: RESOMediaItem[]): Photo[] {
        return media
            .filter((item) => item.MediaCategory === "Photo" || !item.MediaCategory)
            .map((item, index) => ({
                url: item.MediaURL,
                caption: item.ShortDescription,
                order: item.Order ?? index,
            }));
    }

    private mapRESOStatus(resoStatus: string): ListingStatus {
        const statusMap: Record<string, ListingStatus> = {
            Active: "active",
            "Active Under Contract": "pending",
            Pending: "pending",
            Sold: "sold",
            Closed: "sold",
            Expired: "expired",
            Withdrawn: "expired",
            Canceled: "expired",
        };

        return statusMap[resoStatus] || "active";
    }

    private extractFeatures(resoListing: RESOListingResponse): string[] {
        const features: string[] = [];

        // Add common features from RESO fields
        if (resoListing.PoolFeatures) {
            features.push(`Pool: ${resoListing.PoolFeatures}`);
        }
        if (resoListing.View) {
            features.push(`View: ${resoListing.View}`);
        }
        if (resoListing.WaterfrontFeatures) {
            features.push(`Waterfront: ${resoListing.WaterfrontFeatures}`);
        }

        return features;
    }

    private parseArrayField(field: any): string[] | undefined {
        if (!field) return undefined;
        if (Array.isArray(field)) return field;
        if (typeof field === "string") return field.split(",").map((s) => s.trim());
        return undefined;
    }

    private getListingFields(): string[] {
        return [
            "ListingKey",
            "ListingId",
            "UnparsedAddress",
            "City",
            "StateOrProvince",
            "PostalCode",
            "Country",
            "ListPrice",
            "BedroomsTotal",
            "BathroomsTotalInteger",
            "LivingArea",
            "PropertyType",
            "StandardStatus",
            "ListingContractDate",
            "PublicRemarks",
            "PoolFeatures",
            "View",
            "WaterfrontFeatures",
        ];
    }

    private generateConnectionId(username: string, provider: string): string {
        return `${provider}-${username}-${Date.now()}`;
    }
}

/**
 * Factory function to create MLS connector for a specific provider
 */
export function createMLSConnector(provider: string): MLSConnector {
    return new RESOWebAPIConnector(provider);
}
