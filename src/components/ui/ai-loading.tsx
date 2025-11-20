'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface AILoadingProps {
    message?: string;
    showSubtext?: boolean;
    className?: string;
    compact?: boolean;
}

const AI_SUBTEXTS = [
    'Powered by Claude 3.5 Sonnet',
    'Analyzing market trends',
    'Optimizing for engagement',
    'Crafting your unique voice',
    'Building your authority',
    'Researching insights',
    'Generating content',
];

/**
 * Enhanced AI Loading Animation
 * Features animated gradient mesh blur background for AI content generation
 */
export function AILoading({ message = 'Generating content...', showSubtext = true, className, compact = false }: AILoadingProps) {
    const [subtextIndex, setSubtextIndex] = useState(0);

    useEffect(() => {
        if (showSubtext) {
            const interval = setInterval(() => {
                setSubtextIndex((prev) => (prev + 1) % AI_SUBTEXTS.length);
            }, 3500);
            return () => clearInterval(interval);
        }
    }, [showSubtext]);

    if (compact) {
        return (
            <div className={cn('relative flex items-center justify-center py-8', className)}>
                {/* Compact gradient background */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Sparkles className="w-6 h-6 text-primary" />
                    </motion.div>
                    <motion.p
                        className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        {message}
                    </motion.p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('relative flex flex-col items-center justify-center p-12', className)}>
            {/* Animated gradient mesh blur background */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* Gradient blob 1 - Primary */}
                <motion.div
                    className="absolute top-0 left-0 h-40 w-40 rounded-full bg-primary/30 blur-3xl"
                    animate={{
                        x: [0, 60, 0],
                        y: [0, 40, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Gradient blob 2 - Purple */}
                <motion.div
                    className="absolute top-0 right-0 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                    }}
                />

                {/* Gradient blob 3 - Blue */}
                <motion.div
                    className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl"
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -40, 0],
                        scale: [1, 1.25, 1],
                    }}
                    transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2,
                    }}
                />

                {/* Gradient blob 4 - Accent */}
                <motion.div
                    className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-primary/20 blur-3xl"
                    animate={{
                        x: [0, -60, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                    }}
                />

                {/* Center accent blob */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-52 w-52 rounded-full bg-primary/15 blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Animated sparkles icon */}
                <div className="relative">
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
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            {/* Glow effect */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
                                animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <Sparkles className="w-10 h-10 text-primary relative z-10" />
                        </div>
                    </motion.div>

                    {/* Floating particles */}
                    {[
                        { top: '-0.5rem', right: '-0.5rem', delay: 0, size: 'w-2 h-2' },
                        { bottom: '-0.5rem', left: '-0.5rem', delay: 0.3, size: 'w-2 h-2' },
                        { top: '50%', right: '-1rem', delay: 0.6, size: 'w-1.5 h-1.5' },
                        { top: '20%', left: '-0.75rem', delay: 0.9, size: 'w-1.5 h-1.5' },
                    ].map((pos, i) => (
                        <motion.div
                            key={i}
                            className={cn('absolute rounded-full bg-primary', pos.size)}
                            style={{ top: pos.top, right: pos.right, bottom: pos.bottom, left: pos.left }}
                            animate={{
                                y: [-8, 8, -8],
                                opacity: [0.3, 1, 0.3],
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: pos.delay,
                            }}
                        />
                    ))}
                </div>

                {/* Text content */}
                <div className="space-y-3 max-w-md text-center">
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

                    {/* Animated subtext */}
                    <AnimatePresence mode="wait">
                        {showSubtext && (
                            <motion.p
                                key={subtextIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="text-sm text-muted-foreground"
                            >
                                {AI_SUBTEXTS[subtextIndex]}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Animated dots */}
                    <div className="flex justify-center gap-2 mt-4">
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
            </div>
        </div>
    );
}
