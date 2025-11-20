/**
 * Animated Card Component
 * Enhanced card with smooth micro-animations and hover effects
 */

'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover, cardLift, fadeInUp, scaleIn } from '@/lib/animations';

export interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    variant?: 'default' | 'lift' | 'glow' | 'scale' | 'none';
    animateOnMount?: boolean;
    hoverEffect?: boolean;
    className?: string;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
    (
        {
            children,
            variant = 'default',
            animateOnMount = true,
            hoverEffect = true,
            className,
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            default: 'card-hover-lift',
            lift: 'card-hover-lift',
            glow: 'card-hover-glow',
            scale: 'card-hover-scale',
            none: '',
        };

        const hoverVariants = {
            default: cardHover,
            lift: cardLift,
            glow: {},
            scale: {},
            none: {},
        };

        return (
            <motion.div
                ref={ref}
                initial={animateOnMount ? 'hidden' : false}
                animate={animateOnMount ? 'visible' : false}
                variants={fadeInUp}
                whileHover={hoverEffect ? 'hover' : undefined}
                whileTap={hoverEffect ? 'tap' : undefined}
                className={cn(
                    'rounded-lg border bg-card text-card-foreground shadow-sm',
                    variantClasses[variant],
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedCard.displayName = 'AnimatedCard';

export const AnimatedCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
    />
));
AnimatedCardHeader.displayName = 'AnimatedCardHeader';

export const AnimatedCardTitle = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));
AnimatedCardTitle.displayName = 'AnimatedCardTitle';

export const AnimatedCardDescription = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
AnimatedCardDescription.displayName = 'AnimatedCardDescription';

export const AnimatedCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
AnimatedCardContent.displayName = 'AnimatedCardContent';

export const AnimatedCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
    />
));
AnimatedCardFooter.displayName = 'AnimatedCardFooter';
