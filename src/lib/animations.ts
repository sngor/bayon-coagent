/**
 * Micro-animation utilities and Framer Motion variants
 * Provides consistent, delightful animations throughout the app
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const easings = {
    smooth: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    spring: [0.175, 0.885, 0.32, 1.275],
    snappy: [0.25, 0.46, 0.45, 0.94],
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
    fast: { duration: 0.15, ease: easings.smooth },
    base: { duration: 0.25, ease: easings.smooth },
    slow: { duration: 0.35, ease: easings.smooth },
    bounce: { duration: 0.5, ease: easings.bounce },
    spring: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
    },
    springBouncy: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 20,
    },
} as const;

// ============================================================================
// FADE VARIANTS
// ============================================================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.base },
    exit: { opacity: 0, transition: transitions.fast },
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: transitions.base },
    exit: { opacity: 0, y: -10, transition: transitions.fast },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: transitions.base },
    exit: { opacity: 0, y: 10, transition: transitions.fast },
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: transitions.base },
    exit: { opacity: 0, x: 10, transition: transitions.fast },
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: transitions.base },
    exit: { opacity: 0, x: -10, transition: transitions.fast },
};

// ============================================================================
// SCALE VARIANTS
// ============================================================================

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: transitions.spring },
    exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

export const scaleBounce: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: transitions.springBouncy },
    exit: { opacity: 0, scale: 0.9, transition: transitions.fast },
};

export const scaleInCenter: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1, transition: transitions.spring },
    exit: { opacity: 0, scale: 0, transition: transitions.fast },
};

// ============================================================================
// SLIDE VARIANTS
// ============================================================================

export const slideInUp: Variants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: transitions.spring },
    exit: { y: '100%', opacity: 0, transition: transitions.base },
};

export const slideInDown: Variants = {
    hidden: { y: '-100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: transitions.spring },
    exit: { y: '-100%', opacity: 0, transition: transitions.base },
};

export const slideInLeft: Variants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: transitions.spring },
    exit: { x: '-100%', opacity: 0, transition: transitions.base },
};

export const slideInRight: Variants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: transitions.spring },
    exit: { x: '100%', opacity: 0, transition: transitions.base },
};

// ============================================================================
// STAGGER VARIANTS
// ============================================================================

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: transitions.base },
    exit: { opacity: 0, y: -5, transition: transitions.fast },
};

export const staggerItemScale: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: transitions.spring },
    exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

// ============================================================================
// CARD VARIANTS
// ============================================================================

export const cardHover: Variants = {
    rest: { scale: 1, y: 0 },
    hover: {
        scale: 1.02,
        y: -4,
        transition: transitions.spring,
    },
    tap: { scale: 0.98, transition: transitions.fast },
};

export const cardLift: Variants = {
    rest: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: {
        y: -8,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        transition: transitions.spring,
    },
};

export const cardGlow: Variants = {
    rest: { boxShadow: '0 0 0 0 rgba(var(--primary-rgb), 0)' },
    hover: {
        boxShadow: '0 0 20px 0 rgba(var(--primary-rgb), 0.3)',
        transition: transitions.base,
    },
};

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

export const buttonTap: Variants = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: transitions.fast },
    tap: { scale: 0.95, transition: transitions.fast },
};

export const buttonPress: Variants = {
    rest: { scale: 1 },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export const buttonGlow: Variants = {
    rest: { boxShadow: '0 0 0 0 rgba(var(--primary-rgb), 0)' },
    hover: {
        boxShadow: '0 0 20px 0 rgba(var(--primary-rgb), 0.5)',
        transition: transitions.base,
    },
};

// ============================================================================
// ICON VARIANTS
// ============================================================================

export const iconSpin: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

export const iconBounce: Variants = {
    rest: { scale: 1 },
    hover: {
        scale: [1, 1.2, 1],
        transition: {
            duration: 0.4,
            times: [0, 0.5, 1],
            ease: easings.bounce,
        },
    },
};

export const iconPulse: Variants = {
    animate: {
        scale: [1, 1.1, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const iconShake: Variants = {
    animate: {
        x: [0, -2, 2, -2, 2, 0],
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
    },
};

// ============================================================================
// NOTIFICATION VARIANTS
// ============================================================================

export const notificationSlide: Variants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: transitions.spring,
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: transitions.base,
    },
};

export const notificationBounce: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: transitions.springBouncy,
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: transitions.fast,
    },
};

// ============================================================================
// MODAL/DIALOG VARIANTS
// ============================================================================

export const modalOverlay: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.fast },
    exit: { opacity: 0, transition: transitions.fast },
};

export const modalContent: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: transitions.spring,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: transitions.fast,
    },
};

export const drawerSlide: Variants = {
    hidden: { x: '100%' },
    visible: { x: 0, transition: transitions.spring },
    exit: { x: '100%', transition: transitions.base },
};

// ============================================================================
// LOADING VARIANTS
// ============================================================================

export const loadingDots: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const loadingPulse: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const shimmer: Variants = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// ============================================================================
// SUCCESS/ERROR FEEDBACK VARIANTS
// ============================================================================

export const successPing: Variants = {
    initial: { scale: 1, opacity: 1 },
    animate: {
        scale: [1, 1.5, 1.5],
        opacity: [1, 0.5, 0],
        transition: {
            duration: 0.6,
            times: [0, 0.5, 1],
        },
    },
};

export const successCheck: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: { duration: 0.5, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
        },
    },
};

export const errorShake: Variants = {
    animate: {
        x: [0, -10, 10, -10, 10, 0],
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
    },
};

// ============================================================================
// LIST VARIANTS
// ============================================================================

export const listContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const listItem: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: transitions.base,
    },
};

// ============================================================================
// HOVER EFFECTS
// ============================================================================

export const hoverScale = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: transitions.fast },
};

export const hoverLift = {
    rest: { y: 0 },
    hover: { y: -4, transition: transitions.spring },
};

export const hoverGlow = {
    rest: { filter: 'brightness(1)' },
    hover: { filter: 'brightness(1.1)', transition: transitions.base },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a stagger container with custom delay
 */
export const createStaggerContainer = (staggerDelay = 0.1): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.05,
        },
    },
});

/**
 * Create a custom fade in variant with configurable direction
 */
export const createFadeIn = (
    direction: 'up' | 'down' | 'left' | 'right' | 'none' = 'none',
    distance = 20
): Variants => {
    const offset = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
        none: {},
    };

    return {
        hidden: { opacity: 0, ...offset[direction] },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: transitions.base,
        },
    };
};

/**
 * Create a custom scale variant
 */
export const createScale = (from = 0.9, to = 1): Variants => ({
    hidden: { opacity: 0, scale: from },
    visible: {
        opacity: 1,
        scale: to,
        transition: transitions.spring,
    },
});
