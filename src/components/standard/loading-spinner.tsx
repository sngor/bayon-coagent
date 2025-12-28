'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export interface StandardLoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'overlay' | 'ai';
    message?: string;
    className?: string;
    showSubtext?: boolean;
    featureType?: 'blog-post' | 'market-update' | 'video-script' | 'neighborhood-guide' | 'social-media' | 'listing-description' | 'virtual-staging' | 'day-to-dusk' | 'enhance' | 'item-removal' | 'virtual-renovation' | 'default';
}

// Feature type mapping to new system
const FEATURE_TYPE_MAP: Record<string, 'content' | 'image' | 'research' | 'analysis' | 'default'> = {
    'blog-post': 'content',
    'market-update': 'content',
    'video-script': 'content',
    'neighborhood-guide': 'content',
    'social-media': 'content',
    'listing-description': 'content',
    'virtual-staging': 'image',
    'day-to-dusk': 'image',
    'enhance': 'image',
    'item-removal': 'image',
    'virtual-renovation': 'image',
    'default': 'default',
};

export function StandardLoadingSpinner({
    size = 'md',
    variant = 'default',
    message,
    className,
    showSubtext = false,
    featureType = 'default',
}: StandardLoadingSpinnerProps) {
    const mappedFeatureType = FEATURE_TYPE_MAP[featureType] || 'default';

    if (variant === 'overlay') {
        return (
            <Loading
                variant="default"
                size={size}
                message={message}
                showSubtext={showSubtext}
                fullScreen={true}
                featureType={mappedFeatureType}
                className={className}
            />
        );
    }

    if (variant === 'ai') {
        return (
            <div className={cn('min-h-[400px] flex items-center justify-center w-full', className)}>
                <Loading
                    variant="ai"
                    size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'}
                    message={message}
                    showSubtext={showSubtext}
                    featureType={mappedFeatureType}
                />
            </div>
        );
    }

    return (
        <Loading
            variant="default"
            size={size}
            message={message}
            showSubtext={showSubtext}
            featureType={mappedFeatureType}
            className={className}
        />
    );
}
