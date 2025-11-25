# API Mocking Infrastructure

This directory contains Mock Service Worker (MSW) setup and mock data for testing external APIs used in the Market Intelligence Alerts feature.

## Overview

The API mocking infrastructure provides realistic mock responses for all external services used by the Market Intelligence Alerts system, enabling comprehensive testing without relying on actual external APIs.

## Structure

```
src/__tests__/mocks/
├── README.md                    # This documentation
├── setup.ts                     # MSW server setup and configuration
├── api-mocking.test.ts         # Tests verifying mock functionality
├── handlers/                    # Request handlers for each API
│   ├── index.ts                # Central export of all handlers
│   ├── public-records.ts       # Public records API handlers
│   ├── mls.ts                  # MLS API handlers
│   ├── demographics.ts         # Demographics API handlers
│   ├── schools.ts              # Schools API handlers
│   ├── google-places.ts        # Google Places API handlers
│   └── walk-score.ts           # Walk Score API handlers
└── data/                       # Mock data for each API
    ├── public-records-data.ts  # Life event and property data
    ├── mls-data.ts             # MLS listing and market data
    ├── demographics-data.ts    # Census and demographic data
    ├── schools-data.ts         # School ratings and information
    ├── google-places-data.ts   # Places and amenities data
    └── walk-score-data.ts      # Walkability scores and data
```

## Supported APIs

### 1. Public Records API

**Purpose**: Life event detection for lead scoring

**Endpoints**:

- `GET /life-events` - Get life events for a location
- `GET /marriage-records` - Get marriage records
- `GET /divorce-records` - Get divorce records
- `GET /property-ownership` - Get property ownership changes
- `GET /employment-records` - Get job change records

**Mock Data**: Contains realistic life events (marriage, divorce, job changes, retirement, births, deaths) with proper confidence scores and source attribution.

### 2. MLS API

**Purpose**: Competitor monitoring and price reduction detection

**Endpoints**:

- `GET /listings` - Get listings for an area
- `GET /listings/:mlsNumber` - Get specific listing details
- `GET /listings/:mlsNumber/price-history` - Get price change history
- `GET /listings/:mlsNumber/status-history` - Get status change history
- `GET /agents/:agentId/listings` - Get agent's listings
- `GET /market-stats` - Get market statistics
- `GET /recent-changes` - Get recent listing changes

**Mock Data**: Includes active, sold, withdrawn, and expired listings with realistic price histories, status changes, and agent information.

### 3. Demographics API

**Purpose**: Neighborhood profile generation

**Endpoints**:

- `GET /data/2021/acs/acs5` - US Census Bureau API format
- `GET /data/2021/acs/acs5/profile` - Detailed demographic profiles
- `GET /v1/location/:location` - Alternative demographics API
- `POST /v1/batch` - Batch demographics lookup

**Mock Data**: Comprehensive demographic data including population, income, age distribution, household composition, education, and employment statistics for major Washington cities.

### 4. Schools API

**Purpose**: School ratings for neighborhood profiles

**Endpoints**:

- `GET /v1/schools/nearby` - Find schools near coordinates
- `GET /v1/schools/zip/:zipCode` - Get schools by ZIP code
- `GET /v1/schools/:schoolId` - Get school details
- `GET /v1/ratings/summary` - Get area school ratings summary

**Mock Data**: Realistic school data with ratings (1-10), enrollment, student-teacher ratios, test scores, and demographics for public and private schools.

### 5. Google Places API

**Purpose**: Amenities data for neighborhood profiles

**Endpoints**:

- `GET /nearbysearch/json` - Find nearby places
- `GET /textsearch/json` - Text-based place search
- `GET /details/json` - Get place details
- `GET /findplacefromtext/json` - Find place from text
- `GET /autocomplete/json` - Place autocomplete

**Mock Data**: Comprehensive places data including restaurants, shopping, parks, healthcare, and entertainment venues with ratings, reviews, and operating hours.

### 6. Walk Score API

**Purpose**: Walkability scores for neighborhood profiles

**Endpoints**:

- `GET /score` - Get Walk Score for a location
- `POST /batch` - Batch Walk Score lookup

**Mock Data**: Walkability, transit, and bike scores (0-100) with appropriate descriptions and factors for various locations.

## Usage

