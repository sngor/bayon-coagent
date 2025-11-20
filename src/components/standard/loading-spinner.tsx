'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StandardLoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'overlay' | 'ai';
    message?: string;
    className?: string;
    showSubtext?: boolean;
}

const AI_SUBTEXTS = [
    'Powered by Claude 3.5 Sonnet',
    'Analyzing market trends',
    'Optimizing for engagement',
    'Crafting your unique voice',
    'Building your authority',
];

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

export function StandardLoadingSpinner({
    size = 'md',
    variant = 'default',
    message,
    className,
    showSubtext = false,
}: StandardLoadingSpinnerProps) {
    const [subtextIndex, setSubtextIndex] = React.useState(0);

    React.useEffect(() => {
        if (variant === 'ai' && showSubtext) {
            const interval = setInterval(() => {
                setSubtextIndex((prev) => (prev + 1) % AI_SUBTEXTS.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [variant, showSubtext]);

    if (variant === 'overlay') {
        return (
            <div
                className={cn(
                    'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
                    className
                )}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 className={cn('text-primary', sizeClasses[size])} aria-hidden="true" />
                    </motion.div>
                    {message && <p className="text-sm text-muted-foreground">{message}</p>}
                    {!message && <span className="sr-only">Loading...</span>}
                </div>
            </div>
        );
    }

    if (variant === 'ai') {
        return (
            <div
                className={cn('relative flex flex-col items-center justify-center text-center p-12', className)}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                {/* Animated gradient mesh blur background */}
                <div className="absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
                    {/* Gradient blob 1 */}
                    <motion.div
                        className="absolute top-0 left-0 h-32 w-32 rounded-full bg-primary/30 blur-2xl"
                        animate={{
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Gradient blob 2 */}
                    <motion.div
                        className="absolute top-0 right-0 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl"
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 1,
                        }}
                    />

                    {/* Gradient blob 3 */}
                    <motion.div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.5,
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="relative mb-8" aria-hidden="true">
                        {/* Sparkles icon with pulse */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.5, 0.8, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                                <Sparkles className="w-8 h-8 text-primary relative z-10" />
                            </div>
                        </motion.div>

                        {/* Floating sparkles */}
                        {[
                            { top: '-0.5rem', right: '-0.5rem', delay: 0 },
                            { bottom: '-0.5rem', left: '-0.5rem', delay: 0.3 },
                            { top: '50%', right: '-0.75rem', delay: 0.6 },
                        ].map((pos, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-primary rounded-full"
                                style={pos}
                                animate={{
                                    y: [-5, 5, -5],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: pos.delay,
                                }}
                            />
                        ))}
                    </div>

                    {message && (
                        <div className="space-y-3 max-w-md">
                            <motion.p
                                className="font-semibold text-lg bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent"
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {message}
                            </motion.p>
                            <AnimatePresence mode="wait">
                                {showSubtext && (
                                    <motion.p
                                        key={subtextIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-sm text-muted-foreground/80"
                                    >
                                        {AI_SUBTEXTS[subtextIndex]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            <div className="flex justify-center gap-2 mt-4" aria-hidden="true">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-primary rounded-full"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.4, 1, 0.4],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {!message && <span className="sr-only">AI processing in progress...</span>}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn('flex items-center justify-center', className)}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="flex flex-col items-center gap-2">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 className={cn('text-primary', sizeClasses[size])} aria-hidden="true" />
                </motion.div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                {!message && <span className="sr-only">Loading...</span>}
            </div>
        </div>
    );
}
