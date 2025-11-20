/**
 * Animated Badge Component
 * Badge with subtle entrance animations and hover effects
 */

'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { scaleIn, fadeIn } from '@/lib/animations';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                success: 'border-transparent bg-success text-success-foreground hover:bg-success/80',
                outline: 'text-foreground hover:bg-accent',
                glow: 'border-transparent bg-primary text-primary-foreground shadow-lg hover:shadow-xl glow-effect-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface AnimatedBadgeProps
    extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof badgeVariants> {
    children: React.ReactNode;
    animateOnMount?: boolean;
    pulse?: boolean;
}

export const AnimatedBadge = React.forwardRef<HTMLDivElement, AnimatedBadgeProps>(
    ({ className, variant, animateOnMount = true, pulse = false, children, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                variants={scaleIn}
                initial={animateOnMount ? 'hidden' : false}
                animate={animateOnMount ? 'visible' : false}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(badgeVariants({ variant }), pulse && 'animate-pulse-success', className)}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedBadge.displayName = 'AnimatedBadge';
