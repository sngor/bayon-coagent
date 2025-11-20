/**
 * MLS Connector Example Usage
 * Demonstrates how to use the MLS connector service
 */

import {
    createMLSConnector,
    MLSAuthenticationError,
    MLSNetworkError,
    MLSValidationError,
} from "./connector";
import {
    MLSCredentials,
    MLSConnection,
    Listing,
    ListingDetails,
} from "./types";

/**
 * Example 1: Authenticate with MLS Provider
 */
async function exampleAuthentication() {
    console.log("=== Example 1: Authentication ===\n");

    const connector = createMLSConnector("flexmls");

    const credentials: MLSCredentials = {
        provider: "flexmls",
        username: "agent@example.com",
        password: "secure-password",
    };

    try {
        const connection = await connector.authenticate(credentials);

        console.log("✓ Authentication successful!");
        console.log(`  Agent ID: ${connection.agentId}`);
        console.log(`  Brokerage ID: ${connection.brokerageId}`);
        console.log(`  Token expires: ${new Date(connection.expiresAt).toISOString()}`);

        return connection;
    } catch (error) {
        if (error instanceof MLSAuthenticationError) {
            console.error(`✗ Authentication failed for ${error.provider}:`, error.message);
        } else if (error instanceof MLSValidationError) {
            console.error("✗ Invalid credentials:", error.errors);
        } else {
            console.error("✗ Unexpected error:", error);
        }
        throw error;
    }
}

/**
 * Example 2: Fetch All Active Listings
 */
async function exampleFetchListings(connection: MLSConnection) {
    console.log("\n=== Example 2: Fetch Active Listings ===\n");

    const connector = createMLSConnector(connection.provider);

    try {
        const listings = await connector.fetchListings(connection, connection.agentId);

        console.log(`✓ Found ${listings.length} active listings\n`);

        // Display first 3 listings
        listings.slice(0, 3).forEach((listing, index) => {
            console.log(`Listing ${index + 1}:`);
            console.log(`  MLS #: ${listing.mlsNumber}`);
            console.log(`  Address: ${listing.address.street}, ${listing.address.city}`);
            console.log(`  Price: $${listing.price.toLocaleString()}`);
            console.log(`  Beds/Baths: ${listing.bedrooms}/${listing.bathrooms}`);
            console.log(`  Sq Ft: ${listing.squareFeet.toLocaleString()}`);
            console.log(`  Status: ${listing.status}`);
            console.log(`  Photos: ${listing.photos.length}`);
            console.log();
        });

        return listings;
    } catch (error) {
        if (error instanceof MLSAuthenticationError) {
            console.error("✗ Token expired. Please re-authenticate.");
        } else if (error instanceof MLSNetworkError) {
            console.error(`✗ Network error (${error.statusCode}):`, error.message);
        } else {
            console.error("✗ Unexpected error:", error);
        }
        throw error;
    }
}

/**
 * Example 3: Fetch Detailed Listing Information
 */
async function exampleFetchListingDetails(
    connection: MLSConnection,
    listingId: string
) {
    console.log("\n=== Example 3: Fetch Listing Details ===\n");

    const connector = createMLSConnector(connection.provider);

    try {
        const details = await connector.fetchListingDetails(connection, listingId);

        console.log("✓ Listing details retrieved\n");
        console.log(`MLS #: ${details.mlsNumber}`);
        console.log(`Address: ${details.address.street}`);
        console.log(`         ${details.address.city}, ${details.address.state} ${details.address.zipCode}`);
        console.log(`\nBasic Info:`);
        console.log(`  Price: $${details.price.toLocaleString()}`);
        console.log(`  Beds/Baths: ${details.bedrooms}/${details.bathrooms}`);
        console.log(`  Living Area: ${details.squareFeet.toLocaleString()} sq ft`);
        console.log(`  Property Type: ${details.propertyType}`);

        if (details.lotSize) {
            console.log(`  Lot Size: ${details.lotSize.toLocaleString()} sq ft`);
        }
        if (details.yearBuilt) {
            console.log(`  Year Built: ${details.yearBuilt}`);
        }

        console.log(`\nFeatures:`);
        if (details.parking) {
            console.log(`  Parking: ${details.parking}`);
        }
        if (details.heating) {
            console.log(`  Heating: ${details.heating}`);
        }
        if (details.cooling) {
            console.log(`  Cooling: ${details.cooling}`);
        }

        if (details.appliances && details.appliances.length > 0) {
            console.log(`  Appliances: ${details.appliances.join(", ")}`);
        }

        if (details.interiorFeatures && details.interiorFeatures.length > 0) {
            console.log(`  Interior: ${details.interiorFeatures.join(", ")}`);
        }

        if (details.exteriorFeatures && details.exteriorFeatures.length > 0) {
            console.log(`  Exterior: ${details.exteriorFeatures.join(", ")}`);
        }

        console.log(`\nDescription:`);
        console.log(`  ${details.description?.substring(0, 200)}...`);

        return details;
    } catch (error) {
        if (error instanceof MLSAuthenticationError) {
            console.error("✗ Token expired. Please re-authenticate.");
        } else if (error instanceof MLSNetworkError) {
            console.error(`✗ Network error (${error.statusCode}):`, error.message);
        } else {
            console.error("✗ Unexpected error:", error);
        }
        throw error;
    }
}

/**
 * Example 4: Sync Listing Status
 */
