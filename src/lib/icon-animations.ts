/**
 * Icon Animation Library
 * 
 * A comprehensive library of reusable animation variants for icons.
 * Provides consistent, accessible animations with controls for speed and style.
 * 
 * Features:
 * - Reusable animation variants
 * - Speed controls (slow, normal, fast)
 * - Style presets (subtle, normal, energetic)
 * - Accessibility support (respects reduced motion)
 * - Type-safe configuration
 */

import { type Variants, type Transition } from 'framer-motion';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Animation speed presets
 */
export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'instant';

/**
 * Animation style presets
 */
export type AnimationStyle = 'subtle' | 'normal' | 'energetic' | 'playful';

/**
 * Animation configuration
 */
export interface IconAnimationConfig {
  speed?: AnimationSpeed;
  style?: AnimationStyle;
  respectReducedMotion?: boolean;
  delay?: number;
}

/**
 * Timing configuration for different speeds
 */
interface SpeedConfig {
  duration: number;
  stiffness: number;
  damping: number;
}

// ============================================================================
// SPEED CONFIGURATIONS
// ============================================================================

/**
 * Speed presets with corresponding timing values
 */
export const SPEED_CONFIGS: Record<AnimationSpeed, SpeedConfig> = {
  instant: {
    duration: 0,
    stiffness: 500,
    damping: 30,
  },
  fast: {
    duration: 0.2,
    stiffness: 400,
    damping: 25,
  },
  normal: {
    duration: 0.4,
    stiffness: 300,
    damping: 20,
  },
  slow: {
    duration: 0.8,
    stiffness: 200,
    damping: 15,
  },
};

/**
 * Style presets with corresponding scale and intensity values
 */
export const STYLE_CONFIGS: Record<AnimationStyle, { scale: number; intensity: number }> = {
  subtle: {
    scale: 1.05,
    intensity: 0.5,
  },
  normal: {
    scale: 1.1,
    intensity: 1,
  },
  energetic: {
    scale: 1.2,
    intensity: 1.5,
  },
  playful: {
    scale: 1.3,
    intensity: 2,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get transition configuration based on speed and style
 */
export function getTransition(
  speed: AnimationSpeed = 'normal',
  type: 'spring' | 'tween' = 'spring'
): Transition {
  const config = SPEED_CONFIGS[speed];

  if (type === 'spring') {
    return {
      type: 'spring',
      stiffness: config.stiffness,
      damping: config.damping,
    };
  }

  return {
    type: 'tween',
    duration: config.duration,
    ease: 'easeInOut',
  };
}

/**
 * Apply reduced motion fallback if needed
 */
export function withReducedMotion<T extends Variants>(
  variants: T,
  respectReducedMotion: boolean = true
): T {
  if (!respectReducedMotion || !prefersReducedMotion()) {
    return variants;
  }

  // Return simplified variants for reduced motion
  const reducedVariants = {} as T;
  for (const key in variants) {
    reducedVariants[key] = {
      ...variants[key],
      transition: { duration: 0 },
    };
  }
  return reducedVariants;
}

// ============================================================================
// ENTRANCE ANIMATIONS
// ============================================================================

/**
 * Fade in animation
 */
export function createFadeInVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'normal', delay = 0 } = config;
  const transition = getTransition(speed, 'tween');

  return withReducedMotion(
    {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { ...transition, delay },
      },
      exit: { opacity: 0, transition },
    },
    config.respectReducedMotion
  );
}

/**
 * Scale in animation (pop effect)
 */
export function createScaleInVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'normal', delay = 0 } = config;
  const styleConfig = STYLE_CONFIGS[style];
  const transition = getTransition(speed);

  return withReducedMotion(
    {
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: { ...transition, delay },
      },
      exit: { scale: 0, opacity: 0, transition },
    },
    config.respectReducedMotion
  );
}

/**
 * Slide in from direction
 */
export function createSlideInVariants(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  config: IconAnimationConfig = {}
): Variants {
  const { speed = 'normal', delay = 0 } = config;
  const transition = getTransition(speed);

  const offsets = {
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  const offset = offsets[direction];

  return withReducedMotion(
    {
      initial: { ...offset, opacity: 0 },
      animate: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { ...transition, delay },
      },
      exit: { ...offset, opacity: 0, transition },
    },
    config.respectReducedMotion
  );
}

