/**
 * Advanced Schema Generator Service
 * 
 * Generates comprehensive schema markup for AI visibility optimization
 * Requirements: 2.1, 2.2, 2.5
 */

import { 
  SchemaMarkup, 
  SchemaType, 
  PostalAddress, 
  GeoCoordinates, 
  Place, 
  AggregateRating, 
  Review, 
  Organization, 
  EducationalOccupationalCredential,
  Person,
  Rating
} from '../types';
import { 
  SchemaGenerationError, 
  SchemaValidationError, 
  wrapError, 
  logError 
} from '../errors';
import { retrySchemaOperation } from '../retry-manager';
import { fallbackManager } from '../fallback-manager';

// Use relative imports to avoid module resolution issues
interface AgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization: 'luxury' | 'first-time-buyers' | 'investment' | 'commercial' | 'general';
  preferredTone: 'warm-consultative' | 'direct-data-driven' | 'professional' | 'casual';
  agentType: 'buyer' | 'seller' | 'hybrid';
  corePrinciple: string;
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
}

interface Testimonial {
  id: string;
  userId: string;
  clientName: string;
  testimonialText: string;
  dateReceived: string;
  clientPhotoUrl?: string;
  isFeatured: boolean;
  displayOrder?: number;
  tags: string[];
  requestId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Schema Generator Service Interface
 */
export interface SchemaGeneratorService {
  /**
   * Generate RealEstateAgent schema markup
   */
  generateRealEstateAgentSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup;
  
  /**
   * Generate Person schema markup
   */
  generatePersonSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup;
  
  /**
   * Generate LocalBusiness schema markup
   */
  generateLocalBusinessSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup;
  
  /**
   * Generate Organization schema markup
   */
  generateOrganizationSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup;
  
  /**
   * Generate Review and AggregateRating schema from testimonials
   */
  generateTestimonialSchemas(testimonials: Testimonial[]): { reviews: Review[]; aggregateRating?: AggregateRating };
  
  /**
   * Generate complete schema markup for all types
   */
  generateAllSchemas(
    profile: Profile, 
    agentProfile?: AgentProfile, 
    testimonials?: Testimonial[]
  ): SchemaMarkup[];
}

/**
 * Advanced Schema Generator Implementation
 */
export class AdvancedSchemaGenerator implements SchemaGeneratorService {
  private readonly SCHEMA_CONTEXT = 'https://schema.org';
  
  /**
   * Generate RealEstateAgent schema markup
   */
  generateRealEstateAgentSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup {
    try {
      if (!profile?.name) {
        throw new SchemaGenerationError(
          'Profile name is required for RealEstateAgent schema',
          'RealEstateAgent',
          ['Missing required field: name']
        );
      }

      const schema: SchemaMarkup = {
        '@context': this.SCHEMA_CONTEXT,
        '@type': 'RealEstateAgent',
        '@id': `#real-estate-agent-${profile.id}`,
        name: profile.name,
        description: profile.bio || `${profile.name} is a professional real estate agent${agentProfile?.specialization ? ` specializing in ${agentProfile.specialization}` : ''}.`,
      };

      // Add email if available
      if (profile.email) {
        schema.email = profile.email;
      }

      // Add agent-specific data if available
      if (agentProfile) {
        // Add specialization as knowsAbout
        if (agentProfile.specialization) {
          schema.knowsAbout = [this.mapSpecializationToKnowledge(agentProfile.specialization)];
        }

        // Add primary market as areaServed
        if (agentProfile.primaryMarket) {
          schema.areaServed = [{
            '@type': 'Place',
            name: agentProfile.primaryMarket
          }];
        }

        // Add core principle to description
        if (agentProfile.corePrinciple) {
          schema.description = `${schema.description} ${agentProfile.corePrinciple}`;
        }
      }

      return schema;
    } catch (error) {
      const wrappedError = error instanceof SchemaGenerationError 
        ? error 
        : wrapError(error, 'Failed to generate RealEstateAgent schema');
      
      logError(wrappedError, { 
        profileId: profile?.id, 
        agentType: agentProfile?.agentType,
        schemaType: 'RealEstateAgent' 
      });
      
      throw wrappedError;
    }
  }

  /**
   * Generate Person schema markup
   */
  generatePersonSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup {
    const schema: SchemaMarkup = {
      '@context': this.SCHEMA_CONTEXT,
      '@type': 'Person',
      '@id': `#person-${profile.id}`,
      name: profile.name,
    };

    // Add email if available
    if (profile.email) {
      schema.email = profile.email;
    }

    // Add job title based on role or agent type
    if (profile.role) {
      schema.description = `${profile.name} - ${profile.role}`;
    } else if (agentProfile?.agentType) {
      const jobTitle = this.mapAgentTypeToJobTitle(agentProfile.agentType);
      schema.description = `${profile.name} - ${jobTitle}`;
    }

    // Add bio if available
    if (profile.bio) {
      schema.description = profile.bio;
    }

    // Add avatar as image URL
    if (profile.avatar) {
      // Note: Schema.org Person doesn't have image in our interface, but we can add it to properties
      (schema as any).image = profile.avatar;
    }

    return schema;
  }

