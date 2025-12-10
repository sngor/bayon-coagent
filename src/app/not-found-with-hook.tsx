'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWindowDimensions } from '@/hooks/use-window-dimensions';

// Constants moved outside component to prevent recreation
const GLITCH_CHARS = ['4', '0', '4', '@', '#', '%'] as const;
const GLITCH_INTERVAL = 3000;
const GLITCH_DURATION = 100;
const PARTICLE_COUNT = 20;

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
    const { width, height, isClient } = useWindowDimensions();

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
            initialX: Math.random() * width,
            initialY: Math.random() * height,
            targetX: Math.random() * width,
            targetY: Math.random() * height,
            duration: Math.random() * 10 + 10,
        }));
    }, [width, height, isClient]);

    useEffect(() => {
        // Start glitch animation
        const interval = setInterval(createGlitchEffect, GLITCH_INTERVAL);
        return () => clearInterval(interval);
    }, [createGlitchEffect]);

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

            {/* Rest of the component remains the same... */}
            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                {/* Component content... */}
            </div>
        </div>
    );
}