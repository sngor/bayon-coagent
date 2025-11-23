'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * 3D Interactive Metric Cards
 * 
 * Features:
 * - 3D perspective transforms
 * - Mouse tracking for interactive tilt
 * - Floating animations
 * - Gradient backgrounds with depth
 * - Animated counters
 * - Glow effects
 * - Particle animations
 */

interface Metric3DCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
    intensity?: 'subtle' | 'medium' | 'strong';
    glowColor?: string;
    particleEffect?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
    sm: {
        padding: 'p-4',
        iconSize: 'w-8 h-8',
        titleSize: 'text-sm',
        valueSize: 'text-xl',
        changeSize: 'text-xs',
    },
    md: {
        padding: 'p-6',
        iconSize: 'w-10 h-10',
        titleSize: 'text-base',
        valueSize: 'text-2xl',
        changeSize: 'text-sm',
    },
    lg: {
        padding: 'p-8',
        iconSize: 'w-12 h-12',
        titleSize: 'text-lg',
        valueSize: 'text-3xl',
        changeSize: 'text-base',
    },
};

const intensityConfig = {
    subtle: { maxTilt: 3, scale: 1.02, shadowBlur: 8 },
    medium: { maxTilt: 6, scale: 1.05, shadowBlur: 12 },
    strong: { maxTilt: 10, scale: 1.08, shadowBlur: 16 },
};

/**
 * Animated Counter Component
 */
const SimpleCounter: React.FC<{
    value: string | number;
    className?: string;
}> = ({ value, className }) => {
    return (
        <span className={className}>
            {typeof value === 'string' ? value : value.toLocaleString()}
        </span>
    );
};

/**
 * Particle Effect Component
 */
const ParticleEffect: React.FC<{
    color: string;
    count?: number;
    isActive: boolean;
}> = ({ color, count = 8, isActive }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full opacity-60"
                    style={{
                        backgroundColor: color,
                        left: '50%',
                        top: '50%',
                    }}
                    animate={{
                        x: [0, Math.cos(i * 45 * Math.PI / 180) * 30],
                        y: [0, Math.sin(i * 45 * Math.PI / 180) * 30],
                        opacity: [0, 0.8, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeOut"
                    }}
                />
            ))}
        </div>
    );
};

/**
 * Main 3D Metric Card Component
 */
