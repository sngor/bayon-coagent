/**
 * Geographic Schema Generator Service
 * 
 * Automatically generates geographic schema markup for location references
 * Requirements: 5.3, 5.5
 */

import { 
  SchemaMarkup,
  GeographicReference,
  GeoCoordinates,
  Place,
  PostalAddress
} from '../types';

/**
 * Geographic coordinate lookup service (mock implementation)
 * In production, this would integrate with a geocoding service like Google Maps API
 */
interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    streetName?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
}

/**
 * Geographic Schema Generator Service
 */
export class GeographicSchemaGenerator {
  /**
   * Generate geographic schema markup for location references
   */
  async generateGeographicSchema(locationText: string, locationType: string): Promise<SchemaMarkup> {
    // Get coordinates for the location
    const geocodeResult = await this.geocodeLocation(locationText);

    const baseSchema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: locationText.trim()
    };

    // Add coordinates if available
    if (geocodeResult) {
      baseSchema.geo = {
        '@type': 'GeoCoordinates',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      };

      // Add address information if available
      if (geocodeResult.addressComponents) {
        baseSchema.address = this.buildPostalAddress(geocodeResult.addressComponents);
      }
    }

    // Enhance schema based on location type
    return this.enhanceSchemaByLocationType(baseSchema, locationType, geocodeResult);
  }

  /**
   * Generate service area schema markup for real estate agents
   */
  generateServiceAreaSchema(serviceAreas: string[]): SchemaMarkup[] {
    return serviceAreas.map(area => ({
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: area,
      description: `Service area for real estate services`
    }));
  }

  /**
   * Generate neighborhood schema with market data
   */
  async generateNeighborhoodSchema(
    neighborhoodName: string, 
    marketData?: {
      averagePrice?: number;
      priceRange?: { min: number; max: number };
      marketTrend?: 'rising' | 'stable' | 'declining';
    }
  ): Promise<SchemaMarkup> {
    const geocodeResult = await this.geocodeLocation(neighborhoodName);

    const schema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: neighborhoodName,
      description: `${neighborhoodName} neighborhood information`
    };

    if (geocodeResult) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      };
    }

    // Add market data as additional properties (custom extension)
    if (marketData) {
      (schema as any).additionalProperty = [];
      
      if (marketData.averagePrice) {
        (schema as any).additionalProperty.push({
          '@type': 'PropertyValue',
          name: 'averageHomePrice',
          value: marketData.averagePrice,
          unitCode: 'USD'
        });
      }

      if (marketData.priceRange) {
        (schema as any).additionalProperty.push({
          '@type': 'PropertyValue',
          name: 'priceRange',
          minValue: marketData.priceRange.min,
          maxValue: marketData.priceRange.max,
          unitCode: 'USD'
        });
      }

      if (marketData.marketTrend) {
        (schema as any).additionalProperty.push({
          '@type': 'PropertyValue',
          name: 'marketTrend',
          value: marketData.marketTrend
        });
      }
    }

    return schema;
  }

  /**
   * Generate property location schema
   */
  async generatePropertyLocationSchema(
    address: string,
    propertyDetails?: {
      propertyType?: string;
      bedrooms?: number;
      bathrooms?: number;
      squareFootage?: number;
      price?: number;
    }
  ): Promise<SchemaMarkup> {
    const geocodeResult = await this.geocodeLocation(address);

    const schema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: address
    };

    if (geocodeResult) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      };

      schema.address = this.buildPostalAddress(geocodeResult.addressComponents);
    }

    // Add property details
    if (propertyDetails) {
      (schema as any).additionalProperty = [];

      Object.entries(propertyDetails).forEach(([key, value]) => {
        if (value !== undefined) {
          (schema as any).additionalProperty.push({
            '@type': 'PropertyValue',
            name: key,
            value: value,
            ...(key === 'price' && { unitCode: 'USD' }),
            ...(key === 'squareFootage' && { unitCode: 'SQF' })
          });
        }
      });
    }

    return schema;
  }

  /**
   * Generate local business schema for area businesses
   */
  async generateLocalBusinessSchema(
    businessName: string,
    businessType: string,
    location?: string
  ): Promise<SchemaMarkup> {
    const schema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: businessName,
      description: `${businessType} in the local area`
    };

    if (location) {
      const geocodeResult = await this.geocodeLocation(`${businessName} ${location}`);
      if (geocodeResult) {
        schema.geo = {
          '@type': 'GeoCoordinates',
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        };

        schema.address = this.buildPostalAddress(geocodeResult.addressComponents);
      }
    }

    return schema;
  }

  /**
   * Generate school district schema
   */
  async generateSchoolDistrictSchema(
    districtName: string,
    rating?: number,
    schools?: string[]
  ): Promise<SchemaMarkup> {
    const geocodeResult = await this.geocodeLocation(districtName);

    const schema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: districtName,
      description: `${districtName} school district information`
    };

    if (geocodeResult) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      };
    }

    // Add rating if available
    if (rating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: 1, // Placeholder
        bestRating: 10,
        worstRating: 1
      };
    }

    // Add schools as additional properties
    if (schools && schools.length > 0) {
      (schema as any).additionalProperty = schools.map(school => ({
        '@type': 'PropertyValue',
        name: 'school',
        value: school
      }));
    }

    return schema;
  }

  /**
   * Batch generate geographic schemas for multiple locations
   */
  async batchGenerateGeographicSchemas(locations: {
    text: string;
    type: string;
  }[]): Promise<SchemaMarkup[]> {
    const schemas = await Promise.all(
      locations.map(location => 
        this.generateGeographicSchema(location.text, location.type)
      )
    );

    return schemas;
  }

  /**
   * Private helper methods
   */

  /**
   * Mock geocoding service - in production, integrate with Google Maps API or similar
   */
  private async geocodeLocation(locationText: string): Promise<GeocodeResult | null> {
    // Mock implementation - replace with actual geocoding service
    const mockCoordinates: Record<string, GeocodeResult> = {
      'austin, tx': {
        latitude: 30.2672,
        longitude: -97.7431,
        formattedAddress: 'Austin, TX, USA',
        addressComponents: {
          city: 'Austin',
          state: 'TX',
          country: 'USA'
        }
      },
      'downtown austin': {
        latitude: 30.2672,
        longitude: -97.7431,
        formattedAddress: 'Downtown Austin, TX, USA',
        addressComponents: {
          city: 'Austin',
          state: 'TX',
          country: 'USA'
        }
      },
      'westlake hills': {
        latitude: 30.2672,
        longitude: -97.8431,
        formattedAddress: 'Westlake Hills, TX, USA',
        addressComponents: {
          city: 'Westlake Hills',
          state: 'TX',
          country: 'USA'
        }
      }
    };

    const normalizedLocation = locationText.toLowerCase().trim();
    
    // Check for exact matches first
    if (mockCoordinates[normalizedLocation]) {
      return mockCoordinates[normalizedLocation];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(mockCoordinates)) {
      if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
        return value;
      }
    }

    // Return null if no match found
    return null;
  }

  /**
   * Build postal address schema from address components
   */
  private buildPostalAddress(components: GeocodeResult['addressComponents']): PostalAddress {
    const address: PostalAddress = {
      '@type': 'PostalAddress',
      streetAddress: components.streetNumber && components.streetName ? 
        `${components.streetNumber} ${components.streetName}` : '',
      addressLocality: components.city,
      addressRegion: components.state,
      postalCode: components.postalCode || '',
      addressCountry: components.country
    };

    return address;
  }

  /**
   * Enhance schema based on location type
   */
  private enhanceSchemaByLocationType(
    baseSchema: SchemaMarkup, 
    locationType: string, 
    geocodeResult: GeocodeResult | null
  ): SchemaMarkup {
    const enhanced = { ...baseSchema };

    switch (locationType.toLowerCase()) {
      case 'neighborhood':
        enhanced.description = `${baseSchema.name} neighborhood`;
        (enhanced as any).additionalType = 'https://schema.org/Neighborhood';
        break;

      case 'city':
        enhanced['@type'] = 'City';
        enhanced.description = `City of ${baseSchema.name}`;
        break;

      case 'address':
        enhanced.description = `Property address: ${baseSchema.name}`;
        break;

      case 'landmark':
        enhanced.description = `Local landmark: ${baseSchema.name}`;
        (enhanced as any).additionalType = 'https://schema.org/LandmarksOrHistoricalBuildings';
        break;

      case 'region':
        enhanced.description = `Regional area: ${baseSchema.name}`;
        break;

      default:
        enhanced.description = `Location: ${baseSchema.name}`;
    }

    return enhanced;
  }

  /**
   * Validate geographic coordinates
   */
  private validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Export singleton instance
 */
export const geographicSchemaGenerator = new GeographicSchemaGenerator();