# Neighborhood Profile AI Synthesis Flow

## Overview

The Neighborhood Profile AI Synthesis Flow takes raw neighborhood data from multiple external APIs and synthesizes it into a comprehensive, narrative-driven neighborhood profile. This flow is designed to help real estate agents create professional neighborhood reports that position them as local market experts.

## Requirements

This flow implements **Requirement 5.1** from the Market Intelligence Alerts specification:

- Generate comprehensive neighborhood profiles with market data, demographics, school ratings, amenities, and walkability scores
- Synthesize raw data into narrative format with AI insights and recommendations

## Input Data

The flow accepts aggregated neighborhood data including:

- **Market Data**: Median prices, days on market, sales volume, inventory levels, price history
- **Demographics**: Population, income, age distribution, household composition
- **Schools**: Public and private schools with ratings (1-10 scale) and distances
- **Amenities**: Restaurants, shopping, parks, healthcare, entertainment (within 1 mile)
- **Walkability**: Score (0-100), description, and factor breakdown

## Output

The flow generates:

- **AI Insights**: Comprehensive narrative (300-400 words) about the neighborhood
- **Market Commentary**: Detailed market analysis and pricing trends
- **Demographic Insights**: Analysis of community character and demographics
- **Lifestyle Factors**: Quality of life and amenity analysis
- **School Analysis**: Educational opportunities assessment
- **Investment Potential**: Market outlook and investment assessment
- **Key Highlights**: 3-5 distinctive neighborhood features
- **Target Buyers**: Buyer personas who would be interested
- **Market Trends**: Current and emerging trends
- **Recommendations**: Actionable advice for buyers, sellers, investors
- **Risk Factors**: Potential concerns (optional)
- **Comparable Areas**: Similar neighborhoods (optional)

## Usage

```typescript
import { runNeighborhoodProfileSynthesis } from "@/aws/bedrock/flows/neighborhood-profile-flow";
import type { NeighborhoodProfileInput } from "@/ai/schemas/neighborhood-profile-schemas";

const input: NeighborhoodProfileInput = {
  location: "Downtown Seattle, WA",
  marketData: {
    medianSalePrice: 750000,
    avgDaysOnMarket: 25,
    salesVolume: 150,
    inventoryLevel: 200,
    priceHistory: [
      { month: "2024-01", medianPrice: 720000 },
      { month: "2024-02", medianPrice: 730000 },
      { month: "2024-03", medianPrice: 750000 },
    ],
  },
  demographics: {
    population: 25000,
    medianHouseholdIncome: 85000,
    ageDistribution: {
      under18: 15,
      age18to34: 35,
      age35to54: 25,
      age55to74: 20,
      over75: 5,
    },
    householdComposition: {
      familyHouseholds: 65,
      nonFamilyHouseholds: 35,
      averageHouseholdSize: 2.4,
    },
  },
  schools: [
    {
      name: "Lincoln Elementary",
      type: "public",
      grades: "K-5",
      rating: 8,
      distance: 0.5,
    },
  ],
  amenities: {
    restaurants: [
      { name: "The Local Bistro", category: "American", distance: 0.3 },
    ],
    shopping: [
      { name: "Main Street Market", category: "Grocery", distance: 0.4 },
    ],
    parks: [{ name: "Central Park", distance: 0.6 }],
    healthcare: [
      { name: "Family Medical Center", type: "Primary Care", distance: 0.5 },
    ],
    entertainment: [
      { name: "Regal Cinema", category: "Movie Theater", distance: 0.7 },
    ],
  },
  walkabilityScore: 75,
  walkabilityDescription: "Very Walkable",
  walkabilityFactors: {
    walkability: 75,
    transitScore: 65,
    bikeScore: 70,
  },
};

const result = await runNeighborhoodProfileSynthesis(input);
console.log(result.aiInsights);
```

## Integration

This flow is typically used as part of the neighborhood profile generation process:

1. **Data Aggregation**: External APIs collect raw neighborhood data
2. **AI Synthesis**: This flow processes the data into narrative format
3. **Profile Storage**: Results are saved to DynamoDB and Library
4. **Export Generation**: PDF/HTML exports are created from the synthesized content

## Model Configuration

The flow uses the `ANALYTICAL` model configuration:

- Model: Claude 3.5 Sonnet v2 (us.anthropic.claude-3-5-sonnet-20241022-v2:0)
- Temperature: 0.2 (for consistent, factual analysis)
- Max Tokens: 4096
- Optimized for data analysis and professional content generation

## Error Handling

The flow includes comprehensive error handling:

- Input validation using Zod schemas
- Graceful handling of missing or incomplete data
- Specific error messages for different failure scenarios
- Fallback behavior for API service issues

## Testing

The flow includes comprehensive test coverage:

- Schema validation tests
- Integration tests for imports and type checking
- Index export verification
- Input/output type validation

Run tests with:

```bash
npm test -- --testPathPattern="neighborhood-profile-flow"
```