/**
 * Bounce in animation
 */
export function createBounceInVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'normal', delay = 0 } = config;
  const styleConfig = STYLE_CONFIGS[style];

  return withReducedMotion(
    {
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: [0, styleConfig.scale, 1],
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 10,
          delay,
        },
      },
      exit: { scale: 0, opacity: 0 },
    },
    config.respectReducedMotion
  );
}

// ============================================================================
// INTERACTION ANIMATIONS
// ============================================================================

/**
 * Hover animation variants
 */
export function createHoverVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'fast', style = 'normal' } = config;
  const styleConfig = STYLE_CONFIGS[style];
  const transition = getTransition(speed);

  return withReducedMotion(
    {
      initial: { scale: 1 },
      hover: {
        scale: styleConfig.scale,
        transition,
      },
      tap: { scale: 0.95, transition },
    },
    config.respectReducedMotion
  );
}

/**
 * Pulse animation (continuous)
 */
export function createPulseVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'subtle' } = config;
  const styleConfig = STYLE_CONFIGS[style];
  const speedConfig = SPEED_CONFIGS[speed];

  return withReducedMotion(
    {
      animate: {
        scale: [1, styleConfig.scale, 1],
        opacity: [1, 0.8, 1],
        transition: {
          duration: speedConfig.duration * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
    config.respectReducedMotion
  );
}

/**
 * Rotate animation (continuous)
 */
export function createRotateVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal' } = config;
  const speedConfig = SPEED_CONFIGS[speed];

  return withReducedMotion(
    {
      animate: {
        rotate: [0, 360],
        transition: {
          duration: speedConfig.duration * 5,
          repeat: Infinity,
          ease: 'linear',
        },
      },
    },
    config.respectReducedMotion
  );
}

/**
 * Wiggle animation (attention grabber)
 */
export function createWiggleVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'fast', style = 'playful' } = config;
  const speedConfig = SPEED_CONFIGS[speed];

  return withReducedMotion(
    {
      animate: {
        rotate: [0, -10, 10, -10, 10, 0],
        transition: {
          duration: speedConfig.duration * 2,
          ease: 'easeInOut',
        },
      },
    },
    config.respectReducedMotion
  );
}

// ============================================================================
// PATH DRAWING ANIMATIONS
// ============================================================================

/**
 * Path drawing animation for SVG paths
 */
export function createPathDrawVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', delay = 0 } = config;
  const speedConfig = SPEED_CONFIGS[speed];

  return withReducedMotion(
    {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: {
            duration: speedConfig.duration * 2,
            ease: 'easeInOut',
            delay,
          },
          opacity: {
            duration: speedConfig.duration * 0.5,
            delay,
          },
        },
      },
    },
    config.respectReducedMotion
  );
}

/**
 * Staggered path drawing for multiple paths
 */
export function createStaggeredPathVariants(
  pathCount: number,
  config: IconAnimationConfig = {}
): Variants[] {
  const { speed = 'normal' } = config;
  const speedConfig = SPEED_CONFIGS[speed];
  const staggerDelay = speedConfig.duration * 0.3;

  return Array.from({ length: pathCount }, (_, index) =>
    createPathDrawVariants({
      ...config,
      delay: index * staggerDelay,
    })
  );
}

// ============================================================================
// COMPOSITE ANIMATIONS
// ============================================================================

/**
 * Success animation (checkmark with celebration)
 */
export function createSuccessVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'energetic' } = config;
  const styleConfig = STYLE_CONFIGS[style];

  return withReducedMotion(
    {
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: [0, styleConfig.scale, 1],
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 10,
        },
      },
    },
    config.respectReducedMotion
  );
}

/**
 * Loading spinner animation
 */
export function createSpinnerVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'fast' } = config;
  const speedConfig = SPEED_CONFIGS[speed];

  return withReducedMotion(
    {
      animate: {
        rotate: 360,
        transition: {
          duration: speedConfig.duration * 2,
          repeat: Infinity,
          ease: 'linear',
        },
      },
    },
    config.respectReducedMotion
  );
}

