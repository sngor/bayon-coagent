/**
 * Brand Hub AI Integration Hook
 * 
 * Provides a unified interface for AI visibility integration across all Brand Hub features
 */

import { useCallback, useEffect, useRef } from 'react';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';
import type { Profile, Testimonial } from '@/lib/types/common';
import type { IntegrationResult } from '@/lib/ai-visibility/brand-hub-integration';
import { 
  triggerProfileUpdateIntegration,
  triggerTestimonialUpdateIntegration,
  triggerAuditCompletionIntegration,
  triggerStrategyGenerationIntegration
} from '@/lib/ai-visibility/brand-hub-integration';

export interface BrandHubAIIntegrationOptions {
  /** Whether to show toast notifications for integration events */
  showNotifications?: boolean;
  /** Whether to enable automatic integration */
  autoIntegrate?: boolean;
  /** Debounce delay for integration events */
  debounceMs?: number;
}

export interface BrandHubAIIntegrationHook {
  /** Trigger profile update integration */
  integrateProfileUpdate: (previousProfile: Partial<Profile>, updatedProfile: Partial<Profile>) => Promise<IntegrationResult | null>;
  
  /** Trigger testimonial update integration */
  integrateTestimonialUpdate: (testimonials: Testimonial[]) => Promise<IntegrationResult | null>;
  
  /** Trigger audit completion integration */
  integrateAuditCompletion: (auditResults: any) => Promise<IntegrationResult | null>;
  
  /** Trigger strategy generation integration */
  integrateStrategyGeneration: (strategy: any) => Promise<IntegrationResult | null>;
  
  /** Check if integration is currently running */
  isIntegrating: boolean;
}

