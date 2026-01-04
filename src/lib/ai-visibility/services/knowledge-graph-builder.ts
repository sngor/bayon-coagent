/**
 * Knowledge Graph Builder Service
 * 
 * Service for building and managing knowledge graph entities for AI visibility optimization
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { KnowledgeGraphEntity, RDFTriple } from '../types';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import type { Profile } from '@/lib/types/common/common';
import { 
  handleAIVisibilityOperation, 
  createGracefulAIOperation 
} from '../error-handler';
import { 
  AIVisibilityError, 
  KnowledgeGraphError,
  ConfigurationError 
} from '../errors';

/**
 * Geographic coordinates interface
 */
interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Service area definition
 */
interface ServiceArea {
  type: 'Polygon' | 'Circle';
  coordinates: number[][];
  radius?: number;
  name: string;
}

/**
 * Social profile reference
 */
interface SocialProfile {
  platform: string;
  url: string;
  verified?: boolean;
}

/**
 * Knowledge Graph Builder Service Implementation
 */
export class KnowledgeGraphBuilderService {
  private readonly baseURI = 'https://schema.org/';
  private readonly agentBaseURI = 'https://agent.example.com/';

  /**
   * Builds agent entity from profile data
   * Requirements: 3.1
   */
  buildAgentEntity(profile: AgentProfile & Profile): KnowledgeGraphEntity {
    const agentId = `${this.agentBaseURI}agent/${profile.userId}`;
    
    return {
      '@id': agentId,
      '@type': 'RealEstateAgent',
      properties: {
        name: profile.agentName || profile.name,
        email: profile.email,
        specialization: profile.specialization,
        primaryMarket: profile.primaryMarket,
        preferredTone: profile.preferredTone,
        agentType: profile.agentType,
        corePrinciple: profile.corePrinciple,
        bio: profile.bio,
        role: profile.role || 'Real Estate Agent',
        identifier: profile.userId,
        url: profile.photoURL ? `${this.agentBaseURI}profile/${profile.userId}` : undefined,
        image: profile.photoURL || profile.avatar,
      },
      relationships: [],
    };
  }

  /**
   * Creates geographic relationships for service areas
   * Requirements: 3.1, 3.4
   */
  createGeographicRelationships(serviceAreas: string[], coordinates?: Coordinates): KnowledgeGraphEntity[] {
    return serviceAreas.map((area, index) => {
      const areaId = `${this.agentBaseURI}area/${area.toLowerCase().replace(/\s+/g, '-')}`;
      
      return {
        '@id': areaId,
        '@type': 'Place',
        properties: {
          name: area,
          addressLocality: area,
          geo: coordinates ? {
            '@type': 'GeoCoordinates',
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          } : undefined,
        },
        relationships: [],
        coordinates: coordinates,
        serviceArea: coordinates ? {
          type: 'Circle' as const,
          coordinates: [[coordinates.longitude, coordinates.latitude]],
          radius: 10000, // 10km default radius
        } : undefined,
      };
    });
  }

  /**
   * Links certifications and specializations
   * Requirements: 3.2
   */
  linkCertifications(certifications: string[], agentId: string): KnowledgeGraphEntity[] {
    return certifications.map((cert, index) => {
      const certId = `${this.agentBaseURI}credential/${cert.toLowerCase().replace(/\s+/g, '-')}`;
      
      return {
        '@id': certId,
        '@type': 'EducationalOccupationalCredential',
        properties: {
          name: cert,
          credentialCategory: 'Professional Certification',
          recognizedBy: {
            '@type': 'Organization',
            name: 'Real Estate Licensing Authority',
          },
        },
        relationships: [
          {
            predicate: 'credentialFor',
            object: agentId,
          },
        ],
      };
    });
  }

  /**
   * Generates sameAs references for social profiles
   * Requirements: 3.3
   */
  generateSameAsReferences(socialProfiles: SocialProfile[]): string[] {
    return socialProfiles
      .filter(profile => profile.url && profile.url.startsWith('http'))
      .map(profile => profile.url);
  }

  /**
   * Creates brokerage relationship entity
   * Requirements: 3.2
   */
  createBrokerageEntity(brokerageName: string, agentId: string): KnowledgeGraphEntity {
    const brokerageId = `${this.agentBaseURI}brokerage/${brokerageName.toLowerCase().replace(/\s+/g, '-')}`;
    
    return {
      '@id': brokerageId,
      '@type': 'RealEstateOrganization',
      properties: {
        name: brokerageName,
        '@type': 'Organization',
      },
      relationships: [
        {
          predicate: 'employee',
          object: agentId,
        },
      ],
    };
  }

