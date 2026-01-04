/**
 * Brand Hub Integration Middleware
 * 
 * Coordinates AI visibility features with other Brand Hub components
 * including Profile, Audit, Competitors, Strategy, and Testimonials
 */

import type { Profile, Testimonial } from '@/lib/types/common';
import type { SynchronizationResult } from './types/synchronization.types';
import { brandProfileIntegration } from './brand-profile-integration';
import { trackBrandIntegration } from './enhanced-analytics-tracking';

export interface BrandHubIntegrationEvent {
  type: 'profile_updated' | 'testimonial_updated' | 'audit_completed' | 'strategy_generated';
  userId: string;
  data: any;
  timestamp: Date;
  source: 'profile' | 'audit' | 'competitors' | 'strategy' | 'testimonials' | 'integrations';
}

export interface IntegrationResult {
  success: boolean;
  affectedFeatures: string[];
  synchronizationResults: SynchronizationResult[];
  warnings?: string[];
  errors?: string[];
}

export class BrandHubIntegrationService {
  /**
   * Handle events from different Brand Hub features
   */
  async handleBrandHubEvent(event: BrandHubIntegrationEvent): Promise<IntegrationResult> {
    const startTime = Date.now();
    const affectedFeatures: string[] = [];
    const synchronizationResults: SynchronizationResult[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      switch (event.type) {
        case 'profile_updated':
          const profileResult = await this.handleProfileUpdate(event);
          if (profileResult.synchronizationResults) {
            synchronizationResults.push(...profileResult.synchronizationResults);
          }
          affectedFeatures.push(...profileResult.affectedFeatures);
          break;

        case 'testimonial_updated':
          const testimonialResult = await this.handleTestimonialUpdate(event);
          if (testimonialResult.synchronizationResults) {
            synchronizationResults.push(...testimonialResult.synchronizationResults);
          }
          affectedFeatures.push(...testimonialResult.affectedFeatures);
          break;

        case 'audit_completed':
          const auditResult = await this.handleAuditCompletion(event);
          affectedFeatures.push(...auditResult.affectedFeatures);
          break;

        case 'strategy_generated':
          const strategyResult = await this.handleStrategyGeneration(event);
          affectedFeatures.push(...strategyResult.affectedFeatures);
          break;

        default:
          warnings.push(`Unknown event type: ${event.type}`);
      }

      // Track integration event
      const duration = Date.now() - startTime;
      trackBrandIntegration.hubIntegrationCompleted(
        event.userId,
        event.type,
        affectedFeatures.length,
        duration
      );

      return {
        success: errors.length === 0,
        affectedFeatures: [...new Set(affectedFeatures)], // Remove duplicates
        synchronizationResults,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      trackBrandIntegration.hubIntegrationFailed(
        event.userId,
        event.type,
        errorMessage,
        duration
      );

      return {
        success: false,
        affectedFeatures,
        synchronizationResults,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Handle profile updates and coordinate with other features
   */
  private async handleProfileUpdate(event: BrandHubIntegrationEvent): Promise<IntegrationResult> {
    const { userId, data } = event;
    const { previousProfile, updatedProfile } = data;
    const affectedFeatures: string[] = ['ai-visibility'];

    try {
      // Sync with AI visibility
      const aiVisibilityResult = await brandProfileIntegration.handleProfileUpdate({
        userId,
        previousProfile,
        updatedProfile,
        changedFields: this.detectChangedFields(previousProfile, updatedProfile),
        timestamp: event.timestamp
      });

      const synchronizationResults: SynchronizationResult[] = [];
      if (aiVisibilityResult.synchronizationResult) {
        synchronizationResults.push(aiVisibilityResult.synchronizationResult);
      }

      // Check if NAP fields changed and coordinate with Audit
      const napFields = ['name', 'address', 'phone'];
      const changedFields = this.detectChangedFields(previousProfile, updatedProfile);
      
      if (napFields.some(field => changedFields.includes(field))) {
        affectedFeatures.push('audit');
        // Trigger NAP consistency check
        await this.triggerNAPAuditUpdate(userId, updatedProfile);
      }

      // Check if competitive fields changed and coordinate with Competitors
      const competitiveFields = ['name', 'agencyName', 'specializations', 'serviceAreas'];
      if (competitiveFields.some(field => changedFields.includes(field))) {
        affectedFeatures.push('competitors');
        // Update competitive analysis parameters
        await this.updateCompetitiveAnalysisParameters(userId, updatedProfile);
      }

      // Check if strategy-relevant fields changed
      const strategyFields = ['bio', 'specializations', 'yearsOfExperience', 'certifications'];
      if (strategyFields.some(field => changedFields.includes(field))) {
        affectedFeatures.push('strategy');
        // Suggest strategy refresh
        await this.suggestStrategyRefresh(userId, changedFields);
      }

      return {
        success: aiVisibilityResult.success,
        affectedFeatures,
        synchronizationResults,
        errors: aiVisibilityResult.errors
      };

    } catch (error) {
      return {
        success: false,
        affectedFeatures,
        synchronizationResults: [],
        errors: [error instanceof Error ? error.message : 'Profile update integration failed']
      };
    }
  }

  /**
   * Handle testimonial updates and coordinate with other features
   */
  private async handleTestimonialUpdate(event: BrandHubIntegrationEvent): Promise<IntegrationResult> {
    const { userId, data } = event;
    const { testimonials } = data;
    const affectedFeatures: string[] = ['ai-visibility'];

    try {
      // Sync with AI visibility (Review schema generation)
      const aiVisibilityResult = await brandProfileIntegration.handleTestimonialUpdate({
        userId,
        testimonials,
        action: 'updated',
        timestamp: event.timestamp
      });

      // Update strategy recommendations based on new testimonials
      if (testimonials.length > 0) {
        affectedFeatures.push('strategy');
        await this.updateStrategyWithTestimonials(userId, testimonials);
      }

      return {
        success: aiVisibilityResult.success,
        affectedFeatures,
        synchronizationResults: [],
        errors: aiVisibilityResult.errors
      };

    } catch (error) {
      return {
        success: false,
        affectedFeatures,
        synchronizationResults: [],
        errors: [error instanceof Error ? error.message : 'Testimonial update integration failed']
      };
    }
  }

  /**
   * Handle audit completion and update AI visibility
   */
  private async handleAuditCompletion(event: BrandHubIntegrationEvent): Promise<IntegrationResult> {
    const { userId, data } = event;
    const { auditResults } = data;
    const affectedFeatures: string[] = ['ai-visibility'];

    try {
      // Update AI visibility based on audit findings
      if (auditResults.napConsistency) {
        await this.updateAIVisibilityFromNAPAudit(userId, auditResults.napConsistency);
      }

      if (auditResults.websiteAnalysis) {
        await this.updateAIVisibilityFromWebsiteAudit(userId, auditResults.websiteAnalysis);
      }

      return {
        success: true,
        affectedFeatures,
        synchronizationResults: []
      };

    } catch (error) {
      return {
        success: false,
        affectedFeatures,
        synchronizationResults: [],
        errors: [error instanceof Error ? error.message : 'Audit completion integration failed']
      };
    }
  }

  /**
   * Handle strategy generation and coordinate with AI visibility
   */
  private async handleStrategyGeneration(event: BrandHubIntegrationEvent): Promise<IntegrationResult> {
    const { userId, data } = event;
    const { strategy } = data;
    const affectedFeatures: string[] = ['ai-visibility'];

    try {
      // Update AI visibility optimization based on strategy
      await this.alignAIVisibilityWithStrategy(userId, strategy);

      return {
        success: true,
        affectedFeatures,
        synchronizationResults: []
      };

    } catch (error) {
      return {
        success: false,
        affectedFeatures,
        synchronizationResults: [],
        errors: [error instanceof Error ? error.message : 'Strategy generation integration failed']
      };
    }
  }

  /**
   * Detect changed fields between two profile objects
   */
  private detectChangedFields(previous: Partial<Profile>, current: Partial<Profile>): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    for (const key of allKeys) {
      const prevValue = previous[key as keyof Profile];
      const currValue = current[key as keyof Profile];

      if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Trigger NAP audit update
   */
  private async triggerNAPAuditUpdate(userId: string, profile: Partial<Profile>): Promise<void> {
    try {
      // This would integrate with the existing NAP audit functionality
      console.log(`Triggering NAP audit update for user ${userId}`);
      
      // TODO: Call existing NAP audit action
      // const { runNapAuditAction } = await import('@/app/actions');
      // await runNapAuditAction(userId, profile);
    } catch (error) {
      console.error('Failed to trigger NAP audit update:', error);
    }
  }

  /**
   * Update competitive analysis parameters
   */
  private async updateCompetitiveAnalysisParameters(userId: string, profile: Partial<Profile>): Promise<void> {
    try {
      console.log(`Updating competitive analysis parameters for user ${userId}`);
      
      // TODO: Update competitive analysis with new profile data
      // This would refresh competitor discovery based on updated specializations, service areas, etc.
    } catch (error) {
      console.error('Failed to update competitive analysis parameters:', error);
    }
  }

  /**
   * Suggest strategy refresh
   */
  private async suggestStrategyRefresh(userId: string, changedFields: string[]): Promise<void> {
    try {
      console.log(`Suggesting strategy refresh for user ${userId} due to changes in:`, changedFields);
      
      // TODO: Create notification or flag for strategy refresh
      // This would suggest that the user regenerate their marketing strategy
      // based on updated profile information
    } catch (error) {
      console.error('Failed to suggest strategy refresh:', error);
    }
  }

  /**
   * Update strategy with new testimonials
   */
  private async updateStrategyWithTestimonials(userId: string, testimonials: Testimonial[]): Promise<void> {
    try {
      console.log(`Updating strategy with ${testimonials.length} testimonials for user ${userId}`);
      
      // TODO: Integrate testimonials into strategy recommendations
      // This would use testimonial content to enhance marketing strategy suggestions
    } catch (error) {
      console.error('Failed to update strategy with testimonials:', error);
    }
  }

  /**
   * Update AI visibility from NAP audit results
   */
  private async updateAIVisibilityFromNAPAudit(userId: string, napResults: any): Promise<void> {
    try {
      console.log(`Updating AI visibility from NAP audit for user ${userId}`);
      
      // TODO: Use NAP consistency results to improve AI visibility recommendations
      // This would identify inconsistencies that affect AI discovery
    } catch (error) {
      console.error('Failed to update AI visibility from NAP audit:', error);
    }
  }

  /**
   * Update AI visibility from website audit results
   */
  private async updateAIVisibilityFromWebsiteAudit(userId: string, websiteResults: any): Promise<void> {
    try {
      console.log(`Updating AI visibility from website audit for user ${userId}`);
      
      // TODO: Use website analysis results to improve AI visibility
      // This would identify technical SEO issues affecting AI discovery
    } catch (error) {
      console.error('Failed to update AI visibility from website audit:', error);
    }
  }

  /**
   * Align AI visibility optimization with marketing strategy
   */
  private async alignAIVisibilityWithStrategy(userId: string, strategy: any): Promise<void> {
    try {
      console.log(`Aligning AI visibility with strategy for user ${userId}`);
      
      // TODO: Customize AI visibility optimization based on marketing strategy
      // This would prioritize certain optimization areas based on the generated strategy
    } catch (error) {
      console.error('Failed to align AI visibility with strategy:', error);
    }
  }
}

// Export singleton instance
export const brandHubIntegration = new BrandHubIntegrationService();

/**
 * Convenience functions for triggering integration events
 */
export async function triggerProfileUpdateIntegration(
  userId: string,
  previousProfile: Partial<Profile>,
  updatedProfile: Partial<Profile>
): Promise<IntegrationResult> {
  return brandHubIntegration.handleBrandHubEvent({
    type: 'profile_updated',
    userId,
    data: { previousProfile, updatedProfile },
    timestamp: new Date(),
    source: 'profile'
  });
}

export async function triggerTestimonialUpdateIntegration(
  userId: string,
  testimonials: Testimonial[]
): Promise<IntegrationResult> {
  return brandHubIntegration.handleBrandHubEvent({
    type: 'testimonial_updated',
    userId,
    data: { testimonials },
    timestamp: new Date(),
    source: 'testimonials'
  });
}

export async function triggerAuditCompletionIntegration(
  userId: string,
  auditResults: any
): Promise<IntegrationResult> {
  return brandHubIntegration.handleBrandHubEvent({
    type: 'audit_completed',
    userId,
    data: { auditResults },
    timestamp: new Date(),
    source: 'audit'
  });
}

export async function triggerStrategyGenerationIntegration(
  userId: string,
  strategy: any
): Promise<IntegrationResult> {
  return brandHubIntegration.handleBrandHubEvent({
    type: 'strategy_generated',
    userId,
    data: { strategy },
    timestamp: new Date(),
    source: 'strategy'
  });
}