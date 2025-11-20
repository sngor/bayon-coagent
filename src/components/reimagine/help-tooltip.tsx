'use client';

/**
 * Help Tooltip Component
 * 
 * Provides contextual help and guidance throughout the Reimagine UI
 */

import { HelpCircle, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
    content: string;
    variant?: 'help' | 'info';
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
}

export function HelpTooltip({
    content,
    variant = 'help',
    side = 'top',
    className,
}: HelpTooltipProps) {
    const Icon = variant === 'help' ? HelpCircle : Info;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'inline-flex items-center justify-center',
                            'text-muted-foreground hover:text-foreground',
                            'transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full',
                            className
                        )}
                        aria-label="Help information"
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs">
                    <p className="text-sm">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Inline Help Text Component
 * 
 * Displays help text directly in the UI
 */

interface HelpTextProps {
    children: React.ReactNode;
    className?: string;
}

export function HelpText({ children, className }: HelpTextProps) {
    return (
        <p className={cn('text-sm text-muted-foreground', className)}>
            {children}
        </p>
    );
}

/**
 * Help Section Component
 * 
 * Displays a collapsible help section with detailed information
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HelpSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export function HelpSection({
    title,
    children,
    defaultOpen = false,
    className,
}: HelpSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className={cn('border-muted', className)}>
            <CardContent className="p-4">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{title}</span>
                    </div>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {isOpen && (
                    <div className="mt-3 text-sm text-muted-foreground space-y-2">
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
