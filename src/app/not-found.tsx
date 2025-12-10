'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    const [glitchText, setGlitchText] = useState('404');
    const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Set client flag and initial dimensions after component mounts
        setIsClient(true);
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        // Update dimensions on resize
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);

        const glitchChars = ['4', '0', '4', '@', '#', '$', '%'];
        const interval = setInterval(() => {
            const randomGlitch = Array.from({ length: 3 }, () =>
                glitchChars[Math.floor(Math.random() * glitchChars.length)]
            ).join('');
            setGlitchText(randomGlitch);

            setTimeout(() => setGlitchText('404'), 100);
        }, 3000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

            {/* Floating particles - only render on client to avoid hydration mismatch */}
            {isClient && (
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-primary/30 rounded-full"
                            initial={{
                                x: Math.random() * dimensions.width,
                                y: Math.random() * dimensions.height,
                            }}
                            animate={{
                                y: [null, Math.random() * dimensions.height],
                                x: [null, Math.random() * dimensions.width],
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
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
                        {[
                            { href: '/studio/write', label: 'Studio' },
                            { href: '/brand/profile', label: 'Brand' },
                            { href: '/research/agent', label: 'Research' },
                            { href: '/market/insights', label: 'Market' },
                            { href: '/tools/calculator', label: 'Tools' },
                            { href: '/library/content', label: 'Library' },
                        ].map((link) => (
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
