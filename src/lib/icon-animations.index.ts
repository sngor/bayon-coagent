/**
 * Icon Animation Library - Main Export
 * 
 * Centralized export for all icon animation utilities, variants, and configurations.
 */

export {
  // Main animation collection
  iconAnimations,

  // Types
  type AnimationSpeed,
  type AnimationStyle,
  type IconAnimationConfig,

  // Utility functions
  prefersReducedMotion,
  getTransition,
  withReducedMotion,

  // Configuration constants
  SPEED_CONFIGS,
  STYLE_CONFIGS,

  // Individual animation creators (for advanced usage)
  createFadeInVariants,
  createScaleInVariants,
  createSlideInVariants,
  createBounceInVariants,
  createHoverVariants,
  createPulseVariants,
  createRotateVariants,
  createWiggleVariants,
  createPathDrawVariants,
  createStaggeredPathVariants,
  createSuccessVariants,
  createSpinnerVariants,
  createSparkleVariants,

  // Preset variants
  standardIconVariants,
  navigationIconVariants,
  featureIconVariants,
  emptyStateIconVariants,
} from './icon-animations';
