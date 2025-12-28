'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils/common';

/**
 * 3D Interactive Icons with advanced animations
 * 
 * These icons feature:
 * - 3D perspective transforms
 * - Mouse tracking for interactive tilt
 * - Floating animations
 * - Particle effects
 * - Depth shadows
 * - Smooth spring animations
 */

interface Interactive3DIconProps extends LucideProps {
    animated?: boolean;
    intensity?: 'subtle' | 'medium' | 'strong';
    floatingAnimation?: boolean;
    particleEffect?: boolean;
    glowEffect?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

const intensityConfig = {
    subtle: { maxTilt: 5, scale: 1.05, shadowBlur: 10 },
    medium: { maxTilt: 10, scale: 1.1, shadowBlur: 15 },
    strong: { maxTilt: 15, scale: 1.15, shadowBlur: 20 },
};

/**
 * Base 3D Interactive Icon Component
 */
const Interactive3DIcon: React.FC<{
    children: React.ReactNode;
    className?: string;
    intensity?: 'subtle' | 'medium' | 'strong';
    floatingAnimation?: boolean;
    glowEffect?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({
    children,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md'
}) => {
        const [isHovered, setIsHovered] = useState(false);
        const mouseX = useMotionValue(0);
        const mouseY = useMotionValue(0);

        const config = intensityConfig[intensity];

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

        return (
            <motion.div
                className={cn(
                    'relative inline-block cursor-pointer',
                    sizeClasses[size],
                    className
                )}
                style={{
                    perspective: '1000px',
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                animate={floatingAnimation ? {
                    y: [0, -4, 0],
                } : {}}
                transition={floatingAnimation ? {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : {}}
            >
                <motion.div
                    className="relative"
                    style={{
                        rotateX,
                        rotateY,
                        transformStyle: 'preserve-3d',
                    }}
                    animate={{
                        scale: isHovered ? config.scale : 1,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                >
                    {/* Glow effect */}
                    {glowEffect && (
                        <motion.div
                            className="absolute inset-0 rounded-full blur-md opacity-0"
                            style={{
                                background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
                            }}
                            animate={{
                                opacity: isHovered ? 0.3 : 0,
                                scale: isHovered ? 1.5 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    )}

                    {/* Shadow */}
                    <motion.div
                        className="absolute inset-0 rounded-full opacity-0"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                            transform: 'translateZ(-10px) scale(0.9)',
                            filter: `blur(${config.shadowBlur}px)`,
                        }}
                        animate={{
                            opacity: isHovered ? 0.4 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                    />

                    {/* Main icon */}
                    <motion.div
                        className="relative z-10"
                        style={{
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            </motion.div>
        );
    };

/**
 * 3D House Icon with architectural depth
 */
export const House3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* House structure with depth */}
            <motion.path
                d="M3 12l9-9 9 9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
            <motion.path
                d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
            />
            <motion.path
                d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeInOut" }}
            />
            {/* Windows with depth */}
            <motion.rect
                x="7" y="12" width="2" height="2" rx="0.5"
                initial={{ scale: 0 }}
                animate={{ scale: animated ? 1 : 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            />
            <motion.rect
                x="15" y="12" width="2" height="2" rx="0.5"
                initial={{ scale: 0 }}
                animate={{ scale: animated ? 1 : 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            />
        </svg>
    </Interactive3DIcon>
);

/**
 * 3D Chart Icon with data visualization depth
 */
export const Chart3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* Animated bars growing from bottom */}
            <motion.rect
                x="3" y="16" width="4" height="5"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: animated ? 1 : 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
            />
            <motion.rect
                x="10" y="12" width="4" height="9"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: animated ? 1 : 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.rect
                x="17" y="8" width="4" height="13"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: animated ? 1 : 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
            />
            {/* Trend line */}
            <motion.path
                d="M5 18L12 10L19 6"
                strokeWidth="3"
                stroke="url(#chartGradient)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{ duration: 1.5, delay: 0.8 }}
            />
            <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                </linearGradient>
            </defs>
        </svg>
    </Interactive3DIcon>
);

/**
 * 3D AI Sparkle Icon with particle effects
 */
export const AISparkle3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = true,
    size = 'md',
    particleEffect = true,
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <div className="relative w-full h-full">
            {/* Particle effects */}
            {particleEffect && animated && (
                <>
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-current rounded-full opacity-60"
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            animate={{
                                x: [0, Math.cos(i * 60 * Math.PI / 180) * 20],
                                y: [0, Math.sin(i * 60 * Math.PI / 180) * 20],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </>
            )}

            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full relative z-10"
                {...props}
            >
                {/* Central core */}
                <motion.circle
                    cx="12" cy="12" r="3"
                    animate={animated ? {
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Rotating rays */}
                <motion.g
                    animate={animated ? { rotate: 360 } : {}}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{ originX: '12px', originY: '12px' }}
                >
                    <path d="M12 3v3" />
                    <path d="M12 18v3" />
                    <path d="M3 12h3" />
                    <path d="M18 12h3" />
                </motion.g>

                {/* Counter-rotating diagonal rays */}
                <motion.g
                    animate={animated ? { rotate: -360 } : {}}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{ originX: '12px', originY: '12px' }}
                >
                    <path d="m5.6 5.6 2.1 2.1" />
                    <path d="m16.3 16.3 2.1 2.1" />
                    <path d="m5.6 18.4 2.1-2.1" />
                    <path d="m16.3 7.7 2.1-2.1" />
                </motion.g>
            </svg>
        </div>
    </Interactive3DIcon>
);

/**
 * 3D Success Icon with celebration effect
 */
export const Success3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = true,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* Animated circle */}
            <motion.circle
                cx="12" cy="12" r="10"
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                    scale: animated ? 1 : 1,
                    rotate: animated ? 0 : 0,
                }}
                transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                }}
            />

            {/* Animated checkmark */}
            <motion.path
                d="m9 12 2 2 4-4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: "easeInOut"
                }}
            />
        </svg>
    </Interactive3DIcon>
);

/**
 * 3D Target Icon with focus rings
 */
export const Target3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* Outer ring */}
            <motion.circle
                cx="12" cy="12" r="10"
                animate={animated ? {
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 0.8, 0.6],
                } : {}}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Middle ring */}
            <motion.circle
                cx="12" cy="12" r="6"
                animate={animated ? {
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                } : {}}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.3,
                    ease: "easeInOut"
                }}
            />

            {/* Inner ring */}
            <motion.circle
                cx="12" cy="12" r="2"
                animate={animated ? {
                    scale: [1, 1.2, 1],
                } : {}}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.6,
                    ease: "easeInOut"
                }}
            />
        </svg>
    </Interactive3DIcon>
);

