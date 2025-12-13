'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface PageLoadingProps {
    variant?: 'default' | 'minimal' | 'branded' | 'dots';
    message?: string;
    className?: string;
    fullScreen?: boolean;
}

/**
 * Modern Page Loading Component
 * 
 * Optimized for page transitions with multiple variants and reduced motion support.
 */
export function PageLoading({
    variant = 'default',
    message = 'Loading...',
    className,
    fullScreen = true
}: PageLoadingProps) {
    const shouldReduceMotion = useReducedMotion();

    const containerClasses = cn(
        'flex items-center justify-center',
        fullScreen ? 'fixed inset-0 z-50 bg-background' : 'w-full h-full min-h-[200px]',
        className
    );

    if (variant === 'minimal') {
        return (
            <div className={containerClasses}>
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        animate={shouldReduceMotion ? {} : { rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    >
                        <Loader2 className="w-6 h-6 text-primary" />
                    </motion.div>
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'dots') {
        return (
            <div className={containerClasses}>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-3 h-3 bg-primary rounded-full"
                                animate={shouldReduceMotion ? {} : {
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: 'easeInOut',
                                }}
                            />
                        ))}
                    </div>
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'branded') {
        return (
            <div className={containerClasses}>
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                    {/* Animated icon */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                    >
                        <motion.div
                            animate={shouldReduceMotion ? {} : {
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                        >
                            <Sparkles className="w-8 h-8 text-primary" />
                        </motion.div>

                        {/* Floating particles */}
                        {!shouldReduceMotion && (
                            <>
                                {[
                                    { delay: 0, x: -24, y: -24 },
                                    { delay: 0.3, x: 24, y: -20 },
                                    { delay: 0.6, x: -20, y: 24 },
                                ].map((particle, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                                        style={{ left: '50%', top: '50%' }}
                                        animate={{
                                            x: [0, particle.x, 0],
                                            y: [0, particle.y, 0],
                                            opacity: [0.3, 1, 0.3],
                                            scale: [0.5, 1, 0.5],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            delay: particle.delay,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </motion.div>

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-2"
                    >
                        <p className="font-medium text-foreground">{message}</p>
                        <p className="text-xs text-muted-foreground">
                            Powered by AI • Built for Real Estate
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-4">
                {/* Spinner with pulse effect */}
                <div className="relative">
                    <motion.div
                        animate={shouldReduceMotion ? {} : { rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="w-8 h-8"
                    >
                        <Loader2 className="w-full h-full text-primary" />
                    </motion.div>

                    {/* Pulse ring */}
                    {!shouldReduceMotion && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/20"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    )}
                </div>

                {/* Message */}
                {message && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground"
                    >
                        {message}
                    </motion.p>
                )}
            </div>
        </div>
    );
}

/**
 * Quick page transition loading (for route changes)
 */
export function PageTransitionLoading() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20"
        >
            <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
            />
        </motion.div>
    );
}

/**
 * Inline loading for content areas
 */
export function InlineLoading({
    message = 'Loading...',
    className
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center justify-center py-8', className)}>
            <PageLoading
                variant="minimal"
                message={message}
                fullScreen={false}
            />
        </div>
    );
}

/**
 * Button loading state
 */
export function ButtonLoading({
    children,
    isLoading,
    loadingText = 'Loading...',
    ...props
}: any) {
    return (
        <button disabled={isLoading} {...props}>
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingText}</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}