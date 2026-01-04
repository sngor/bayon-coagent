/**
 * Brand Profile Integration Service
 * 
 * Handles automatic schema markup updates when Brand Profile changes,
 * testimonial integration for Review schema generation, and coordination
 * with existing NAP consistency and audit features.
 */

import type { Profile, Testimonial } from '@/lib/types/common';
import type { SchemaMarkup, KnowledgeGraphEntity } from '@/lib/ai-visibility/types';
import { generateAgentProfileSchema } from '@/lib/aeo/schema-generator';
import { knowledgeGraphBuilder } from '@/lib/ai-visibility/services/knowledge-graph-builder';
import { 
  profileUpdateSynchronizer, 
  synchronizeProfileChanges,
  type SynchronizationResult 
} from './profile-update-synchronizer';

export interface ProfileUpdateEvent {
    userId: string;
    previousProfile: Partial<Profile>;
    updatedProfile: Partial<Profile>;
    changedFields: string[];
    timestamp: Date;
}

export interface TestimonialUpdateEvent {
    userId: string;
    testimonials: Testimonial[];
    action: 'added' | 'updated' | 'removed';
    timestamp: Date;
}

export interface SchemaUpdateResult {
    success: boolean;
    updatedSchemas: SchemaMarkup[];
    updatedEntities: KnowledgeGraphEntity[];
    synchronizationResult?: SynchronizationResult;
    errors?: string[];
}

export class BrandProfileIntegrationService {
    constructor() {
        // No longer need to instantiate schema generator and knowledge graph builder
        // as we're using the singleton instances and the new synchronizer
    }