  /**
   * Builds complete knowledge graph from agent profile
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  async buildAgentKnowledgeGraph(
    profile: AgentProfile & Profile,
    options: {
      serviceAreas?: string[];
      coordinates?: Coordinates;
      certifications?: string[];
      socialProfiles?: SocialProfile[];
      brokerageName?: string;
    } = {}
  ): Promise<KnowledgeGraphEntity[]> {
    return handleAIVisibilityOperation(
      async () => {
        if (!profile.userId) {
          throw new ConfigurationError(
            'Profile must include userId for knowledge graph generation',
            'profile',
            ['userId']
          );
        }

        const entities: KnowledgeGraphEntity[] = [];

        try {
          // Create main agent entity
          const agentEntity = this.buildAgentEntity(profile);
          entities.push(agentEntity);

          // Add geographic relationships
          if (options.serviceAreas && options.serviceAreas.length > 0) {
            const geoEntities = this.createGeographicRelationships(options.serviceAreas, options.coordinates);
            entities.push(...geoEntities);

            // Link agent to service areas
            geoEntities.forEach(geoEntity => {
              agentEntity.relationships.push({
                predicate: 'areaServed',
                object: geoEntity['@id'],
              });
            });
          }

          // Add certifications
          if (options.certifications && options.certifications.length > 0) {
            const certEntities = this.linkCertifications(options.certifications, agentEntity['@id']);
            entities.push(...certEntities);

            // Link agent to certifications
            certEntities.forEach(certEntity => {
              agentEntity.relationships.push({
                predicate: 'hasCredential',
                object: certEntity['@id'],
              });
            });
          }

          // Add sameAs references
          if (options.socialProfiles && options.socialProfiles.length > 0) {
            const sameAsRefs = this.generateSameAsReferences(options.socialProfiles);
            agentEntity.properties.sameAs = sameAsRefs;
          }

          // Add brokerage relationship
          if (options.brokerageName) {
            const brokerageEntity = this.createBrokerageEntity(options.brokerageName, agentEntity['@id']);
            entities.push(brokerageEntity);

            // Link agent to brokerage
            agentEntity.relationships.push({
              predicate: 'memberOf',
              object: brokerageEntity['@id'],
            });
          }

          return entities;
        } catch (error) {
          throw new KnowledgeGraphError(
            'Failed to build knowledge graph entities',
            'Agent',
            error instanceof Error ? error.message : 'Unknown error',
            error instanceof Error ? error : undefined
          );
        }
      },
      'buildAgentKnowledgeGraph',
      { userId: profile.userId, serviceName: 'knowledgeGraphBuilder' }
    );
  }

  /**
   * Exports knowledge graph entities as RDF triples
   * Requirements: 2.3, 8.3
   */
  exportAsRDF(entities: KnowledgeGraphEntity[]): RDFTriple[] {
    const triples: RDFTriple[] = [];

    for (const entity of entities) {
      const subject = entity['@id'];

      // Add type triple
      triples.push({
        subject,
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: `${this.baseURI}${entity['@type']}`,
      });

      // Add property triples
      Object.entries(entity.properties).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        const predicate = `${this.baseURI}${key}`;

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          triples.push({
            subject,
            predicate,
            object: value,
          });
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Handle nested objects (like geo coordinates)
          if (value['@type']) {
            const nestedSubject = `${subject}#${key}`;
            triples.push({
              subject,
              predicate,
              object: nestedSubject,
            });
            triples.push({
              subject: nestedSubject,
              predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              object: `${this.baseURI}${value['@type']}`,
            });

            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (nestedKey.startsWith('@') || nestedValue === undefined || nestedValue === null) return;
              triples.push({
                subject: nestedSubject,
                predicate: `${this.baseURI}${nestedKey}`,
                object: nestedValue,
              });
            });
          }
        } else if (Array.isArray(value)) {
          // Handle arrays (like sameAs references)
          value.forEach(item => {
            if (typeof item === 'string') {
              triples.push({
                subject,
                predicate,
                object: item,
              });
            }
          });
        }
      });

      // Add relationship triples
      entity.relationships.forEach(rel => {
        triples.push({
          subject,
          predicate: `${this.baseURI}${rel.predicate}`,
          object: rel.object,
        });
      });

      // Add geographic data if present
      if (entity.coordinates) {
        const geoSubject = `${subject}#geo`;
        triples.push({
          subject,
          predicate: `${this.baseURI}geo`,
          object: geoSubject,
        });
        triples.push({
          subject: geoSubject,
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: `${this.baseURI}GeoCoordinates`,
        });
        triples.push({
          subject: geoSubject,
          predicate: `${this.baseURI}latitude`,
          object: entity.coordinates.latitude,
        });
        triples.push({
          subject: geoSubject,
          predicate: `${this.baseURI}longitude`,
          object: entity.coordinates.longitude,
        });
      }
    }

    return triples;
  }

  /**
   * Validates semantic triple consistency
   * Requirements: 2.3
   */
  validateSemanticTriples(triples: RDFTriple[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for required properties
    const subjects = new Set(triples.map(t => t.subject));
    
    for (const subject of subjects) {
      const subjectTriples = triples.filter(t => t.subject === subject);
      const typeTriple = subjectTriples.find(t => 
        t.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
      );

      if (!typeTriple) {
        errors.push(`Subject ${subject} is missing rdf:type declaration`);
        continue;
      }

      const type = typeTriple.object as string;
      
      // Validate required properties based on type
      if (type.includes('RealEstateAgent')) {
        const hasName = subjectTriples.some(t => t.predicate.includes('name'));
        if (!hasName) {
          errors.push(`RealEstateAgent ${subject} is missing required 'name' property`);
        }

        const hasSpecialization = subjectTriples.some(t => t.predicate.includes('specialization'));
        if (!hasSpecialization) {
          warnings.push(`RealEstateAgent ${subject} should have a 'specialization' property for better AI understanding`);
        }
      }

      if (type.includes('Place')) {
        const hasGeo = subjectTriples.some(t => t.predicate.includes('geo'));
        if (!hasGeo) {
          suggestions.push(`Place ${subject} would benefit from geographic coordinates for location-based AI queries`);
        }
      }
    }

    // Check for broken references
    const objectURIs = triples
      .map(t => t.object)
      .filter(obj => typeof obj === 'string' && obj.startsWith('http'));
    
    for (const objectURI of objectURIs) {
      if (!subjects.has(objectURI)) {
        warnings.push(`Reference to ${objectURI} found but entity is not defined in the knowledge graph`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Updates knowledge graph when profile changes
   * Requirements: 3.5
   */
  async synchronizeProfileUpdates(
    userId: string,
    updatedProfile: Partial<AgentProfile & Profile>,
    existingEntities: KnowledgeGraphEntity[]
  ): Promise<KnowledgeGraphEntity[]> {
    return handleAIVisibilityOperation(
      async () => {
        if (!userId) {
          throw new ConfigurationError(
            'User ID is required for profile synchronization',
            'synchronization',
            ['userId']
          );
        }

        // Find the agent entity
        const agentEntity = existingEntities.find(e => 
          e['@type'] === 'RealEstateAgent' && 
          e.properties.identifier === userId
        );

        if (!agentEntity) {
          throw new KnowledgeGraphError(
            `Agent entity not found for user ${userId}`,
            'Agent',
            'Entity not found in knowledge graph'
          );
        }

        try {
          // Update agent properties
          Object.entries(updatedProfile).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'agentName' || key === 'name') {
                agentEntity.properties.name = value;
              } else {
                agentEntity.properties[key] = value;
              }
            }
          });

          // Update timestamp
          agentEntity.properties.updatedAt = new Date().toISOString();

          return existingEntities;
        } catch (error) {
          throw new KnowledgeGraphError(
            'Failed to synchronize profile updates',
            'Agent',
            error instanceof Error ? error.message : 'Unknown synchronization error',
            error instanceof Error ? error : undefined
          );
        }
      },
      'synchronizeProfileUpdates',
      { userId, serviceName: 'knowledgeGraphBuilder' }
    );
  }
}

/**
 * Knowledge Graph Builder Service Interface
 */
export interface KnowledgeGraphBuilderServiceInterface {
  buildAgentKnowledgeGraph(
    profile: AgentProfile & Profile,
    options?: {
      serviceAreas?: string[];
      coordinates?: Coordinates;
      certifications?: string[];
      socialProfiles?: SocialProfile[];
      brokerageName?: string;
    }
  ): Promise<KnowledgeGraphEntity[]>;

  exportAsRDF(entities: KnowledgeGraphEntity[]): RDFTriple[];
  
  validateSemanticTriples(triples: RDFTriple[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };

  synchronizeProfileUpdates(
    userId: string,
    updatedProfile: Partial<AgentProfile & Profile>,
    existingEntities: KnowledgeGraphEntity[]
  ): Promise<KnowledgeGraphEntity[]>;
}

// Export singleton instance
export const knowledgeGraphBuilder = new KnowledgeGraphBuilderService();