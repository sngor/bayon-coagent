/**
 * Frequent Features Component
 * 
 * Displays frequently used features in the navigation sidebar
 * Requirements: 27.1 - Surface frequently used tools in navigation
 */

'use client';

import Link from 'next/link';
import { useFrequentFeatures } from '@/hooks/use-usage-tracking';
import { Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FrequentFeaturesProps {
    className?: string;
    limit?: number;
    showTitle?: boolean;
}

export function FrequentFeatures({
    className,
    limit = 5,
    showTitle = true,
}: FrequentFeaturesProps) {
    const { features } = useFrequentFeatures(limit);

    if (features.length === 0) {
        return null;
    }

    return (
        <div className={cn('space-y-2', className)}>
            {showTitle && (
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <TrendingUp className="h-3 w-3" />
                    <span>Frequently Used</span>
                </div>
            )}
            <div className="space-y-1">
                {features.map((feature) => (
                    <Link
                        key={feature.featureId}
                        href={feature.featurePath}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            'group relative'
                        )}
                    >
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{feature.featureName}</div>
                            {feature.category && (
                                <div className="text-xs text-muted-foreground truncate">
                                    {feature.category}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {feature.count}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