    /**
     * Handle profile updates using the new synchronization system
     */
    async handleProfileUpdate(event: ProfileUpdateEvent): Promise<SchemaUpdateResult> {
        try {
            const { userId, previousProfile, updatedProfile } = event;

            // Use the new synchronization system
            const syncResult = await synchronizeProfileChanges(
                userId,
                previousProfile,
                updatedProfile
            );

            if (!syncResult) {
                // No changes detected
                return {
                    success: true,
                    updatedSchemas: [],
                    updatedEntities: [],
                };
            }

            if (!syncResult.success) {
                return {
                    success: false,
                    updatedSchemas: [],
                    updatedEntities: [],
                    synchronizationResult: syncResult,
                    errors: syncResult.errors
                };
            }

            // Trigger NAP consistency check if relevant fields changed
            if (this.shouldTriggerNAPCheck(event.changedFields)) {
                await this.triggerNAPConsistencyCheck(userId, updatedProfile);
            }

            // Coordinate with existing SEO features
            if (syncResult.updatedSchemas.length > 0) {
                await this.coordinateWithSEOFeatures(userId, syncResult.updatedSchemas);
            }

            return {
                success: true,
                updatedSchemas: syncResult.updatedSchemas,
                updatedEntities: syncResult.updatedEntities,
                synchronizationResult: syncResult
            };

        } catch (error) {
            return {
                success: false,
                updatedSchemas: [],
                updatedEntities: [],
                errors: [`Profile update integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }

    /**
     * Handle testimonial updates and automatically generate Review schema
     */
    async handleTestimonialUpdate(event: TestimonialUpdateEvent): Promise<SchemaUpdateResult> {
        try {
            const { userId, testimonials } = event;

            const reviewSchemas: SchemaMarkup[] = [];
            const errors: string[] = [];

            // Generate Review schema for each testimonial
            for (const testimonial of testimonials) {
                try {
                    const reviewSchema = await this.generateReviewSchema(testimonial);
                    reviewSchemas.push(reviewSchema);
                } catch (error) {
                    errors.push(`Failed to generate Review schema for testimonial ${testimonial.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Generate AggregateRating schema if we have multiple testimonials
            if (testimonials.length > 1) {
                try {
                    const aggregateRating = await this.generateAggregateRatingSchema(testimonials);
                    reviewSchemas.push(aggregateRating);
                } catch (error) {
                    errors.push(`Failed to generate AggregateRating schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Save updated review schemas
            if (reviewSchemas.length > 0) {
                await this.saveUpdatedData(userId, reviewSchemas, []);
            }

            return {
                success: errors.length === 0,
                updatedSchemas: reviewSchemas,
                updatedEntities: [],
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            return {
                success: false,
                updatedSchemas: [],
                updatedEntities: [],
                errors: [`Testimonial update integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }

    /**
     * Generate Review schema from testimonial
     */
    private async generateReviewSchema(testimonial: Testimonial): Promise<SchemaMarkup> {
        return {
            '@context': 'https://schema.org',
            '@type': 'Review',
            name: `Review by ${testimonial.clientName}`,
            reviewBody: testimonial.content,
            author: {
                '@type': 'Person',
                name: testimonial.clientName
            },
            reviewRating: {
                '@type': 'Rating',
                ratingValue: testimonial.rating || 5,
                bestRating: 5,
                worstRating: 1
            },
            datePublished: testimonial.createdAt || new Date().toISOString()
        } as SchemaMarkup;
    }

    /**
     * Generate AggregateRating schema from multiple testimonials
     */
    private async generateAggregateRatingSchema(testimonials: Testimonial[]): Promise<SchemaMarkup> {
        const ratings = testimonials.map(t => t.rating || 5);
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

        return {
            '@context': 'https://schema.org',
            '@type': 'AggregateRating',
            name: 'Client Reviews',
            ratingValue: Math.round(averageRating * 10) / 10,
            reviewCount: testimonials.length,
            bestRating: 5,
            worstRating: 1
        } as SchemaMarkup;
    }

    /**
     * Coordinate with existing NAP consistency features
     */
    async coordinateWithNAPAudit(userId: string, profile: Partial<Profile>): Promise<void> {
        // Check if NAP data has changed and trigger audit if needed
        const napFields = ['name', 'address', 'phone'];
        
        try {
            // Import the NAP audit action dynamically to avoid circular dependencies
            const { runNapAuditAction } = await import('@/app/actions');
            
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('name', profile.name || '');
            formData.append('agencyName', profile.agencyName || '');
            formData.append('address', profile.address || '');
            formData.append('phone', profile.phone || '');
            formData.append('website', profile.website || '');

            // Run NAP audit in background
            await runNapAuditAction({}, formData);
        } catch (error) {
            console.error('Failed to coordinate with NAP audit:', error);
        }
    }

    /**
     * Coordinate with existing SEO features to avoid conflicts
     */
    async coordinateWithSEOFeatures(userId: string, updatedSchemas: SchemaMarkup[]): Promise<void> {
        // Ensure our schema updates don't conflict with existing SEO optimizations
        try {
            // Check for existing SEO schema markup
            const existingSEOData = await this.getExistingSEOData(userId);
            
            // Merge our AI visibility schemas with existing SEO schemas
            const mergedSchemas = this.mergeSchemaMarkup(existingSEOData, updatedSchemas);
            
            // Update the combined schema markup
            await this.updateCombinedSchemaMarkup(userId, mergedSchemas);
        } catch (error) {
            console.error('Failed to coordinate with SEO features:', error);
        }
    }

    /**
     * Determine which schemas need updating based on changed profile fields
     */
    private determineAffectedSchemas(changedFields: string[]): string[] {
        const schemaMap: Record<string, string[]> = {
            'RealEstateAgent': ['name', 'bio', 'licenseNumber', 'certifications', 'yearsOfExperience', 'phone', 'website', 'address'],
            'Person': ['name', 'bio', 'linkedin', 'twitter', 'facebook', 'instagram'],
            'LocalBusiness': ['agencyName', 'address', 'phone', 'website'],
            'Organization': ['agencyName', 'address', 'phone', 'website']
        };

        const affectedSchemas: string[] = [];
        
        for (const [schemaType, fields] of Object.entries(schemaMap)) {
            if (fields.some(field => changedFields.includes(field))) {
                affectedSchemas.push(schemaType);
            }
        }

        return affectedSchemas;
    }

    /**
     * Check if knowledge graph should be updated based on changed fields
     */
    private shouldUpdateKnowledgeGraph(changedFields: string[]): boolean {
        const kgFields = ['address', 'serviceAreas', 'certifications', 'linkedin', 'twitter', 'facebook', 'instagram'];
        return kgFields.some(field => changedFields.includes(field));
    }

    /**
     * Check if NAP consistency check should be triggered
     */
    private shouldTriggerNAPCheck(changedFields: string[]): boolean {
        const napFields = ['name', 'address', 'phone'];
        return napFields.some(field => changedFields.includes(field));
    }

    /**
     * Trigger NAP consistency check
     */
    private async triggerNAPConsistencyCheck(userId: string, profile: Partial<Profile>): Promise<void> {
        // Coordinate with existing NAP audit functionality
        await this.coordinateWithNAPAudit(userId, profile);
    }

    /**
     * Save updated schemas and entities to storage
     */
    private async saveUpdatedData(
        userId: string, 
        schemas: SchemaMarkup[], 
        entities: KnowledgeGraphEntity[]
    ): Promise<void> {
        try {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const repo = getRepository();

            // Save schemas
            for (const schema of schemas) {
                await repo.put({
                    PK: `USER#${userId}`,
                    SK: `AI_SCHEMA#${schema['@type']}#${Date.now()}`,
                    data: schema,
                    type: 'ai_visibility_schema',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // Save knowledge graph entities
            for (const entity of entities) {
                await repo.put({
                    PK: `USER#${userId}`,
                    SK: `AI_ENTITY#${entity['@type']}#${Date.now()}`,
                    data: entity,
                    type: 'ai_visibility_entity',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Failed to save updated AI visibility data:', error);
            throw error;
        }
    }

    /**
     * Get existing SEO data to avoid conflicts
     */
    private async getExistingSEOData(userId: string): Promise<SchemaMarkup[]> {
        try {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const repo = getRepository();

            const result = await repo.query({
                PK: `USER#${userId}`,
                SK: { beginsWith: 'SEO_SCHEMA#' }
            });

            return result.items.map(item => item.data as SchemaMarkup);
        } catch (error) {
            console.error('Failed to get existing SEO data:', error);
            return [];
        }
    }

    /**
     * Merge AI visibility schemas with existing SEO schemas
     */
    private mergeSchemaMarkup(existingSchemas: SchemaMarkup[], newSchemas: SchemaMarkup[]): SchemaMarkup[] {
        const merged = [...existingSchemas];
        
        for (const newSchema of newSchemas) {
            const existingIndex = merged.findIndex(schema => schema['@type'] === newSchema['@type']);
            
            if (existingIndex >= 0) {
                // Merge properties, with AI visibility taking precedence for structured data
                merged[existingIndex] = {
                    ...merged[existingIndex],
                    ...newSchema
                };
            } else {
                merged.push(newSchema);
            }
        }

        return merged;
    }

    /**
     * Update combined schema markup in storage
     */
    private async updateCombinedSchemaMarkup(userId: string, schemas: SchemaMarkup[]): Promise<void> {
        try {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const repo = getRepository();

            await repo.put({
                PK: `USER#${userId}`,
                SK: `COMBINED_SCHEMA#${Date.now()}`,
                data: schemas,
                type: 'combined_schema_markup',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to update combined schema markup:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const brandProfileIntegration = new BrandProfileIntegrationService();