  /**
   * Generate LocalBusiness schema markup
   */
  generateLocalBusinessSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup {
    const schema: SchemaMarkup = {
      '@context': this.SCHEMA_CONTEXT,
      '@type': 'LocalBusiness',
      '@id': `#local-business-${profile.id}`,
      name: `${profile.name} Real Estate Services`,
      description: `Professional real estate services provided by ${profile.name}${agentProfile?.primaryMarket ? ` in ${agentProfile.primaryMarket}` : ''}.`,
    };

    // Add email if available
    if (profile.email) {
      schema.email = profile.email;
    }

    // Add service area
    if (agentProfile?.primaryMarket) {
      schema.areaServed = [{
        '@type': 'Place',
        name: agentProfile.primaryMarket
      }];
    }

    // Add specialization as services offered
    if (agentProfile?.specialization) {
      schema.knowsAbout = [this.mapSpecializationToServices(agentProfile.specialization)];
    }

    return schema;
  }

  /**
   * Generate Organization schema markup
   */
  generateOrganizationSchema(profile: Profile, agentProfile?: AgentProfile): SchemaMarkup {
    const schema: SchemaMarkup = {
      '@context': this.SCHEMA_CONTEXT,
      '@type': 'Organization',
      '@id': `#organization-${profile.id}`,
      name: `${profile.name} Real Estate`,
      description: `Real estate organization led by ${profile.name}${agentProfile?.specialization ? `, specializing in ${agentProfile.specialization}` : ''}.`,
    };

    // Add email if available
    if (profile.email) {
      schema.email = profile.email;
    }

    // Add member (the agent)
    schema.memberOf = {
      '@type': 'Organization',
      name: `${profile.name} Real Estate`
    };

    return schema;
  }

  /**
   * Generate Review and AggregateRating schema from testimonials
   */
  generateTestimonialSchemas(testimonials: Testimonial[]): { reviews: Review[]; aggregateRating?: AggregateRating } {
    if (!testimonials || testimonials.length === 0) {
      return { reviews: [] };
    }

    // Generate individual reviews
    const reviews: Review[] = testimonials.map(testimonial => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: testimonial.clientName
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 5, // Testimonials are typically positive, default to 5 stars
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: testimonial.testimonialText,
      datePublished: new Date(testimonial.dateReceived).toISOString()
    }));

    // Generate aggregate rating
    const totalRating = reviews.length * 5; // Assuming all testimonials are 5-star
    const averageRating = totalRating / reviews.length;

