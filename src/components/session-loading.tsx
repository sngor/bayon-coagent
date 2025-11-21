'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';

/**
 * Session Loading Animation
 * 
 * An engaging loading screen shown while initializing the user session.
 * Features dynamic gradient mesh background, progress indication, and smooth animations.
 */
export function SessionLoading() {
    const [loadingStep, setLoadingStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const loadingSteps = [
        'Connecting to your workspace',
        'Loading your profile',
        'Initializing AI features',
        'Almost ready...'
    ];

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
        }, 2000);

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 0;
                return prev + Math.random() * 15;
            });
        }, 300);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [loadingSteps.length]);

    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
            {/* Enhanced animated gradient mesh blur background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Primary gradient orbs with more dynamic movement */}
                <motion.div
                    className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-primary/40 to-blue-500/30 blur-3xl"
                    animate={{
                        x: [0, 120, -40, 0],
                        y: [0, 60, -30, 0],
                        scale: [1, 1.3, 0.9, 1],
                        rotate: [0, 90, 180, 360],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                <motion.div
                    className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-blue-500/30 to-purple-500/25 blur-3xl"
                    animate={{
                        x: [0, -100, 50, 0],
                        y: [0, 90, -45, 0],
                        scale: [1, 1.4, 1.1, 1],
                        rotate: [0, -120, -240, -360],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                    }}
                />

                <motion.div
                    className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-purple-500/25 to-pink-500/20 blur-3xl"
                    animate={{
                        x: [0, 80, -60, 0],
                        y: [0, -80, 40, 0],
                        scale: [1, 1.35, 1.05, 1],
                        rotate: [0, 150, 300, 360],
                    }}
                    transition={{
                        duration: 13,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2,
                    }}
                />

                <motion.div
                    className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-tl from-primary/35 to-orange-500/20 blur-3xl"
                    animate={{
                        x: [0, -120, 60, 0],
                        y: [0, -70, 35, 0],
                        scale: [1, 1.25, 0.95, 1],
                        rotate: [0, -90, -180, -360],
                    }}
                    transition={{
                        duration: 11,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                    }}
                />

                {/* Dynamic center orb that responds to progress */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-primary/20 via-primary/10 to-transparent blur-2xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.7, 0.4],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        filter: `blur(${Math.max(20, 40 - progress * 0.2)}px)`,
                    }}
                />

                {/* Floating particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-2 w-2 rounded-full bg-primary/40"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.sin(i) * 50, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-md">
                {/* Logo with enhanced entrance animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        type: 'spring',
                        stiffness: 100
                    }}
                >
                    <motion.div
                        animate={{
                            filter: ['drop-shadow(0 0 0px rgba(var(--primary), 0.5))',
                                'drop-shadow(0 0 20px rgba(var(--primary), 0.3))',
                                'drop-shadow(0 0 0px rgba(var(--primary), 0.5))']
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Logo className="h-14 w-auto" />
                    </motion.div>
                </motion.div>

                {/* Progress ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative"
                >
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-muted-foreground/20"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-primary"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                                pathLength: progress / 100,
                                strokeDasharray: '283', // 2 * π * 45
                                strokeDashoffset: 283 * (1 - progress / 100),
                            }}
                        />
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                            className="text-sm font-medium text-primary"
                            key={Math.floor(progress)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {Math.floor(progress)}%
                        </motion.span>
                    </div>
                </motion.div>

                {/* Dynamic loading text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex flex-col items-center gap-4"
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={loadingStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-lg font-medium text-foreground text-center"
                        >
                            {loadingSteps[loadingStep]}
                        </motion.p>
                    </AnimatePresence>

                    {/* Enhanced animated dots */}
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="h-2 w-2 rounded-full bg-primary"
                                animate={{
                                    scale: [1, 1.8, 1],
                                    opacity: [0.3, 1, 0.3],
                                    backgroundColor: [
                                        'rgb(var(--primary))',
                                        'rgb(var(--primary) / 0.8)',
                                        'rgb(var(--primary))'
                                    ],
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
                </motion.div>

                {/* Enhanced hint text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-sm text-muted-foreground text-center leading-relaxed"
                >
                    Preparing your AI-powered success platform
                </motion.p>
            </div>
        </div>
    );
}
