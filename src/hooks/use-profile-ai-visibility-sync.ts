/**
 * Profile AI Visibility Sync Hook
 * 
 * Automatically syncs profile changes with AI visibility features,
 * updating schema markup and knowledge graph entities when profile data changes.
 */

import { useEffect, useRef } from 'react';
import { useUser } from '@/aws/auth';
import type { Profile } from '@/lib/types/common';
import { trackAIVisibility, trackBrandIntegration } from '@/lib/ai-visibility/enhanced-analytics-tracking';
import { brandProfileIntegration } from '@/lib/ai-visibility/brand-profile-integration';
import { synchronizeProfileChanges, rollbackProfileChanges } from '@/lib/ai-visibility/profile-update-synchronizer';
import { toast } from '@/hooks/use-toast';

interface UseProfileAIVisibilitySyncOptions {
    /** Whether to show toast notifications for sync events */
    showNotifications?: boolean;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Fields to ignore when detecting changes */
    ignoreFields?: string[];
}

export function useProfileAIVisibilitySync(
    profile: Partial<Profile> | null,
    options: UseProfileAIVisibilitySyncOptions = {}
) {
    const { user } = useUser();
    const {
        showNotifications = true,
        debounceMs = 2000,
        ignoreFields = ['updatedAt', 'lastSeen']
    } = options;

    const previousProfileRef = useRef<Partial<Profile> | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user?.id || !profile) {
            return;
        }

        const previousProfile = previousProfileRef.current;
        
        // Skip if this is the first load
        if (!previousProfile) {
            previousProfileRef.current = profile;
            return;
        }

        // Detect changed fields
        const changedFields = detectChangedFields(previousProfile, profile, ignoreFields);
        
        if (changedFields.length === 0) {
            return;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the sync operation
        timeoutRef.current = setTimeout(async () => {
            const startTime = Date.now();
            
            try {
                // Track sync start
                trackBrandIntegration.profileSyncTriggered(user.id, changedFields, 0);

                if (showNotifications) {
                    toast({
                        title: 'Updating AI Visibility',
                        description: 'Syncing your profile changes with AI optimization features...',
                    });
                }

                // Use the new synchronization system
                const result = await synchronizeProfileChanges(user.id, previousProfile, profile);

                const duration = Date.now() - startTime;

                if (result?.success) {
                    // Track successful sync
                    trackBrandIntegration.profileSyncCompleted(
                        user.id, 
                        result.updatedSchemas.length, 
                        result.updatedEntities.length, 
                        duration
                    );

                    if (showNotifications) {
                        const message = result.synchronizationResult?.impactAnalysis?.estimatedVisibilityImpact 
                            ? `Updated ${result.updatedSchemas.length} schema(s) and ${result.updatedEntities.length} knowledge graph entit${result.updatedEntities.length === 1 ? 'y' : 'ies'}. Expected visibility impact: +${result.synchronizationResult.impactAnalysis.estimatedVisibilityImpact}%`
                            : `Updated ${result.updatedSchemas.length} schema(s) and ${result.updatedEntities.length} knowledge graph entit${result.updatedEntities.length === 1 ? 'y' : 'ies'}.`;

                        toast({
                            title: 'AI Visibility Updated',
                            description: message,
                        });
                    }

                    // Show warnings if any
                    if (result.warnings && result.warnings.length > 0 && showNotifications) {
                        toast({
                            variant: 'default',
                            title: 'Sync Completed with Warnings',
                            description: result.warnings.join(', '),
                        });
                    }
                } else if (result) {
                    // Track failed sync
                    trackBrandIntegration.profileSyncFailed(
                        user.id, 
                        result.errors?.join(', ') || 'Unknown error', 
                        duration
                    );

                    console.error('AI visibility sync failed:', result.errors);
                    
                    if (showNotifications) {
                        const errorMessage = result.errors?.join(', ') || 'Unknown error occurred';
                        toast({
                            variant: 'destructive',
                            title: 'AI Visibility Sync Failed',
                            description: errorMessage,
                        });

                        // Offer rollback option for high-risk changes
                        if (result.synchronizationResult?.impactAnalysis?.riskLevel === 'high') {
                            toast({
                                variant: 'default',
                                title: 'Rollback Available',
                                description: 'High-risk changes detected. Consider rolling back if issues occur.',
                            });
                        }
                    }
                } else {
                    // No changes detected
                    console.log('No AI visibility changes needed for profile update');
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                
                // Track sync error
                trackBrandIntegration.profileSyncFailed(user.id, errorMessage, duration);
                
                console.error('Profile AI visibility sync error:', error);
                
                if (showNotifications) {
                    toast({
                        variant: 'destructive',
                        title: 'Sync Error',
                        description: 'Failed to update AI visibility features.',
                    });
                }
            }
        }, debounceMs);

        // Update the previous profile reference
        previousProfileRef.current = profile;

        // Cleanup timeout on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user?.id, profile, showNotifications, debounceMs, ignoreFields]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
}

/**
 * Detect which fields have changed between two profile objects
 */
function detectChangedFields(
    previous: Partial<Profile>,
    current: Partial<Profile>,
    ignoreFields: string[] = []
): string[] {
    const changedFields: string[] = [];
    
    // Get all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(previous),
        ...Object.keys(current)
    ]);

    for (const key of allKeys) {
        // Skip ignored fields
        if (ignoreFields.includes(key)) {
            continue;
        }

        const prevValue = previous[key as keyof Profile];
        const currValue = current[key as keyof Profile];

        // Handle different types of comparisons
        if (Array.isArray(prevValue) && Array.isArray(currValue)) {
            // Array comparison
            if (prevValue.length !== currValue.length || 
                !prevValue.every((val, index) => val === currValue[index])) {
                changedFields.push(key);
            }
        } else if (typeof prevValue === 'object' && typeof currValue === 'object' && 
                   prevValue !== null && currValue !== null) {
            // Object comparison (shallow)
            if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
                changedFields.push(key);
            }
        } else {
            // Primitive comparison
            if (prevValue !== currValue) {
                changedFields.push(key);
            }
        }
    }

    return changedFields;
}

