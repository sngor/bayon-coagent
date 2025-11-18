'use client';

import { motion, type Variants } from 'framer-motion';
import { type SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
    animated?: boolean;
    className?: string;
}

// Animation variants for consistent motion
const iconVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20
        }
    },
    hover: {
        scale: 1.1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    },
    tap: { scale: 0.95 }
};

const pathVariants: Variants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: 'easeInOut'
        }
    }
};

/**
 * Custom animated house icon for real estate branding
 * Represents home, property, and real estate listings
 */
export function HouseIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            <motion.path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                variants={pathVariants}
            />
            <motion.polyline
                points="9 22 9 12 15 12 15 22"
                variants={pathVariants}
                transition={{ delay: 0.2 }}
            />
        </motion.svg>
    );
}

/**
 * Custom animated chart icon for analytics and metrics
 * Represents market trends, statistics, and performance data
 */
export function ChartIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            <motion.line
                x1="6"
                y1="20"
                x2="6"
                y2="14"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            />
            <motion.line
                x1="12"
                y1="20"
                x2="12"
                y2="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            />
            <motion.line
                x1="18"
                y1="20"
                x2="18"
                y2="10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            />
        </motion.svg>
    );
}

/**
 * Custom animated users icon for client management
 * Represents clients, contacts, and community
 */
export function UsersIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            <motion.circle
                cx="9"
                cy="7"
                r="4"
                variants={pathVariants}
            />
            <motion.path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                variants={pathVariants}
                transition={{ delay: 0.2 }}
            />
            <motion.path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                variants={pathVariants}
                transition={{ delay: 0.3 }}
            />
            <motion.path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                variants={pathVariants}
                transition={{ delay: 0.4 }}
            />
        </motion.svg>
    );
}

/**
 * Custom animated content icon for marketing materials
 * Represents blog posts, social media, and content creation
 */
export function ContentIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            <motion.path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                variants={pathVariants}
            />
            <motion.polyline
                points="14 2 14 8 20 8"
                variants={pathVariants}
                transition={{ delay: 0.2 }}
            />
            <motion.line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
            />
            <motion.line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
            />
        </motion.svg>
    );
}

/**
 * Custom animated tools icon for platform features
 * Represents settings, utilities, and tools
 */
export function ToolsIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            {...props}
        >
            <motion.path
                d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                variants={pathVariants}
            />
        </motion.svg>
    );
}

/**
 * Custom animated AI sparkle icon for AI features
 * Represents AI operations, intelligence, and automation
 */
export function AISparkleIcon({ animated = true, className = 'w-6 h-6', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={className}
                {...props}
            >
                <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            {...props}
        >
            <defs>
                <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(260 60% 55%)" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
            </defs>
            <motion.path
                d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"
                fill="url(#sparkle-gradient)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 10
                }}
            />
        </motion.svg>
    );
}

/**
 * Custom animated success checkmark icon
 * Represents successful operations and achievements
 */
export function SuccessIcon({ animated = true, className = 'w-12 h-12 text-success', ...props }: IconProps) {
    if (!animated) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            {...props}
        >
            <motion.circle
                cx="12"
                cy="12"
                r="10"
                fill="currentColor"
                opacity={0.2}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
            />
            <motion.path
                d="M9 12l2 2 4-4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            />
        </motion.svg>
    );
}

/**
 * Illustrated empty state icon for "no data" scenarios
 * Friendly and professional illustration style
 */
export function EmptyStateHouseIcon({ className = 'w-24 h-24', ...props }: IconProps) {
    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {/* Background circle */}
            <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="hsl(var(--primary) / 0.1)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            />

            {/* House illustration */}
            <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
                {/* Roof */}
                <path
                    d="M35 55L60 35L85 55"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* House body */}
                <rect
                    x="40"
                    y="55"
                    width="40"
                    height="30"
                    rx="2"
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                />

                {/* Door */}
                <rect
                    x="52"
                    y="65"
                    width="16"
                    height="20"
                    rx="1"
                    fill="hsl(var(--primary))"
                />

                {/* Window */}
                <rect
                    x="45"
                    y="60"
                    width="8"
                    height="8"
                    rx="1"
                    fill="hsl(var(--primary) / 0.3)"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                />
            </motion.g>
        </motion.svg>
    );
}

/**
 * Illustrated empty state icon for content/documents
 */
export function EmptyStateContentIcon({ className = 'w-24 h-24', ...props }: IconProps) {
    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {/* Background circle */}
            <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="hsl(var(--primary) / 0.1)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            />

            {/* Document illustration */}
            <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
                {/* Document */}
                <rect
                    x="40"
                    y="30"
                    width="40"
                    height="55"
                    rx="3"
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                />

                {/* Lines */}
                <line x1="48" y1="45" x2="72" y2="45" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                <line x1="48" y1="55" x2="72" y2="55" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                <line x1="48" y1="65" x2="65" y2="65" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
        </motion.svg>
    );
}

/**
 * Illustrated empty state icon for analytics/charts
 */
export function EmptyStateChartIcon({ className = 'w-24 h-24', ...props }: IconProps) {
    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {/* Background circle */}
            <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="hsl(var(--primary) / 0.1)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            />

            {/* Chart illustration */}
            <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
                {/* Bars */}
                <motion.rect
                    x="40"
                    y="60"
                    width="10"
                    height="20"
                    rx="2"
                    fill="hsl(var(--primary))"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ transformOrigin: 'bottom' }}
                />
                <motion.rect
                    x="55"
                    y="50"
                    width="10"
                    height="30"
                    rx="2"
                    fill="hsl(var(--primary))"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ transformOrigin: 'bottom' }}
                />
                <motion.rect
                    x="70"
                    y="40"
                    width="10"
                    height="40"
                    rx="2"
                    fill="hsl(var(--primary))"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ transformOrigin: 'bottom' }}
                />
            </motion.g>
        </motion.svg>
    );
}
