'use client';

import { HubHeaderProps } from './types';
import { memo } from 'react';

function HubHeaderComponent({ title, description, icon: Icon, actions }: HubHeaderProps) {
    return (
        <header className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0 mt-1" aria-hidden="true">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 text-lg text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex-shrink-0" role="group" aria-label="Page actions">
                    {actions}
                </div>
            )}
        </header>
    );
}

// Export memoized version to prevent unnecessary re-renders
export const HubHeader = memo(HubHeaderComponent);
