'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 3D Dashboard Layout with Interactive Animations
 * 
 * Features:
 * - Parallax scrolling effects
 * - Staggered card animations
 * - Interactive hover zones
 * - Floating elements
 * - Depth-based layering
 * - Smooth transitions between states
 */

interface Dashboard3DLayoutProps {
    children: React.ReactNode;
    className?: string;
    enableParallax?: boolean;
    staggerDelay?: number;
    floatingElements?: boolean;
}

/**
 * Floating Background Elements
 */
const FloatingElements: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Geometric shapes */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute opacity-5 dark:opacity-10"
                    style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${10 + (i * 12)}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 180, 360],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                    }}
                >
                    {i % 3 === 0 ? (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600" />
                    ) : i % 3 === 1 ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 transform rotate-45" />
                    ) : (
                        <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                    )}
                </motion.div>
            ))}

            {/* Particle dots */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={`dot-${i}`}
                    className="absolute w-2 h-2 rounded-full bg-primary/20"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
        </div>
    );
};

/**
 * Staggered Container for Child Elements
 */
const StaggeredContainer: React.FC<{
    children: React.ReactNode;
    staggerDelay: number;
    className?: string;
}> = ({ children, staggerDelay, className }) => {
    const childrenArray = React.Children.toArray(children);

    return (
        <div className={className}>
            {childrenArray.map((child, index) => (
                <motion.div
                    key={index}
                    initial={{
                        opacity: 0,
                        y: 40,
                        rotateX: -15,
                        scale: 0.95,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.8,
                        delay: index * staggerDelay,
                        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                    }}
                    style={{
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
};

/**
 * Parallax Section Component
 */
const ParallaxSection: React.FC<{
    children: React.ReactNode;
    offset?: number;
    className?: string;
}> = ({ children, offset = 0.5, className }) => {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 1000], [0, -1000 * offset]);

    return (
        <motion.div
            style={{ y }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/**
 * Interactive Hover Zone
 */
const InteractiveZone: React.FC<{
    children: React.ReactNode;
    className?: string;
    intensity?: 'subtle' | 'medium' | 'strong';
}> = ({ children, className, intensity = 'medium' }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const intensityConfig = {
        subtle: { tilt: 2, scale: 1.01, glow: 0.1 },
        medium: { tilt: 5, scale: 1.02, glow: 0.2 },
        strong: { tilt: 8, scale: 1.05, glow: 0.3 },
    };

    const config = intensityConfig[intensity];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setMousePosition({
            x: (e.clientX - centerX) / rect.width,
            y: (e.clientY - centerY) / rect.height,
        });
    };

    return (
        <motion.div
            className={cn('relative', className)}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setMousePosition({ x: 0, y: 0 });
            }}
            animate={{
                rotateY: mousePosition.x * config.tilt,
                rotateX: -mousePosition.y * config.tilt,
                scale: isHovered ? config.scale : 1,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
            style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
            }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                }}
                animate={{
                    opacity: isHovered ? config.glow : 0,
                }}
                transition={{ duration: 0.3 }}
            />

            {children}
        </motion.div>
    );
};

/**
 * Main 3D Dashboard Layout Component
 */
export const Dashboard3DLayout: React.FC<Dashboard3DLayoutProps> = ({
    children,
    className,
    enableParallax = true,
    staggerDelay = 0.1,
    floatingElements = true,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Trigger animations after component mounts
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const containerVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            rotateX: -10,
        },
        visible: {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            transition: {
                duration: 1,
                ease: [0.25, 0.46, 0.45, 0.94],
                staggerChildren: staggerDelay,
            }
        }
    };

    const ContentWrapper = enableParallax ? ParallaxSection : React.Fragment;
    const wrapperProps = enableParallax ? { offset: 0.2 } : {};

    return (
        <motion.div
            className={cn(
                'relative min-h-screen',
                className
            )}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={containerVariants}
            style={{
                perspective: '2000px',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Floating background elements */}
            <FloatingElements isVisible={floatingElements && isLoaded} />

            {/* Main content area */}
            <ContentWrapper {...wrapperProps}>
                <div className="relative z-10">
                    <StaggeredContainer
                        staggerDelay={staggerDelay}
                        className="space-y-6 md:space-y-8"
                    >
                        {children}
                    </StaggeredContainer>
                </div>
            </ContentWrapper>

            {/* Ambient lighting effect */}
            <motion.div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                }}
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </motion.div>
    );
};

/**
 * 3D Grid Layout for Cards
 */
export const Grid3DLayout: React.FC<{
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
    staggered?: boolean;
}> = ({
    children,
    columns = 3,
    gap = 'md',
    className,
    staggered = true
}) => {
        const gapClasses = {
            sm: 'gap-4',
            md: 'gap-6',
            lg: 'gap-8',
        };

        const columnClasses = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        };

        const childrenArray = React.Children.toArray(children);

        return (
            <div className={cn(
                'grid',
                columnClasses[columns],
                gapClasses[gap],
                className
            )}>
                {staggered ? (
                    childrenArray.map((child, index) => (
                        <InteractiveZone
                            key={index}
                            intensity="medium"
                            className="h-full"
                        >
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 30,
                                    rotateY: -15,
                                    scale: 0.9,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    rotateY: 0,
                                    scale: 1,
                                }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    ease: "easeOut",
                                }}
                                className="h-full"
                            >
                                {child}
                            </motion.div>
                        </InteractiveZone>
                    ))
                ) : (
                    children
                )}
            </div>
        );
    };

/**
 * 3D Section with Depth
 */
export const Section3D: React.FC<{
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
    depth?: 'shallow' | 'medium' | 'deep';
}> = ({
    children,
    title,
    description,
    className,
    depth = 'medium'
}) => {
        const depthConfig = {
            shallow: { translateZ: '10px', shadow: '0 4px 8px rgba(0,0,0,0.1)' },
            medium: { translateZ: '20px', shadow: '0 8px 16px rgba(0,0,0,0.15)' },
            deep: { translateZ: '40px', shadow: '0 16px 32px rgba(0,0,0,0.2)' },
        };

        const config = depthConfig[depth];

        return (
            <motion.section
                className={cn(
                    'relative',
                    className
                )}
                initial={{
                    opacity: 0,
                    y: 40,
                    rotateX: -10,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                }}
                transition={{
                    duration: 0.8,
                    ease: "easeOut",
                }}
                style={{
                    transform: `translateZ(${config.translateZ})`,
                    boxShadow: config.shadow,
                    transformStyle: 'preserve-3d',
                }}
            >
                {(title || description) && (
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {title && (
                            <h2 className="text-2xl font-bold tracking-tight mb-2">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </motion.div>
                )}

                {children}
            </motion.section>
        );
    };

export default {
    Dashboard3DLayout,
    Grid3DLayout,
    Section3D,
    InteractiveZone,
};