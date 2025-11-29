'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/common';

interface LoadingDotsProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
};

const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
};

/**
 * Animated loading dots component
 * Perfect for inline loading states in buttons and compact spaces
 */
export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
    return (
        <div className={cn('flex items-center', gapClasses[size], className)} aria-label="Loading">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={cn('rounded-full bg-current', sizeClasses[size])}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
