'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';

/**
 * Simple Loading Screen
 * 
 * A clean, minimal loading screen with blur gradient mesh background.
 * Features a single smooth animation with reduced motion support.
 */
export function SessionLoading() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="relative flex h-screen items-center justify-center bg-background overflow-hidden">
            {/* Blur Gradient Mesh Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/15 to-primary/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tr from-primary/10 to-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-sm text-center">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                >
                    <Logo className="h-10 w-auto" />
                </motion.div>

                {/* Single Loading Animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center justify-center"
                >
                    <Loader2
                        className={`w-8 h-8 text-primary ${!shouldReduceMotion ? 'animate-spin' : ''}`}
                    />
                </motion.div>

                {/* Loading text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <p className="text-sm font-medium text-muted-foreground">
                        Loading your workspace...
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
