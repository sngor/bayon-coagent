'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Constants moved outside component to prevent recreation
const GLITCH_CHARS = ['4', '0', '4', '@', '#', '%'] as const;
const GLITCH_INTERVAL = 3000;
const GLITCH_DURATION = 100;
const PARTICLE_COUNT = 20;

// Default dimensions for SSR compatibility
const DEFAULT_DIMENSIONS = { width: 1200, height: 800 };

// Quick links data - moved outside component
const QUICK_LINKS = [
    { href: '/studio/write', label: 'Studio' },
    { href: '/brand/profile', label: 'Brand' },
    { href: '/research/agent', label: 'Research' },
    { href: '/market/insights', label: 'Market' },
    { href: '/tools/calculator', label: 'Tools' },
    { href: '/library/content', label: 'Library' },
] as const;

export default function NotFound() {
    const [glitchText, setGlitchText] = useState('404');
    const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
    const [isClient, setIsClient] = useState(false);

    // Memoize resize handler to prevent recreation
    const handleResize = useCallback(() => {
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }, []);

    // Memoize glitch animation logic
    const createGlitchEffect = useCallback(() => {
        const randomGlitch = Array.from({ length: 3 }, () =>
            GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        ).join('');
        setGlitchText(randomGlitch);

        setTimeout(() => setGlitchText('404'), GLITCH_DURATION);
    }, []);

    // Memoize particle positions for better performance
    const particlePositions = useMemo(() => {
        if (!isClient) return [];

        return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            initialX: Math.random() * dimensions.width,
            initialY: Math.random() * dimensions.height,
            targetX: Math.random() * dimensions.width,
            targetY: Math.random() * dimensions.height,
            duration: Math.random() * 10 + 10,
        }));
    }, [dimensions, isClient]);

    useEffect(() => {
        // Set client flag for hydration safety
        setIsClient(true);

        // Set initial dimensions after component mounts
        handleResize();

        // Add resize listener with passive option for better performance
        window.addEventListener('resize', handleResize, { passive: true });

        // Start glitch animation
        const interval = setInterval(createGlitchEffect, GLITCH_INTERVAL);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize, createGlitchEffect]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

            {/* Floating particles - only render on client */}
            {isClient && (
                <div className="absolute inset-0 overflow-hidden">
                    {particlePositions.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute w-1 h-1 bg-primary/30 rounded-full"
                            initial={{
                                x: particle.initialX,
                                y: particle.initialY,
                            }}
                            animate={{
                                y: particle.targetY,
                                x: particle.targetX,
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                {/* Glitch 404 */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="relative"
                >
                    <motion.h1
                        className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
                        animate={{
                            backgroundPosition: ['0%', '100%', '0%'],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        style={{
                            backgroundSize: '200% 100%',
                        }}
                    >
                        {glitchText}
                    </motion.h1>

                    {/* Holographic effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                        animate={{
                            x: ['-100%', '100%'],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        <h2 className="text-2xl md:text-3xl font-semibold">
                            Page Not Found in This Reality
                        </h2>
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>

                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Looks like this page got lost in the digital void. Let's get you back to building your real estate empire.
                    </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Button asChild size="lg" className="group">
                        <Link href="/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="group">
                        <Link href="/studio/write">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Content
                        </Link>
                    </Button>
                </motion.div>

                {/* Quick links */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-8 border-t border-border/50"
                >
                    <p className="text-sm text-muted-foreground mb-4">Popular destinations:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {QUICK_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                    className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>
        </div>
    );
}