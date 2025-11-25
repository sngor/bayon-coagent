/**
 * Animated Tooltip Component
 * Enhanced tooltip with smooth animations
 */

'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipTrigger = TooltipPrimitive.Trigger;

const AnimatedTooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
));

AnimatedTooltipContent.displayName = 'AnimatedTooltipContent';

export { TooltipProvider, TooltipTrigger, AnimatedTooltipContent as TooltipContent };

// Simple wrapper component
export interface AnimatedTooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    delayDuration?: number;
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
    children,
    content,
    side = 'top',
    delayDuration = 200,
}) => {
    return (
        <TooltipProvider delayDuration={delayDuration}>
            <TooltipPrimitive.Root>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <AnimatedTooltipContent side={side}>{content}</AnimatedTooltipContent>
            </TooltipPrimitive.Root>
        </TooltipProvider>
    );
};
