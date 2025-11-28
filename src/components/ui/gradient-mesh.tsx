'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    GradientMeshConfig,
    GradientOrb,
    defaultOrbs,
    generateOrbStyle,
    getGradientMeshClasses,
    generateGradientMeshVars,
} from '@/lib/gradient-mesh';

interface GradientMeshProps extends GradientMeshConfig {
    children?: React.ReactNode;
    containerClassName?: string;
}

/**
 * GradientMesh Component
 * 
 * Renders an animated gradient mesh background with floating orbs.
 * Uses CSS transforms for optimal performance.
 * 
 * @example
 * ```tsx
 * <GradientMesh animate blur="xl" opacity={0.15}>
 *   <YourContent />
 * </GradientMesh>
 * ```
 */
export function GradientMesh({
    orbs = defaultOrbs,
    blur = 'xl',
    opacity,
    animate = true,
    className,
    containerClassName,
    children,
}: GradientMeshProps) {
    const config: GradientMeshConfig = { blur, opacity, animate, className };
    const meshVars = generateGradientMeshVars(config);

    return (
        <div className={cn("relative", containerClassName)}>
            {/* Gradient mesh background */}
            <div
                className={cn(getGradientMeshClasses(config))}
                style={meshVars}
                aria-hidden="true"
            >
                {orbs.map((orb) => (
                    <div
                        key={orb.id}
                        className={cn(
                            'absolute rounded-full',
                            animate && 'animate-float-slow'
                        )}
                        style={{
                            ...generateOrbStyle(orb),
                            ...(animate && orb.animationDuration
                                ? { animationDuration: `${orb.animationDuration}s` }
                                : {}),
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
}

/**
 * SubtleGradientMesh Component
 * 
 * A subtle gradient mesh for page backgrounds.
 * Uses minimal opacity for a refined look.
 */
export function SubtleGradientMesh({ children, className }: { children?: React.ReactNode, className?: string }) {
    const subtleOrbs: GradientOrb[] = [
        {
            id: 'subtle-1',
            color: 'hsl(var(--primary))',
            size: 600,
            x: 10,
            y: 10,
            blur: 100,
            opacity: 0.05,
            animationDuration: 25,
        },
        {
            id: 'subtle-2',
            color: 'hsl(var(--accent-start))',
            size: 500,
            x: 90,
            y: 90,
            blur: 100,
            opacity: 0.05,
            animationDuration: 30,
        },
    ];

    return (
        <GradientMesh orbs={subtleOrbs} blur="3xl" animate containerClassName={className}>
            {children}
        </GradientMesh>
    );
}

/**
 * HeroGradientMesh Component
 * 
 * A prominent gradient mesh for hero sections.
 * Uses higher opacity and multiple orbs for visual impact.
 */
export function HeroGradientMesh({ children }: { children?: React.ReactNode }) {
    const heroOrbs: GradientOrb[] = [
        {
            id: 'hero-1',
            color: 'hsl(var(--primary))',
            size: 700,
            x: 0,
            y: 0,
            blur: 80,
            opacity: 0.2,
            animationDuration: 20,
        },
        {
            id: 'hero-2',
            color: 'hsl(var(--accent-start))',
            size: 600,
            x: 100,
            y: 100,
            blur: 80,
            opacity: 0.15,
            animationDuration: 25,
        },
        {
            id: 'hero-3',
            color: 'hsl(var(--accent-mid))',
            size: 500,
            x: 50,
            y: 50,
            blur: 90,
            opacity: 0.1,
            animationDuration: 30,
        },
    ];

    return (
        <GradientMesh orbs={heroOrbs} blur="xl" animate>
            {children}
        </GradientMesh>
    );
}

/**
 * CardGradientMesh Component
 * 
 * A subtle gradient mesh for card backgrounds.
 * Uses smaller orbs and lower opacity.
 */
export function CardGradientMesh({ children }: { children?: React.ReactNode }) {
    const cardOrbs: GradientOrb[] = [
        {
            id: 'card-1',
            color: 'hsl(var(--primary))',
            size: 300,
            x: 0,
            y: 0,
            blur: 60,
            opacity: 0.08,
        },
        {
            id: 'card-2',
            color: 'hsl(var(--accent-start))',
            size: 250,
            x: 100,
            y: 100,
            blur: 60,
            opacity: 0.06,
        },
    ];

    return (
        <GradientMesh orbs={cardOrbs} blur="lg" animate={false}>
            {children}
        </GradientMesh>
    );
}