export function useBrandHubAIIntegration(
  options: BrandHubAIIntegrationOptions = {}
): BrandHubAIIntegrationHook {
  const { user } = useUser();
  const {
    showNotifications = true,
    autoIntegrate = true,
    debounceMs = 1000
  } = options;

  const isIntegratingRef = useRef(false);
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showIntegrationNotification = useCallback((
    type: string,
    result: IntegrationResult,
    duration: number
  ) => {
    if (!showNotifications) return;

    if (result.success) {
      const affectedCount = result.affectedFeatures.length;
      const syncCount = result.synchronizationResults.length;
      
      toast({
        title: 'Brand Integration Complete',
        description: `${type} integrated with ${affectedCount} feature${affectedCount !== 1 ? 's' : ''} (${syncCount} sync${syncCount !== 1 ? 's' : ''}) in ${duration}ms`,
      });

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        toast({
          variant: 'default',
          title: 'Integration Warnings',
          description: result.warnings.join(', '),
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Brand Integration Failed',
        description: result.errors?.join(', ') || 'Unknown integration error',
      });
    }
  }, [showNotifications]);

  const debounceIntegration = useCallback((
    key: string,
    integrationFn: () => Promise<IntegrationResult | null>
  ) => {
    // Clear existing timer
    const existingTimer = debounceTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const result = await integrationFn();
        debounceTimersRef.current.delete(key);
      } catch (error) {
        console.error(`Debounced integration failed for ${key}:`, error);
        debounceTimersRef.current.delete(key);
      }
    }, debounceMs);

    debounceTimersRef.current.set(key, timer);
  }, [debounceMs]);

  const integrateProfileUpdate = useCallback(async (
    previousProfile: Partial<Profile>,
    updatedProfile: Partial<Profile>
  ): Promise<IntegrationResult | null> => {
    if (!user?.id) {
      console.warn('Cannot integrate profile update: user not authenticated');
      return null;
    }

    const startTime = Date.now();
    isIntegratingRef.current = true;

    try {
      const result = await triggerProfileUpdateIntegration(user.id, previousProfile, updatedProfile);
      const duration = Date.now() - startTime;
      
      showIntegrationNotification('Profile update', result, duration);
      return result;
    } catch (error) {
      console.error('Profile update integration error:', error);
      
      if (showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Integration Error',
          description: 'Failed to integrate profile update with Brand Hub features',
        });
      }
      
      return null;
    } finally {
      isIntegratingRef.current = false;
    }
  }, [user?.id, showIntegrationNotification]);

  const integrateTestimonialUpdate = useCallback(async (
    testimonials: Testimonial[]
  ): Promise<IntegrationResult | null> => {
    if (!user?.id) {
      console.warn('Cannot integrate testimonial update: user not authenticated');
      return null;
    }

    const startTime = Date.now();
    isIntegratingRef.current = true;

    try {
      const result = await triggerTestimonialUpdateIntegration(user.id, testimonials);
      const duration = Date.now() - startTime;
      
      showIntegrationNotification('Testimonial update', result, duration);
      return result;
    } catch (error) {
      console.error('Testimonial update integration error:', error);
      
      if (showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Integration Error',
          description: 'Failed to integrate testimonial update with Brand Hub features',
        });
      }
      
      return null;
    } finally {
      isIntegratingRef.current = false;
    }
  }, [user?.id, showIntegrationNotification]);

  const integrateAuditCompletion = useCallback(async (
    auditResults: any
  ): Promise<IntegrationResult | null> => {
    if (!user?.id) {
      console.warn('Cannot integrate audit completion: user not authenticated');
      return null;
    }

    const startTime = Date.now();
    isIntegratingRef.current = true;

    try {
      const result = await triggerAuditCompletionIntegration(user.id, auditResults);
      const duration = Date.now() - startTime;
      
      showIntegrationNotification('Audit completion', result, duration);
      return result;
    } catch (error) {
      console.error('Audit completion integration error:', error);
      
      if (showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Integration Error',
          description: 'Failed to integrate audit completion with Brand Hub features',
        });
      }
      
      return null;
    } finally {
      isIntegratingRef.current = false;
    }
  }, [user?.id, showIntegrationNotification]);

  const integrateStrategyGeneration = useCallback(async (
    strategy: any
  ): Promise<IntegrationResult | null> => {
    if (!user?.id) {
      console.warn('Cannot integrate strategy generation: user not authenticated');
      return null;
    }

    const startTime = Date.now();
    isIntegratingRef.current = true;

    try {
      const result = await triggerStrategyGenerationIntegration(user.id, strategy);
      const duration = Date.now() - startTime;
      
      showIntegrationNotification('Strategy generation', result, duration);
      return result;
    } catch (error) {
      console.error('Strategy generation integration error:', error);
      
      if (showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Integration Error',
          description: 'Failed to integrate strategy generation with Brand Hub features',
        });
      }
      
      return null;
    } finally {
      isIntegratingRef.current = false;
    }
  }, [user?.id, showIntegrationNotification]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);

  return {
    integrateProfileUpdate,
    integrateTestimonialUpdate,
    integrateAuditCompletion,
    integrateStrategyGeneration,
    isIntegrating: isIntegratingRef.current
  };
}

/**
 * Hook for automatic Brand Hub AI integration
 * Automatically triggers integration when data changes
 */
export function useAutoBrandHubAIIntegration(
  profile: Partial<Profile> | null,
  testimonials: Testimonial[] | null,
  options: BrandHubAIIntegrationOptions = {}
) {
  const integration = useBrandHubAIIntegration(options);
  const previousProfileRef = useRef<Partial<Profile> | null>(null);
  const previousTestimonialsRef = useRef<Testimonial[] | null>(null);

  // Auto-integrate profile changes
  useEffect(() => {
    if (!profile || !options.autoIntegrate) return;

    const previousProfile = previousProfileRef.current;
    if (previousProfile && JSON.stringify(previousProfile) !== JSON.stringify(profile)) {
      integration.integrateProfileUpdate(previousProfile, profile);
    }
    
    previousProfileRef.current = profile;
  }, [profile, integration, options.autoIntegrate]);

  // Auto-integrate testimonial changes
  useEffect(() => {
    if (!testimonials || !options.autoIntegrate) return;

    const previousTestimonials = previousTestimonialsRef.current;
    if (previousTestimonials && JSON.stringify(previousTestimonials) !== JSON.stringify(testimonials)) {
      integration.integrateTestimonialUpdate(testimonials);
    }
    
    previousTestimonialsRef.current = testimonials;
  }, [testimonials, integration, options.autoIntegrate]);

  return integration;
}