export const Metric3DCard: React.FC<Metric3DCardProps> = ({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    trend = 'neutral',
    className,
    intensity = 'medium',
    glowColor,
    particleEffect = false,
    size = 'md',
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const config = intensityConfig[intensity];
    const sizeStyles = sizeConfig[size];

    // Spring animations for smooth movement
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [config.maxTilt, -config.maxTilt]), {
        stiffness: 300,
        damping: 30,
    });

    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-config.maxTilt, config.maxTilt]), {
        stiffness: 300,
        damping: 30,
    });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX.set((event.clientX - centerX) / rect.width);
        mouseY.set((event.clientY - centerY) / rect.height);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600 dark:text-green-400';
            case 'down':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-muted-foreground';
        }
    };

    const getGradientColors = () => {
        switch (trend) {
            case 'up':
                return 'from-green-50 via-emerald-50 to-green-100 dark:from-green-950 dark:via-emerald-950 dark:to-green-900';
            case 'down':
                return 'from-red-50 via-rose-50 to-red-100 dark:from-red-950 dark:via-rose-950 dark:to-red-900';
            default:
                return 'from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-950 dark:via-indigo-950 dark:to-blue-900';
        }
    };

    const defaultGlowColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#3b82f6';

    return (
        <motion.div
            className={cn(
                'relative cursor-pointer select-none',
                className
            )}
            style={{
                perspective: '1000px',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.div
                className={cn(
                    'relative overflow-hidden rounded-xl border bg-gradient-to-br shadow-lg transition-all duration-300',
                    getGradientColors(),
                    sizeStyles.padding
                )}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                animate={{
                    scale: isHovered ? config.scale : 1,
                    boxShadow: isHovered
                        ? `0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)`
                        : `0 4px 6px rgba(0,0,0,0.05)`,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
            >
                {/* Glow effect */}
                {(glowColor || isHovered) && (
                    <motion.div
                        className="absolute inset-0 rounded-xl opacity-0"
                        style={{
                            background: `radial-gradient(circle at center, ${glowColor || defaultGlowColor}20 0%, transparent 70%)`,
                        }}
                        animate={{
                            opacity: isHovered ? 0.6 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                    />
                )}

                {/* Particle effect */}
                <ParticleEffect
                    color={glowColor || defaultGlowColor}
                    isActive={particleEffect && isHovered}
                />

                {/* Floating background elements */}
                <motion.div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10"
                    style={{
                        background: `radial-gradient(circle, ${glowColor || defaultGlowColor} 0%, transparent 70%)`,
                    }}
                    animate={{}}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <motion.h3
                            className={cn(
                                'font-medium text-muted-foreground',
                                sizeStyles.titleSize
                            )}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            {title}
                        </motion.h3>

                        <motion.div
                            className={cn(
                                'rounded-lg p-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm',
                                sizeStyles.iconSize
                            )}
                            animate={{}}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            whileHover={{
                                scale: 1.1,
                                rotate: 10,
                            }}
                        >
                            <Icon className="w-full h-full text-foreground/80" />
                        </motion.div>
                    </div>

                    {/* Value */}
                    <SimpleCounter
                        value={value}
                        className={cn(
                            'font-bold text-foreground block mb-2',
                            sizeStyles.valueSize
                        )}
                    />

                    {/* Change indicator */}
                    {change !== undefined && (
                        <motion.div
                            className={cn(
                                'flex items-center gap-1',
                                sizeStyles.changeSize,
                                getTrendColor()
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <motion.span
                                animate={{}}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                            </motion.span>
                            <span className="font-medium">
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-muted-foreground">
                                    {changeLabel}
                                </span>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* 3D depth shadow */}
                <motion.div
                    className="absolute inset-0 rounded-xl opacity-0"
                    style={{
                        background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
                        transform: 'translateZ(-10px)',
                    }}
                    animate={{
                        opacity: isHovered ? 0.3 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    );
};

/**
 * Specialized metric cards for different use cases
 */

export const RevenueMetric3DCard: React.FC<Omit<Metric3DCardProps, 'glowColor' | 'trend'> & {
    revenue: number;
    previousRevenue?: number;
}> = ({ revenue, previousRevenue, ...props }) => {
    const change = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : undefined;
    const trend = change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral';

    return (
        <Metric3DCard
            {...props}
            value={`$${revenue.toLocaleString()}`}
            change={change ? Math.round(change * 10) / 10 : undefined}
            trend={trend}
            glowColor="#10b981"
            particleEffect={trend === 'up'}
        />
    );
};

export const EngagementMetric3DCard: React.FC<Omit<Metric3DCardProps, 'glowColor' | 'trend'> & {
    rate: number;
    previousRate?: number;
}> = ({ rate, previousRate, ...props }) => {
    const change = previousRate ? ((rate - previousRate) / previousRate) * 100 : undefined;
    const trend = change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral';

    return (
        <Metric3DCard
            {...props}
            value={`${rate.toFixed(1)}%`}
            change={change ? Math.round(change * 10) / 10 : undefined}
            trend={trend}
            glowColor="#3b82f6"
            particleEffect={rate > 5} // Show particles for high engagement
        />
    );
};

export const GrowthMetric3DCard: React.FC<Omit<Metric3DCardProps, 'glowColor' | 'trend'> & {
    current: number;
    previous: number;
}> = ({ current, previous, ...props }) => {
    const change = ((current - previous) / previous) * 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    return (
        <Metric3DCard
            {...props}
            value={current.toLocaleString()}
            change={Math.round(change * 10) / 10}
            trend={trend}
            glowColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
            particleEffect={Math.abs(change) > 10} // Show particles for significant changes
        />
    );
};

export default {
    Metric3DCard,
    RevenueMetric3DCard,
    EngagementMetric3DCard,
    GrowthMetric3DCard,
};