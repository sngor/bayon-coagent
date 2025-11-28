'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';

/**
 * Session Loading Animation
 * 
 * A refined loading screen shown while initializing the user session.
 * Features dynamic gradient mesh background and smooth animations.
 */
export function SessionLoading() {
    const [loadingStep, setLoadingStep] = useState(0);

    const loadingSteps = [
        'Initializing workspace',
        'Loading your profile',
        'Preparing AI features',
        'Almost ready...'
    ];

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
        }, 1800);

        return () => {
            clearInterval(stepInterval);
        };
    }, [loadingSteps.length]);

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
            {/* Refined gradient mesh background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Top left orb */}
                <motion.div
                    className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 to-blue-500/20 blur-3xl"
                    animate={{
                        x: [0, 80, 0],
                        y: [0, 40, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Top right orb */}
                <motion.div
                    className="absolute -top-40 -right-40 h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-purple-500/25 to-pink-500/15 blur-3xl"
                    animate={{
                        x: [0, -60, 0],
                        y: [0, 60, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2,
                    }}
                />

                {/* Bottom left orb */}
                <motion.div
                    className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-blue-500/20 to-primary/25 blur-3xl"
                    animate={{
                        x: [0, 60, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.18, 1],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 4,
                    }}
                />

                {/* Center ambient glow */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-radial from-primary/15 via-primary/5 to-transparent blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-12 px-4 max-w-md">
                {/* Logo with subtle glow effect */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                >
                    <motion.div
                        animate={{
                            filter: [
                                'drop-shadow(0 0 0px hsl(var(--primary) / 0))',
                                'drop-shadow(0 0 24px hsl(var(--primary) / 0.4))',
                                'drop-shadow(0 0 0px hsl(var(--primary) / 0))'
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Logo className="h-12 w-auto" />
                    </motion.div>
                </motion.div>

                {/* Spinner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="relative"
                >
                    {/* Outer ring */}
                    <svg className="w-20 h-20" viewBox="0 0 100 100">
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-primary/30"
                            strokeLinecap="round"
                            strokeDasharray="70 213"
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    </svg>

                    {/* Inner ring - counter rotation */}
                    <svg className="w-20 h-20 absolute inset-0" viewBox="0 0 100 100">
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-primary/50"
                            strokeLinecap="round"
                            strokeDasharray="55 165"
                            animate={{
                                rotate: -360,
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    </svg>

                    {/* Center pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="h-3 w-3 rounded-full bg-primary"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                </motion.div>

                {/* Dynamic loading text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={loadingStep}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="text-base font-medium text-foreground/90 text-center"
                        >
                            {loadingSteps[loadingStep]}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