### Automatic Setup

The MSW server is automatically configured in Jest tests through the `setupFilesAfterEnv` configuration in `jest.config.js`. No additional setup is required for most tests.

### Manual Setup

If you need to use the mocks in a specific test file:

```typescript
import { server } from "../__tests__/mocks/setup";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Testing External API Calls

The mocks will automatically intercept any HTTP requests to the configured API endpoints:

```typescript
// This will be intercepted by the MLS API mock
const response = await fetch(
  "https://api.mls.example.com/listings?location=Austin"
);
const data = await response.json();
expect(data.listings).toBeDefined();
```

### Custom Handlers

You can add custom handlers for specific test scenarios:

```typescript
import { server } from "../__tests__/mocks/setup";
import { http, HttpResponse } from "msw";

test("handles API error", async () => {
  server.use(
    http.get("https://api.mls.example.com/listings", () => {
      return HttpResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    })
  );

  // Your test code here
});
```

## Mock Data Characteristics

### Realistic Data

All mock data is designed to be realistic and representative of actual API responses:

- Proper data types and ranges
- Realistic geographic coordinates
- Appropriate timestamps and dates
- Valid phone numbers, addresses, and other formatted data

### Comprehensive Coverage

Mock data covers various scenarios:

- Different property types and price ranges
- Various life event types and timing
- Multiple school types and rating ranges
- Diverse amenity categories and distances
- Different walkability score ranges

### Error Scenarios

Each API includes error simulation endpoints:

- Service unavailable (503) errors
- Invalid request (400) errors
- Not found (404) errors
- Missing API key errors

## Data Validation

The mock APIs include built-in validation to ensure data quality:

- School ratings are constrained to 1-10 range
- Walk scores are constrained to 0-100 range
- Demographic percentages sum appropriately
- Geographic coordinates are realistic
- Price and income values are positive

## Testing the Mocks

Run the API mocking tests to verify all mocks are working correctly:

```bash
npm test -- --testPathPattern="api-mocking.test.ts"
```

This test suite verifies:

- All API endpoints respond correctly
- Data structures match expected formats
- Error handling works properly
- Data ranges are valid
- Filtering and search functionality works

## Extending the Mocks

### Adding New Endpoints

1. Add the handler to the appropriate file in `handlers/`
2. Add corresponding mock data to the appropriate file in `data/`
3. Add tests to `api-mocking.test.ts`

### Adding New APIs

1. Create a new handler file in `handlers/`
2. Create corresponding mock data file in `data/`
3. Export handlers from `handlers/index.ts`
4. Add tests to `api-mocking.test.ts`

### Updating Mock Data

Mock data can be updated by modifying the appropriate files in the `data/` directory. Ensure that:

- Data remains realistic and representative
- Required fields are always present
- Data types match API specifications
- Relationships between data points are maintained

## Performance Considerations

The mock server is lightweight and fast:

- No actual network requests are made
- Data is served from memory
- Minimal processing overhead
- Deterministic response times

## Troubleshooting

### Common Issues

**MSW not intercepting requests**:

- Ensure `setup.ts` is included in Jest's `setupFilesAfterEnv`
- Check that the request URL exactly matches the handler pattern
- Verify the HTTP method matches (GET, POST, etc.)

**Mock data not found**:

- Check that the location/identifier exists in the mock data
- Verify the search/filter logic in the handler
- Ensure data relationships are properly maintained

**Tests failing intermittently**:

- Use `server.resetHandlers()` in `afterEach` to reset state
- Avoid relying on specific mock data order
- Use deterministic data for assertions

### Debugging

Enable MSW logging to debug request handling:

```typescript
server.listen({
  onUnhandledRequest: "error", // or 'warn'
});
```

Check the console for unhandled requests or handler mismatches.

## Best Practices

1. **Keep mocks realistic**: Use data that closely resembles actual API responses
2. **Test error scenarios**: Include tests for API failures and edge cases
3. **Maintain data relationships**: Ensure related data points are consistent
4. **Use deterministic data**: Avoid random data in tests for consistency
5. **Document changes**: Update this README when adding new APIs or endpoints
6. **Validate data ranges**: Ensure numeric values are within expected ranges
7. **Test the mocks**: Run the API mocking test suite regularly to catch issues