/**
 * 3D Users Icon with connection lines
 */
export const Users3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* Connection lines */}
            <motion.path
                d="M9 7h7M9 21h7"
                strokeDasharray="2 2"
                opacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* First user */}
            <motion.g
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
            </motion.g>

            {/* Second user */}
            <motion.g
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </motion.g>
        </svg>
    </Interactive3DIcon>
);

/**
 * 3D Content Icon with document layers
 */
export const Content3DIcon: React.FC<Interactive3DIconProps> = ({
    animated = true,
    className,
    intensity = 'medium',
    floatingAnimation = true,
    glowEffect = false,
    size = 'md',
    ...props
}) => (
    <Interactive3DIcon
        className={className}
        intensity={intensity}
        floatingAnimation={floatingAnimation && animated}
        glowEffect={glowEffect}
        size={size}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            {...props}
        >
            {/* Background document layer */}
            <motion.rect
                x="4" y="4" width="16" height="16" rx="2"
                opacity="0.3"
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{
                    scale: animated ? 1 : 1,
                    rotate: animated ? 0 : 0,
                }}
                transition={{ duration: 0.6 }}
            />

            {/* Main document */}
            <motion.rect
                x="3" y="3" width="18" height="18" rx="2"
                initial={{ scale: 0 }}
                animate={{ scale: animated ? 1 : 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* Text lines with staggered animation */}
            <motion.path
                d="M7 7h10"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: animated ? 1 : 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                style={{ originX: '7px' }}
            />
            <motion.path
                d="M7 12h10"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: animated ? 1 : 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                style={{ originX: '7px' }}
            />
            <motion.path
                d="M7 17h6"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: animated ? 1 : 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                style={{ originX: '7px' }}
            />

            {/* Highlight dot */}
            <motion.path
                d="M17 17h.01"
                initial={{ scale: 0 }}
                animate={{ scale: animated ? [0, 1.5, 1] : 1 }}
                transition={{ duration: 0.6, delay: 1 }}
            />
        </svg>
    </Interactive3DIcon>
);

export default {
    House3DIcon,
    Chart3DIcon,
    AISparkle3DIcon,
    Success3DIcon,
    Target3DIcon,
    Users3DIcon,
    Content3DIcon,
};