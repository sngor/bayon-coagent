'use client';

import { Loading } from './loading';
import { cn } from '@/lib/utils/common';

interface AILoadingProps {
    message?: string;
    showSubtext?: boolean;
    className?: string;
    compact?: boolean;
}

/**
 * Enhanced AI Loading Animation
 * Features animated gradient mesh blur background for AI content generation
 * @deprecated Use Loading component with variant="ai" instead
 */
export function AILoading({
    message = 'Generating content...',
    showSubtext = true,
    className,
    compact = false
}: AILoadingProps) {
    return (
        <div className={cn('flex items-center justify-center w-full', compact ? 'py-8' : 'min-h-[400px]', className)}>
            <Loading
                variant="ai"
                size={compact ? 'md' : 'lg'}
                message={message}
                showSubtext={showSubtext}
                featureType="content"
            />
        </div>
    );
}
