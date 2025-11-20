'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';

/**
 * Session Loading Animation
 * 
 * An engaging loading screen shown while initializing the user session.
 * Features animated gradient mesh blur background for a modern, sophisticated look.
 */
export function SessionLoading() {
    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
            {/* Animated gradient mesh blur background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient blob 1 - Top left */}
                <motion.div
                    className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Gradient blob 2 - Top right */}
                <motion.div
                    className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 80, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                    }}
                />

                {/* Gradient blob 3 - Bottom left */}
                <motion.div
                    className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-purple-500/20 blur-3xl"
                    animate={{
                        x: [0, 60, 0],
                        y: [0, -60, 0],
                        scale: [1, 1.25, 1],
                    }}
                    transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2,
                    }}
                />

                {/* Gradient blob 4 - Bottom right */}
                <motion.div
                    className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
                    animate={{
                        x: [0, -100, 0],
                        y: [0, -50, 0],
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
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/15 blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
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
            <div className="relative z-10 flex flex-col items-center gap-8 px-4">
                {/* Logo with fade-in animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <Logo className="h-12 w-auto" />
                </motion.div>

                {/* Loading text with staggered animation */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col items-center gap-3"
                >
                    <motion.p
                        className="text-lg font-medium text-foreground"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        Initializing your workspace
                    </motion.p>

                    {/* Animated dots */}
                    <div className="flex gap-3">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="h-2 w-2 rounded-full bg-primary"
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
                </motion.div>

                {/* Subtle hint text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-sm text-muted-foreground max-w-md text-center"
                >
                    Setting up your AI-powered success platform
                </motion.p>
            </div>
        </div>
    );
}
