'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={cn('flex items-center justify-center space-x-2', className)}>
            <Loader2 className={cn('animate-spin', sizeClasses[size])} />
            {text && <span className="text-muted-foreground">{text}</span>}
        </div>
    );
}

// Full page loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loading size="lg" text={text} />
        </div>
    );
}

// Inline loading component
export function InlineLoading({ text }: { text?: string }) {
    return <Loading size="sm" text={text} />;
}