/**
 * Hook for syncing testimonial changes with AI visibility
 */
export function useTestimonialAIVisibilitySync(
    testimonials: any[] | null,
    options: { showNotifications?: boolean } = {}
) {
    const { user } = useUser();
    const { showNotifications = true } = options;
    const previousTestimonialsRef = useRef<any[] | null>(null);

    useEffect(() => {
        if (!user?.id || !testimonials) {
            return;
        }

        const previousTestimonials = previousTestimonialsRef.current;
        
        // Skip if this is the first load
        if (!previousTestimonials) {
            previousTestimonialsRef.current = testimonials;
            return;
        }

        // Check if testimonials have changed
        if (JSON.stringify(previousTestimonials) === JSON.stringify(testimonials)) {
            return;
        }

        // Sync testimonial changes
        const syncTestimonials = async () => {
            const startTime = Date.now();
            
            try {
                // Track sync start
                trackBrandIntegration.testimonialSyncTriggered(user.id, testimonials.length);

                if (showNotifications) {
                    toast({
                        title: 'Updating Review Schema',
                        description: 'Syncing testimonial changes with AI optimization...',
                    });
                }

                const result = await brandProfileIntegration.handleTestimonialUpdate({
                    userId: user.id,
                    testimonials,
                    action: 'updated',
                    timestamp: new Date()
                });

                const duration = Date.now() - startTime;

                if (result.success) {
                    // Track successful sync
                    trackBrandIntegration.testimonialSyncCompleted(
                        user.id, 
                        result.updatedSchemas.length, 
                        duration
                    );

                    if (showNotifications) {
                        toast({
                            title: 'Review Schema Updated',
                            description: `Generated ${result.updatedSchemas.length} review schema(s) for AI discovery.`,
                        });
                    }
                } else {
                    console.error('Testimonial AI visibility sync failed:', result.errors);
                    
                    if (showNotifications) {
                        toast({
                            variant: 'destructive',
                            title: 'Review Schema Sync Failed',
                            description: 'Testimonial changes may not be reflected in AI optimization.',
                        });
                    }
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                console.error('Testimonial AI visibility sync error:', error);
                
                if (showNotifications) {
                    toast({
                        variant: 'destructive',
                        title: 'Sync Error',
                        description: 'Failed to update review schema.',
                    });
                }
            }
        };

        syncTestimonials();
        previousTestimonialsRef.current = testimonials;
    }, [user?.id, testimonials, showNotifications]);
}