/**
 * Animated Icon Component
 * Provides micro-animations for icons
 */

'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { iconBounce, iconPulse, iconSpin, iconShake } from '@/lib/animations';

export interface AnimatedIconProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    animation?: 'bounce' | 'pulse' | 'spin' | 'shake' | 'none';
    trigger?: 'hover' | 'always' | 'manual';
    className?: string;
}

export const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
    ({ children, animation = 'none', trigger = 'hover', className, ...props }, ref) => {
        const [isAnimating, setIsAnimating] = React.useState(trigger === 'always');

        const variants = {
            bounce: iconBounce,
            pulse: iconPulse,
            spin: iconSpin,
            shake: iconShake,
            none: {},
        };

        const getAnimationProps = () => {
            if (animation === 'none') return {};

            if (trigger === 'always') {
                return {
                    variants: variants[animation],
                    animate: 'animate',
                };
            }

            if (trigger === 'hover') {
                return {
                    variants: variants[animation],
                    initial: 'rest',
                    whileHover: animation === 'bounce' ? 'hover' : 'animate',
                };
            }

            if (trigger === 'manual' && isAnimating) {
                return {
                    variants: variants[animation],
                    animate: 'animate',
                };
            }

            return {};
        };

        return (
            <motion.div
                ref={ref}
                className={cn('inline-flex items-center justify-center', className)}
                {...getAnimationProps()}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

AnimatedIcon.displayName = 'AnimatedIcon';

// Preset animated icons for common use cases
export const SpinningIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <AnimatedIcon animation="spin" trigger="always" className={className}>
        {children}
    </AnimatedIcon>
);

export const PulsingIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <AnimatedIcon animation="pulse" trigger="always" className={className}>
        {children}
    </AnimatedIcon>
);

export const BouncingIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <AnimatedIcon animation="bounce" trigger="hover" className={className}>
        {children}
    </AnimatedIcon>
);
