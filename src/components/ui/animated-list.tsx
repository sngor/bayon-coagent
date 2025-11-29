/**
 * Animated List Component
 * Provides staggered animations for list items
 */

'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/common';
import { staggerContainer, staggerItem, listContainer, listItem } from '@/lib/animations';

export interface AnimatedListProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    staggerDelay?: number;
    variant?: 'default' | 'fade' | 'scale';
    className?: string;
}

export const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
    ({ children, staggerDelay = 0.1, variant = 'default', className, ...props }, ref) => {
        const variants = variant === 'scale' ? staggerContainer : listContainer;

        const customVariants = {
            ...variants,
            visible: {
                ...variants.visible,
                transition: {
                    ...(variants.visible as any).transition,
                    staggerChildren: staggerDelay,
                },
            },
        };

        return (
            <motion.div
                ref={ref}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={customVariants}
                className={cn(className)}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedList.displayName = 'AnimatedList';

export interface AnimatedListItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    variant?: 'default' | 'scale';
    className?: string;
}

export const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
    ({ children, variant = 'default', className, ...props }, ref) => {
        const variants = variant === 'scale' ? staggerItem : listItem;

        return (
            <motion.div
                ref={ref}
                variants={variants}
                className={cn(className)}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedListItem.displayName = 'AnimatedListItem';