/**
 * AI sparkle animation (rotate + pulse)
 */
export function createSparkleVariants(config: IconAnimationConfig = {}): Variants {
  const { speed = 'normal', style = 'energetic' } = config;
  const speedConfig = SPEED_CONFIGS[speed];
  const styleConfig = STYLE_CONFIGS[style];

  return withReducedMotion(
    {
      animate: {
        rotate: [0, 360],
        scale: [1, styleConfig.scale, 1],
        transition: {
          duration: speedConfig.duration * 7.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
    config.respectReducedMotion
  );
}

// ============================================================================
// PRESET COMBINATIONS
// ============================================================================

/**
 * Standard icon animation preset (entrance + hover)
 */
export const standardIconVariants = (config: IconAnimationConfig = {}): Variants => {
  const { speed = 'normal', style = 'normal', delay = 0 } = config;
  const styleConfig = STYLE_CONFIGS[style];
  const transition = getTransition(speed);

  return withReducedMotion(
    {
      initial: { scale: 0.8, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: { ...transition, delay },
      },
      hover: {
        scale: styleConfig.scale,
        transition: getTransition('fast'),
      },
      tap: { scale: 0.95 },
    },
    config.respectReducedMotion
  );
};

/**
 * Navigation icon preset (subtle entrance + hover)
 */
export const navigationIconVariants = (config: IconAnimationConfig = {}): Variants => {
  return standardIconVariants({ ...config, style: 'subtle', speed: 'fast' });
};

/**
 * Feature icon preset (energetic entrance + hover)
 */
export const featureIconVariants = (config: IconAnimationConfig = {}): Variants => {
  return standardIconVariants({ ...config, style: 'energetic', speed: 'normal' });
};

/**
 * Empty state icon preset (slow, gentle entrance)
 */
export const emptyStateIconVariants = (config: IconAnimationConfig = {}): Variants => {
  return standardIconVariants({ ...config, style: 'subtle', speed: 'slow' });
};

// ============================================================================
// EXPORT ALL VARIANTS
// ============================================================================

/**
 * Collection of all animation variants for easy access
 */
export const iconAnimations = {
  // Entrance
  fadeIn: createFadeInVariants,
  scaleIn: createScaleInVariants,
  slideIn: createSlideInVariants,
  bounceIn: createBounceInVariants,

  // Interaction
  hover: createHoverVariants,
  pulse: createPulseVariants,
  rotate: createRotateVariants,
  wiggle: createWiggleVariants,

  // Path drawing
  pathDraw: createPathDrawVariants,
  staggeredPath: createStaggeredPathVariants,

  // Composite
  success: createSuccessVariants,
  spinner: createSpinnerVariants,
  sparkle: createSparkleVariants,

  // Presets
  standard: standardIconVariants,
  navigation: navigationIconVariants,
  feature: featureIconVariants,
  emptyState: emptyStateIconVariants,
};

// ============================================================================
// USAGE EXAMPLES (for documentation)
// ============================================================================

/**
 * Example usage:
 * 
 * ```tsx
 * import { motion } from 'framer-motion';
 * import { iconAnimations } from '@/lib/icon-animations';
 * 
 * // Basic usage with preset
 * <motion.svg
 *   variants={iconAnimations.standard()}
 *   initial="initial"
 *   animate="animate"
 *   whileHover="hover"
 * >
 *   {/* SVG content *\/}
 * </motion.svg>
 * 
 * // Custom configuration
 * <motion.svg
 *   variants={iconAnimations.fadeIn({ speed: 'fast', style: 'energetic' })}
 *   initial="initial"
 *   animate="animate"
 * >
 *   {/* SVG content *\/}
 * </motion.svg>
 * 
 * // With reduced motion support
 * <motion.svg
 *   variants={iconAnimations.bounceIn({ respectReducedMotion: true })}
 *   initial="initial"
 *   animate="animate"
 * >
 *   {/* SVG content *\/}
 * </motion.svg>
 * 
 * // Path drawing animation
 * <motion.path
 *   d="M..."
 *   variants={iconAnimations.pathDraw({ speed: 'slow' })}
 *   initial="initial"
 *   animate="animate"
 * />
 * ```
 */