async function exampleSyncStatus(
    connection: MLSConnection,
    listingIds: string[]
) {
    console.log("\n=== Example 4: Sync Listing Status ===\n");

    const connector = createMLSConnector(connection.provider);

    try {
        const updates = await connector.syncStatus(connection, listingIds);

        console.log(`✓ Checked ${listingIds.length} listings for status changes\n`);

        if (updates.length === 0) {
            console.log("No status changes detected.");
        } else {
            updates.forEach((update) => {
                console.log(`Listing ${update.mlsNumber}:`);
                console.log(`  ${update.oldStatus} → ${update.newStatus}`);
                console.log(`  Updated: ${new Date(update.updatedAt).toISOString()}`);
                console.log();
            });
        }

        return updates;
    } catch (error) {
        if (error instanceof MLSAuthenticationError) {
            console.error("✗ Token expired. Please re-authenticate.");
        } else if (error instanceof MLSNetworkError) {
            console.error(`✗ Network error (${error.statusCode}):`, error.message);
        } else {
            console.error("✗ Unexpected error:", error);
        }
        throw error;
    }
}

/**
 * Example 5: Handle Token Expiration
 */
async function exampleTokenExpiration() {
    console.log("\n=== Example 5: Token Expiration Handling ===\n");

    const connector = createMLSConnector("flexmls");

    // Create a connection with an expired token
    const expiredConnection: MLSConnection = {
        id: "test-connection",
        userId: "user-123",
        provider: "flexmls",
        agentId: "agent-456",
        brokerageId: "broker-789",
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        createdAt: Date.now() - 3600000, // Created 1 hour ago
    };

    try {
        await connector.fetchListings(expiredConnection, expiredConnection.agentId);
    } catch (error) {
        if (error instanceof MLSAuthenticationError) {
            console.log("✓ Token expiration detected correctly");
            console.log(`  Error: ${error.message}`);
            console.log("\n  In production, you would:");
            console.log("  1. Use the refresh token to get a new access token");
            console.log("  2. Update the connection with new tokens");
            console.log("  3. Retry the request");
        }
    }
}

/**
 * Example 6: Error Handling Best Practices
 */
async function exampleErrorHandling() {
    console.log("\n=== Example 6: Error Handling Best Practices ===\n");

    const connector = createMLSConnector("flexmls");

    const credentials: MLSCredentials = {
        provider: "flexmls",
        username: "test@example.com",
        password: "test-password",
    };

    try {
        const connection = await connector.authenticate(credentials);
        const listings = await connector.fetchListings(connection, connection.agentId);

        console.log(`✓ Successfully fetched ${listings.length} listings`);
    } catch (error) {
        // Handle specific error types
        if (error instanceof MLSAuthenticationError) {
            console.error("Authentication Error:");
            console.error(`  Provider: ${error.provider}`);
            console.error(`  Message: ${error.message}`);
            console.error("  Action: Check credentials and try again");
        } else if (error instanceof MLSNetworkError) {
            console.error("Network Error:");
            console.error(`  Status Code: ${error.statusCode || "N/A"}`);
            console.error(`  Message: ${error.message}`);
            console.error("  Action: Check network connection and MLS API status");
        } else if (error instanceof MLSValidationError) {
            console.error("Validation Error:");
            console.error(`  Message: ${error.message}`);
            console.error("  Errors:", error.errors.errors);
            console.error("  Action: Fix input data and try again");
        } else {
            console.error("Unexpected Error:");
            console.error(error);
            console.error("  Action: Contact support");
        }
    }
}

/**
 * Example 7: Complete Workflow
 */
async function exampleCompleteWorkflow() {
    console.log("\n=== Example 7: Complete Workflow ===\n");

    try {
        // Step 1: Authenticate
        console.log("Step 1: Authenticating...");
        const connection = await exampleAuthentication();

        // Step 2: Fetch listings
        console.log("\nStep 2: Fetching listings...");
        const listings = await exampleFetchListings(connection);

        // Step 3: Get details for first listing
        if (listings.length > 0) {
            console.log("\nStep 3: Fetching details for first listing...");
            await exampleFetchListingDetails(connection, listings[0].mlsId);
        }

        // Step 4: Sync status for all listings
        console.log("\nStep 4: Syncing status...");
        const listingIds = listings.slice(0, 5).map((l) => l.mlsId);
        await exampleSyncStatus(connection, listingIds);

        console.log("\n✓ Complete workflow finished successfully!");
    } catch (error) {
        console.error("\n✗ Workflow failed:", error);
    }
}

/**
 * Run examples
 * Uncomment the example you want to run
 */
async function main() {
    console.log("MLS Connector Example Usage\n");
    console.log("=".repeat(50));

    // Note: These examples require valid MLS credentials
    // and will fail without proper environment configuration

    // await exampleAuthentication();
    // await exampleTokenExpiration();
    // await exampleErrorHandling();
    // await exampleCompleteWorkflow();

    console.log("\nTo run these examples:");
    console.log("1. Set up environment variables for your MLS provider");
    console.log("2. Uncomment the example you want to run");
    console.log("3. Run: tsx src/integrations/mls/example-usage.ts");
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export examples for use in other files
export {
    exampleAuthentication,
    exampleFetchListings,
    exampleFetchListingDetails,
    exampleSyncStatus,
    exampleTokenExpiration,
    exampleErrorHandling,
    exampleCompleteWorkflow,
};
