'use client';

import { cn } from '@/lib/utils/common';

interface LoadingDotsProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
    const dotSize = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    return (
        <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={cn(
                        dotSize[size],
                        'bg-current rounded-full animate-loading-dots'
                    )}
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </div>
    );
}