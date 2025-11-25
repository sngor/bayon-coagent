# Client Dashboard Property Search Service

This service provides property search functionality for client dashboards by leveraging the existing MLS connection infrastructure from agent accounts.

## Overview

The Property Search Service allows agents to provide their clients with a branded property search experience through client dashboards. It uses the agent's MLS credentials to fetch and filter property listings, with built-in caching for performance.

## Features

- **MLS Integration**: Leverages existing MLS connection infrastructure
- **Advanced Filtering**: Filter by location, price, bedrooms, bathrooms, property type, and square footage
- **Pagination**: Built-in pagination support for large result sets
- **Caching**: 5-minute TTL cache for search results to improve performance
- **Error Handling**: Comprehensive error handling for MLS authentication and network issues

## Usage

### Basic Search

```typescript
import { getPropertySearchService } from "@/lib/client-dashboard/property-search";

const service = getPropertySearchService();

// Search properties for an agent's client
const results = await service.searchProperties("agent-123", {
  location: "Austin",
  minPrice: 300000,
  maxPrice: 500000,
  bedrooms: 3,
  page: 1,
  limit: 20,
});

console.log(`Found ${results.total} properties`);
console.log(
  `Showing page ${results.page} of ${Math.ceil(results.total / results.limit)}`
);
```

### Get Property Details

```typescript
const property = await service.getPropertyDetails(
  "agent-123",
  "mls-property-id"
);

if (property) {
  console.log(`${property.address}, ${property.city}, ${property.state}`);
  console.log(`Price: $${property.price.toLocaleString()}`);
  console.log(`${property.bedrooms} beds, ${property.bathrooms} baths`);
}
```

## Search Criteria

The `PropertySearchCriteria` interface supports the following filters:

| Field           | Type       | Description                                                |
| --------------- | ---------- | ---------------------------------------------------------- |
| `location`      | `string`   | City or ZIP code to search in                              |
| `minPrice`      | `number`   | Minimum property price                                     |
| `maxPrice`      | `number`   | Maximum property price                                     |
| `bedrooms`      | `number`   | Minimum number of bedrooms                                 |
| `bathrooms`     | `number`   | Minimum number of bathrooms                                |
| `propertyType`  | `string[]` | Array of property types (e.g., ['Single Family', 'Condo']) |
| `minSquareFeet` | `number`   | Minimum square footage                                     |
| `maxSquareFeet` | `number`   | Maximum square footage                                     |
| `page`          | `number`   | Page number for pagination (default: 1)                    |
| `limit`         | `number`   | Results per page (default: 20)                             |

## Response Format

### PropertySearchResult

```typescript
{
    properties: PropertyListing[];  // Array of property listings
    total: number;                  // Total number of matching properties
    page: number;                   // Current page number
    limit: number;                  // Results per page
    hasMore: boolean;               // Whether more results are available
}
```

### PropertyListing

```typescript
{
    id: string;                     // MLS property ID
    address: string;                // Street address
    city: string;                   // City
    state: string;                  // State
    zip: string;                    // ZIP code
    price: number;                  // Listing price
    bedrooms: number;               // Number of bedrooms
    bathrooms: number;              // Number of bathrooms
    squareFeet: number;             // Square footage
    propertyType: string;           // Property type
    images: string[];               // Array of image URLs
    listingDate: string;            // Listing date (ISO format)
    status: 'active' | 'pending' | 'sold' | 'expired';
}
```

## Caching

The service implements an in-memory cache with a 5-minute TTL to improve performance and reduce MLS API calls. Cache keys are generated based on:

- Agent ID
- All search criteria parameters

The cache automatically cleans up expired entries to prevent memory leaks.

## Error Handling

The service handles the following error scenarios:

1. **No MLS Connection**: Throws error if agent doesn't have an active MLS connection
2. **Expired Connection**: Throws error if agent's MLS token has expired
3. **Authentication Errors**: Catches and re-throws MLS authentication errors
4. **Network Errors**: Catches and re-throws MLS network errors

## Requirements Coverage

This service implements the following requirements from the Client Portal spec:

- **Requirement 4.2**: Property search with filtering by location, price range, bedrooms, bathrooms, property type, and square footage
- **Requirement 4.3**: Display property photos, key details, and contact agent button for each listing

## Integration with Client Dashboard Actions

This service is designed to be called from server actions in `src/app/client-dashboard-actions.ts`:

```typescript
// Example server action
export async function searchPropertiesForDashboard(
  dashboardId: string,
  criteria: PropertySearchCriteria
): Promise<ActionResponse<PropertySearchResult>> {
  try {
    // Get dashboard to find agent ID
    const dashboard = await getDashboard(dashboardId);

    // Use property search service
    const service = getPropertySearchService();
    const results = await service.searchProperties(dashboard.agentId, criteria);

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}
```

## Testing

The service includes comprehensive tests covering:

- Service instantiation
- Method availability
- Search criteria validation
- Property listing structure
- Search result structure
- Cache configuration

Run tests with:

```bash
npm test -- src/lib/client-dashboard/__tests__/property-search.test.ts
```

## Future Enhancements

Potential improvements for future iterations:

1. **Redis Cache**: Replace in-memory cache with Redis for distributed caching
2. **Saved Searches**: Allow clients to save search criteria
3. **Search Alerts**: Notify clients when new properties match their criteria
4. **Advanced Filters**: Add more filters (school districts, HOA fees, etc.)
5. **Map Integration**: Add geographic search with map boundaries
6. **Sorting**: Add sorting options (price, date, size, etc.)
