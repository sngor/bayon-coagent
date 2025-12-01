# Property Search API Reference

## Server Actions for Client Dashboard Property Search

### Overview

These server actions enable clients to search properties and inquire about listings through their personalized dashboard, using the agent's MLS credentials.

---

## 1. searchPropertiesForDashboard

Search for properties using the agent's MLS connection.

### Signature

```typescript
async function searchPropertiesForDashboard(
  token: string,
  criteria: {
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
): Promise<{
  message: string;
  data: {
    properties: PropertyListing[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  } | null;
  errors: any;
}>;
```

### Parameters

- **token** (required): Dashboard access token from URL
- **criteria** (required): Search filters
  - **location**: City or ZIP code
  - **minPrice**: Minimum price in dollars
  - **maxPrice**: Maximum price in dollars
  - **bedrooms**: Minimum number of bedrooms
  - **bathrooms**: Minimum number of bathrooms
  - **propertyType**: Array of property types (e.g., ['single-family', 'condo'])
  - **minSquareFeet**: Minimum square footage
  - **maxSquareFeet**: Maximum square footage
  - **page**: Page number (default: 1)
  - **limit**: Results per page (default: 20)

### Returns

- **message**: 'success' or error message
- **data**: Search results with pagination
  - **properties**: Array of property listings
  - **total**: Total number of matching properties
  - **page**: Current page number
  - **limit**: Results per page
  - **hasMore**: Whether more results are available
- **errors**: Validation or runtime errors

### Example Usage

```typescript
const result = await searchPropertiesForDashboard(token, {
  location: "Austin, TX",
  minPrice: 300000,
  maxPrice: 500000,
  bedrooms: 3,
  bathrooms: 2,
  propertyType: ["single-family"],
  page: 1,
  limit: 20,
});

if (result.message === "success" && result.data) {
  console.log(`Found ${result.data.total} properties`);
  result.data.properties.forEach((property) => {
    console.log(`${property.address} - $${property.price}`);
  });
}
```

---

## 2. getPropertyDetails

Get detailed information for a specific property.

### Signature

```typescript
async function getPropertyDetails(
  token: string,
  propertyId: string
): Promise<{
  message: string;
  data: PropertyListing | null;
  errors: any;
}>;
```

### Parameters

- **token** (required): Dashboard access token from URL
- **propertyId** (required): MLS property ID

### Returns

- **message**: 'success' or error message
- **data**: Detailed property information
- **errors**: Validation or runtime errors

### Example Usage

```typescript
const result = await getPropertyDetails(token, "MLS-12345");

if (result.message === "success" && result.data) {
  const property = result.data;
  console.log(`${property.address}`);
  console.log(`Price: $${property.price}`);
  console.log(`${property.bedrooms} beds, ${property.bathrooms} baths`);
  console.log(`${property.squareFeet} sqft`);
}
```

---

## 3. trackPropertyView

Track when a client views a property (for analytics).

### Signature

```typescript
async function trackPropertyView(
  dashboardId: string,
  propertyId: string
): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors: any;
}>;
```

### Parameters

- **dashboardId** (required): Dashboard identifier
- **propertyId** (required): Property identifier

### Returns

- **message**: 'success' or error message
- **data**: Success confirmation
- **errors**: Validation or runtime errors

### Example Usage

```typescript
// Track when user opens property details
const result = await trackPropertyView(dashboardId, propertyId);

if (result.message === "success") {
  console.log("Property view tracked");
}
```

---

## 4. sendPropertyInquiry

Send an inquiry about a property to the agent via email.

### Signature

```typescript
async function sendPropertyInquiry(
  token: string,
  propertyId: string,
  inquiryMessage: string,
  clientName?: string,
  clientEmail?: string,
  clientPhone?: string
): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors: any;
}>;
```

### Parameters

- **token** (required): Dashboard access token from URL
- **propertyId** (required): Property identifier
- **inquiryMessage** (required): Client's inquiry message
- **clientName** (optional): Client's name (if different from dashboard client)
- **clientEmail** (optional): Client's email for follow-up
- **clientPhone** (optional): Client's phone number

### Returns

- **message**: 'success' or error message
- **data**: Success confirmation
- **errors**: Validation or runtime errors

### Example Usage

```typescript
const result = await sendPropertyInquiry(
  token,
  "MLS-12345",
  "I would like to schedule a showing for this property.",
  "John Doe",
  "john@example.com",
  "555-1234"
);

if (result.message === "success") {
  console.log("Inquiry sent to agent");
}
```

---

## PropertyListing Type

```typescript
interface PropertyListing {
  id: string; // MLS property ID
  address: string; // Street address
  city: string; // City
  state: string; // State abbreviation
  zip: string; // ZIP code
  price: number; // Listing price
  bedrooms: number; // Number of bedrooms
  bathrooms: number; // Number of bathrooms
  squareFeet: number; // Square footage
  propertyType: string; // Property type (e.g., 'single-family')
  images: string[]; // Array of image URLs
  listingDate: string; // ISO date string
  status: string; // 'active', 'pending', 'sold', 'expired'
}
```

---

## Error Handling

All functions return a consistent error format:

```typescript
{
    message: string;        // Error message
    data: null;            // No data on error
    errors: {              // Detailed errors by field
        [field: string]: string[];
    }
}
```

### Common Error Messages

- `'Access token is required'` - Missing or invalid token
- `'Property search is not enabled for this dashboard'` - Feature disabled
- `'Link expired'` - Dashboard link has expired
- `'Link revoked'` - Dashboard link was revoked by agent
- `'Property not found'` - Invalid property ID
- `'MLS authentication failed'` - Agent's MLS connection expired

---

## Notes

1. **Caching**: Search results are cached for 5 minutes to improve performance
2. **Authentication**: All functions validate the dashboard token before proceeding
3. **Analytics**: Property views and inquiries are automatically tracked
4. **Email**: Inquiry emails are sent asynchronously and failures don't block the operation
5. **MLS Access**: All property data comes from the agent's MLS connection

---

## Integration Example

```typescript
'use client';

import { useState } from 'react';
import { searchPropertiesForDashboard, getPropertyDetails, trackPropertyView, sendPropertyInquiry } from '@/app/client-dashboard-actions';

export function PropertySearch({ token }: { token: string }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (criteria) => {
        setLoading(true);
        const result = await searchPropertiesForDashboard(token, criteria);
        if (result.message === 'success' && result.data) {
            setProperties(result.data.properties);
        }
        setLoading(false);
    };

    const handlePropertyClick = async (propertyId) => {
        // Track the view
        await trackPropertyView(dashboardId, propertyId);

        // Get details
        const result = await getPropertyDetails(token, propertyId);
        if (result.message === 'success' && result.data) {
            // Show property details modal
        }
    };

    const handleInquiry = async (propertyId, message) => {
        const result = await sendPropertyInquiry(
            token,
            propertyId,
            message,
            'John Doe',
            'john@example.com'
        );

        if (result.message === 'success') {
            // Show success message
        }
    };

    return (
        // UI components
    );
}
```
