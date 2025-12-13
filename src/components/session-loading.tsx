'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Modern Page Loading Animation
 * 
 * A clean, performant loading screen for page transitions and session initialization.
 * Features smooth animations with reduced motion support.
 */
export function SessionLoading() {
    const [loadingStep, setLoadingStep] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    const loadingSteps = [
        'Initializing workspace',
        'Loading your profile',
        'Preparing AI features',
        'Almost ready...'
    ];

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
        }, 2000);

        return () => clearInterval(stepInterval);
    }, [loadingSteps.length]);

    return (
        <div className="relative flex h-screen items-center justify-center bg-background">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }} />
            </div>

            {/* Simple gradient overlay */}
            {!shouldReduceMotion && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-sm text-center">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                >
                    <Logo className="h-10 w-auto" />
                </motion.div>

                {/* Loading indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="relative flex items-center justify-center"
                >
                    {/* Animated sparkles icon */}
                    <motion.div
                        animate={shouldReduceMotion ? {} : {
                            rotate: [0, 360],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        className="relative"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                    </motion.div>

                    {/* Orbiting dots */}
                    {!shouldReduceMotion && (
                        <>
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-primary rounded-full"
                                    animate={{
                                        rotate: [0, 360],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        rotate: {
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: i * 0.2
                                        },
                                        scale: {
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: i * 0.2
                                        },
                                    }}
                                    style={{
                                        transformOrigin: '0 32px',
                                        left: '50%',
                                        top: '50%',
                                        marginLeft: '-4px',
                                        marginTop: '-4px',
                                    }}
                                />
                            ))}
                        </>
                    )}
                </motion.div>

                {/* Loading text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="space-y-2"
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={loadingStep}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="text-sm font-medium text-foreground"
                        >
                            {loadingSteps[loadingStep]}
                        </motion.p>
                    </AnimatePresence>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-1">
                        {loadingSteps.map((_, index) => (
                            <motion.div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-primary/30"
                                animate={{
                                    backgroundColor: index === loadingStep
                                        ? 'hsl(var(--primary))'
                                        : 'hsl(var(--primary) / 0.3)',
                                    scale: index === loadingStep ? 1.2 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