    const aggregateRating: AggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1
    };

    return { reviews, aggregateRating };
  }

  /**
   * Generate complete schema markup for all types
   */
  generateAllSchemas(
    profile: Profile, 
    agentProfile?: AgentProfile, 
    testimonials?: Testimonial[]
  ): SchemaMarkup[] {
    try {
      if (!profile) {
        throw new SchemaGenerationError(
          'Profile is required for schema generation',
          'All',
          ['Missing profile data']
        );
      }

      const schemas: SchemaMarkup[] = [];

      // Generate core schemas with error handling for each
      try {
        schemas.push(this.generateRealEstateAgentSchema(profile, agentProfile));
      } catch (error) {
        logError(wrapError(error, 'Failed to generate RealEstateAgent schema'), { profileId: profile.id });
        // Continue with other schemas
      }

      try {
        schemas.push(this.generatePersonSchema(profile, agentProfile));
      } catch (error) {
        logError(wrapError(error, 'Failed to generate Person schema'), { profileId: profile.id });
      }

      try {
        schemas.push(this.generateLocalBusinessSchema(profile, agentProfile));
      } catch (error) {
        logError(wrapError(error, 'Failed to generate LocalBusiness schema'), { profileId: profile.id });
      }

      try {
        schemas.push(this.generateOrganizationSchema(profile, agentProfile));
      } catch (error) {
        logError(wrapError(error, 'Failed to generate Organization schema'), { profileId: profile.id });
      }

      // Add testimonial schemas if available
      if (testimonials && testimonials.length > 0) {
        try {
          const { reviews, aggregateRating } = this.generateTestimonialSchemas(testimonials);
          
          // Add reviews and aggregate rating to the RealEstateAgent schema
          const realEstateAgentSchema = schemas.find(s => s['@type'] === 'RealEstateAgent');
          if (realEstateAgentSchema) {
            realEstateAgentSchema.review = reviews;
            realEstateAgentSchema.aggregateRating = aggregateRating;
          }
        } catch (error) {
          logError(wrapError(error, 'Failed to generate testimonial schemas'), { 
            profileId: profile.id, 
            testimonialCount: testimonials.length 
          });
        }
      }

      if (schemas.length === 0) {
        throw new SchemaGenerationError(
          'Failed to generate any valid schemas',
          'All',
          ['All schema generation attempts failed']
        );
      }

      return schemas;
    } catch (error) {
      const wrappedError = error instanceof SchemaGenerationError 
        ? error 
        : wrapError(error, 'Failed to generate schemas');
      
      logError(wrappedError, { 
        profileId: profile?.id, 
        testimonialCount: testimonials?.length || 0 
      });
      
      throw wrappedError;
    }
  }

  /**
   * Map agent specialization to knowledge areas
   */
  private mapSpecializationToKnowledge(specialization: string): string {
    const knowledgeMap: Record<string, string> = {
      'luxury': 'Luxury Real Estate',
      'first-time-buyers': 'First-Time Home Buyer Services',
      'investment': 'Investment Property Analysis',
      'commercial': 'Commercial Real Estate',
      'general': 'Residential Real Estate'
    };

    return knowledgeMap[specialization] || 'Real Estate Services';
  }

  /**
   * Map agent specialization to services
   */
  private mapSpecializationToServices(specialization: string): string {
    const servicesMap: Record<string, string> = {
      'luxury': 'Luxury Property Sales and Marketing',
      'first-time-buyers': 'First-Time Home Buyer Guidance and Support',
      'investment': 'Investment Property Acquisition and Analysis',
      'commercial': 'Commercial Real Estate Transactions',
      'general': 'Residential Real Estate Sales and Purchases'
    };

    return servicesMap[specialization] || 'Real Estate Services';
  }

  /**
   * Map agent type to job title
   */
  private mapAgentTypeToJobTitle(agentType: string): string {
    const jobTitleMap: Record<string, string> = {
      'buyer': 'Buyer\'s Agent',
      'seller': 'Listing Agent',
      'hybrid': 'Real Estate Agent'
    };

    return jobTitleMap[agentType] || 'Real Estate Professional';
  }

  /**
   * Generate credentials schema from agent profile
   */
  generateCredentialsSchema(certifications: string[]): EducationalOccupationalCredential[] {
    return certifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert,
      credentialCategory: 'Real Estate Certification'
    }));
  }

  /**
   * Add geographic data to schema
   */
  addGeographicData(
    schema: SchemaMarkup, 
    address?: PostalAddress, 
    coordinates?: GeoCoordinates
  ): SchemaMarkup {
    if (address) {
      schema.address = address;
    }

    if (coordinates) {
      schema.geo = coordinates;
    }

    return schema;
  }

  /**
   * Add social media references
   */
  addSocialReferences(schema: SchemaMarkup, socialUrls: string[]): SchemaMarkup {
    if (socialUrls && socialUrls.length > 0) {
      schema.sameAs = socialUrls;
    }

    return schema;
  }
}

/**
 * Create and export a singleton instance
 */
export const schemaGenerator = new AdvancedSchemaGenerator();

/**
 * Convenience function to generate all schemas with error handling and fallback
 */
export async function generateAllSchemas(
  profile: Profile,
  agentProfile?: AgentProfile,
  testimonials?: Testimonial[]
): Promise<SchemaMarkup[]> {
  return fallbackManager.executeWithFallback(
    () => retrySchemaOperation(
      () => Promise.resolve(schemaGenerator.generateAllSchemas(profile, agentProfile, testimonials)),
      'all'
    ),
    'schemaGeneration',
    undefined,
    profile?.id
  );
}

/**
 * Convenience function to generate RealEstateAgent schema with error handling
 */
export async function generateRealEstateAgentSchema(
  profile: Profile,
  agentProfile?: AgentProfile
): Promise<SchemaMarkup> {
  return fallbackManager.executeWithFallback(
    () => retrySchemaOperation(
      () => Promise.resolve(schemaGenerator.generateRealEstateAgentSchema(profile, agentProfile)),
      'RealEstateAgent'
    ),
    'schemaGeneration',
    {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: profile?.name || 'Real Estate Professional',
    },
    profile?.id
  );
}

/**
 * Convenience function to generate testimonial schemas with error handling
 */
export async function generateTestimonialSchemas(
  testimonials: Testimonial[]
): Promise<{ reviews: Review[]; aggregateRating?: AggregateRating }> {
  return fallbackManager.executeWithFallback(
    () => retrySchemaOperation(
      () => Promise.resolve(schemaGenerator.generateTestimonialSchemas(testimonials)),
      'testimonials'
    ),
    'schemaGeneration',
    { reviews: [] }
  );
}