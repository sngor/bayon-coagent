# MLS Connector Service

The MLS Connector Service provides integration with Multiple Listing Service (MLS) systems using the RESO Web API standard.

## Features

- **RESO Web API Compliance**: Implements the industry-standard RESO Web API for MLS communication
- **OAuth 2.0 Authentication**: Secure authentication with MLS providers
- **Multi-Provider Support**: Supports multiple MLS providers (FlexMLS, CRMLS, BrightMLS)
- **Comprehensive Error Handling**: Specific error types for authentication, network, and validation failures
- **Token Management**: Automatic token expiration checking
- **Data Validation**: Zod schema validation for all data

## Supported Providers

- **FlexMLS**: FBS (Flexmls) MLS system
- **CRMLS**: California Regional MLS
- **BrightMLS**: Mid-Atlantic regional MLS

## Requirements Coverage

This implementation satisfies the following requirements:

- **1.1**: MLS authentication and connection establishment
- **1.2**: Secure credential storage
- **1.3**: Authentication error handling with clear messages
- **1.4**: Agent and brokerage information retrieval
- **2.2**: Listing data retrieval with all required fields
- **2.5**: Bulk listing import for all active listings

## Usage

### Creating a Connector

```typescript
import { createMLSConnector } from "@/integrations/mls";

// Create connector for specific provider
const connector = createMLSConnector("flexmls");
```

### Authentication

```typescript
import { MLSCredentials } from "@/integrations/mls";

const credentials: MLSCredentials = {
  provider: "flexmls",
  username: "agent@example.com",
  password: "secure-password",
  mlsId: "optional-mls-id",
};

try {
  const connection = await connector.authenticate(credentials);
  console.log("Connected:", connection.agentId);
} catch (error) {
  if (error instanceof MLSAuthenticationError) {
    console.error("Authentication failed:", error.message);
  }
}
```

### Fetching Listings

```typescript
// Fetch all active listings for an agent
const listings = await connector.fetchListings(connection, connection.agentId);

console.log(`Found ${listings.length} active listings`);

// Each listing includes:
// - mlsId, mlsNumber
// - address (street, city, state, zipCode, country)
// - price, bedrooms, bathrooms, squareFeet
// - propertyType, status, listDate
// - description, photos, features
```

### Fetching Listing Details

```typescript
// Get detailed information for a specific listing
const details = await connector.fetchListingDetails(connection, "listing-123");

// Extended details include:
// - All standard listing fields
// - lotSize, yearBuilt
// - parking, heating, cooling
// - flooring, appliances
// - exteriorFeatures, interiorFeatures, communityFeatures
```

### Syncing Status

```typescript
// Check for status changes on multiple listings
const listingIds = ["listing-1", "listing-2", "listing-3"];
const updates = await connector.syncStatus(connection, listingIds);

updates.forEach((update) => {
  console.log(
    `Listing ${update.mlsNumber}: ${update.oldStatus} → ${update.newStatus}`
  );
});
```

### Disconnecting

```typescript
// Disconnect from MLS provider
await connector.disconnect(connection.id);
```

## Error Handling

The connector provides three specific error types:

### MLSAuthenticationError

Thrown when authentication fails or tokens expire.

```typescript
try {
  await connector.authenticate(credentials);
} catch (error) {
  if (error instanceof MLSAuthenticationError) {
    console.error(`Auth failed for ${error.provider}: ${error.message}`);
  }
}
```

### MLSNetworkError

Thrown when network requests fail or return error status codes.

```typescript
try {
  await connector.fetchListings(connection, agentId);
} catch (error) {
  if (error instanceof MLSNetworkError) {
    console.error(`Network error (${error.statusCode}): ${error.message}`);
  }
}
```

### MLSValidationError

Thrown when input data fails Zod schema validation.

```typescript
try {
  await connector.authenticate(invalidCredentials);
} catch (error) {
  if (error instanceof MLSValidationError) {
    console.error("Validation errors:", error.errors);
  }
}
```

## Configuration

Provider configurations are loaded from environment variables:

### FlexMLS

```bash
FLEXMLS_API_URL=https://api.flexmls.com/v1
FLEXMLS_CLIENT_ID=your-client-id
FLEXMLS_CLIENT_SECRET=your-client-secret
```

### CRMLS

```bash
CRMLS_API_URL=https://api.crmls.org/RESO/OData
CRMLS_CLIENT_ID=your-client-id
CRMLS_CLIENT_SECRET=your-client-secret
```

### BrightMLS

```bash
BRIGHT_API_URL=https://api.brightmls.com/RESO/OData
BRIGHT_CLIENT_ID=your-client-id
BRIGHT_CLIENT_SECRET=your-client-secret
```

## RESO Web API Standard

The connector implements the RESO (Real Estate Standards Organization) Web API, which provides:

- **Standardized Data Model**: Consistent field names across MLS providers
- **OData Protocol**: RESTful API with powerful query capabilities
- **OAuth 2.0**: Industry-standard authentication
- **Media Support**: Integrated photo and document access

### RESO Field Mappings

| RESO Field            | Our Field       |
| --------------------- | --------------- |
| ListingKey            | mlsId           |
| ListingId             | mlsNumber       |
| UnparsedAddress       | address.street  |
| City                  | address.city    |
| StateOrProvince       | address.state   |
| PostalCode            | address.zipCode |
| ListPrice             | price           |
| BedroomsTotal         | bedrooms        |
| BathroomsTotalInteger | bathrooms       |
| LivingArea            | squareFeet      |
| PropertyType          | propertyType    |
| StandardStatus        | status          |
| ListingContractDate   | listDate        |
| PublicRemarks         | description     |

### Status Mappings

| RESO Status           | Our Status |
| --------------------- | ---------- |
| Active                | active     |
| Active Under Contract | pending    |
| Pending               | pending    |
| Sold                  | sold       |
| Closed                | sold       |
| Expired               | expired    |
| Withdrawn             | expired    |
| Canceled              | expired    |

## Token Management

The connector automatically checks token expiration before making requests:

```typescript
// Tokens are checked before each request
if (Date.now() >= connection.expiresAt) {
  throw new MLSAuthenticationError(
    "Access token expired. Please re-authenticate.",
    connection.provider
  );
}
```

In production, implement automatic token refresh:

```typescript
// Pseudo-code for token refresh
if (isTokenExpiringSoon(connection)) {
  connection = await refreshToken(connection);
}
```

## Testing

Run the connector tests:

```bash
npm test -- src/integrations/mls/__tests__/connector.test.ts
```

The test suite covers:

- Constructor validation
- Credential validation
- Token expiration handling
- Error handling
- Factory function

## Future Enhancements

- **Token Refresh**: Automatic token refresh before expiration
- **Batch Operations**: Optimize status sync with batch requests
- **Caching**: Cache listing data to reduce API calls
- **Rate Limiting**: Respect MLS provider rate limits
- **Webhook Support**: Real-time status updates via webhooks
- **Additional Providers**: Support for more MLS systems

## Related Files

- `types.ts`: TypeScript interfaces
- `schemas.ts`: Zod validation schemas
- `connector.ts`: Main connector implementation
- `__tests__/connector.test.ts`: Unit tests
