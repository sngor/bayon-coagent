'use client';

import { Loading } from './loading';
import { cn } from '@/lib/utils';

interface PageLoadingProps {
    text?: string;
    className?: string;
    variant?: 'default' | 'hub' | 'feature';
}

export function PageLoading({ 
    text = 'Loading...', 
    className,
    variant = 'default'
}: PageLoadingProps) {
    const minHeight = variant === 'hub' ? 'min-h-[60vh]' : 'min-h-[400px]';
    
    return (
        <div className={cn(
            "flex items-center justify-center",
            minHeight,
            className
        )}>
            <Loading size="lg" text={text} />
        </div>
    );
}

// Hub-specific loading components for consistency and better UX
export function BrandProfileLoading() {
    return <PageLoading text="Loading brand profile..." variant="hub" />;
}

export function ResearchAgentLoading() {
    return <PageLoading text="Loading research..." variant="hub" />;
}

export function LibraryContentLoading() {
    return <PageLoading text="Loading library..." variant="hub" />;
}

export function StudioWriteLoading() {
    return <PageLoading text="Loading studio..." variant="hub" />;
}

export function AssistantChatLoading() {
    return <PageLoading text="Loading assistant..." variant="hub" />;
}

// Specialized loading components for specific use cases
interface PageTransitionLoadingProps {
    text?: string;
    className?: string;
}

export function PageTransitionLoading({ text = 'Loading...', className }: PageTransitionLoadingProps) {
    return (
        <Loading
            variant="ai"
            size="lg"
            message={text}
            fullScreen={true}
            className={className}
        />
    );
}

interface InlineLoadingProps {
    text?: string;
    className?: string;
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
    return <Loading size="sm" text={text} className={className} />;
}

interface ButtonLoadingProps {
    text?: string;
    className?: string;
}

export function ButtonLoading({ text = 'Loading...', className }: ButtonLoadingProps) {
    return <Loading size="sm" text={text} className={className} />;
}