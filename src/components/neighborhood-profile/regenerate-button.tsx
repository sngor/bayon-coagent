'use client';

/**
 * Client-side regenerate button component for neighborhood profiles
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RegenerateButtonProps {
    profileId: string;
}

export function RegenerateButton({ profileId }: RegenerateButtonProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);

        try {
            const { regenerateNeighborhoodProfileAction } = await import('@/app/actions');
            const result = await regenerateNeighborhoodProfileAction(profileId);

            if (result.message === 'Neighborhood profile regenerated successfully') {
                toast({
                    title: 'Profile Regenerated',
                    description: 'The neighborhood profile has been updated with the latest data.'
                });

                // Refresh the page to show updated data
                window.location.reload();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Regeneration Failed',
                    description: result.message || 'Failed to regenerate the profile. Please try again.'
                });
            }
        } catch (error) {
            console.error('Failed to regenerate profile:', error);
            toast({
                variant: 'destructive',
                title: 'Regeneration Failed',
                description: 'An error occurred while regenerating the profile. Please try again.'
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
        >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </Button>
    );
}