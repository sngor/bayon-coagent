/**
 * Gradient Mesh Utility
 * 
 * Provides utilities for creating animated gradient mesh backgrounds
 * with configurable blur, opacity, and color controls.
 */

export interface GradientOrb {
  id: string;
  color: string;
  size: number;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  animationDuration?: number;
}

export interface GradientMeshConfig {
  orbs?: GradientOrb[];
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  opacity?: number;
  animate?: boolean;
  className?: string;
}

const blurValues = {
  sm: '20px',
  md: '40px',
  lg: '60px',
  xl: '80px',
  '2xl': '100px',
  '3xl': '120px',
};

/**
 * Default gradient orb configurations
 */
export const defaultOrbs: GradientOrb[] = [
  {
    id: 'orb-1',
    color: 'hsl(var(--primary))',
    size: 500,
    x: 0,
    y: 0,
    blur: 80,
    opacity: 0.15,
    animationDuration: 20,
  },
  {
    id: 'orb-2',
    color: 'hsl(var(--accent-start))',
    size: 400,
    x: 100,
    y: 100,
    blur: 60,
    opacity: 0.1,
    animationDuration: 25,
  },
  {
    id: 'orb-3',
    color: 'hsl(var(--accent-mid))',
    size: 350,
    x: 50,
    y: 50,
    blur: 70,
    opacity: 0.12,
    animationDuration: 30,
  },
];

/**
 * Generate CSS for a gradient orb
 */
export function generateOrbStyle(orb: GradientOrb): React.CSSProperties {
  return {
    position: 'absolute',
    width: `${orb.size}px`,
    height: `${orb.size}px`,
    background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
    filter: `blur(${orb.blur}px)`,
    opacity: orb.opacity,
    left: `${orb.x}%`,
    top: `${orb.y}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    willChange: 'transform',
  };
}

/**
 * Generate animation keyframes for floating orbs
 */
export function generateOrbAnimation(orb: GradientOrb): string {
  const keyframeName = `float-${orb.id}`;
  
  return `
    @keyframes ${keyframeName} {
      0%, 100% {
        transform: translate(-50%, -50%) translate(0, 0);
      }
      25% {
        transform: translate(-50%, -50%) translate(20px, -20px);
      }
      50% {
        transform: translate(-50%, -50%) translate(-20px, 20px);
      }
      75% {
        transform: translate(-50%, -50%) translate(20px, 20px);
      }
    }
  `;
}

/**
 * Get CSS class names for gradient mesh container
 */
export function getGradientMeshClasses(config: GradientMeshConfig): string {
  const classes = ['absolute', 'inset-0', '-z-10', 'overflow-hidden'];
  
  if (config.className) {
    classes.push(config.className);
  }
  
  return classes.join(' ');
}

/**
 * Create a subtle gradient mesh for page backgrounds
 */
export function createSubtleMesh(): GradientOrb[] {
  return [
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
}

/**
 * Create a prominent gradient mesh for hero sections
 */
export function createHeroMesh(): GradientOrb[] {
  return [
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
}

/**
 * Create a gradient mesh for card backgrounds
 */
export function createCardMesh(): GradientOrb[] {
  return [
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
}

/**
 * Utility to calculate responsive orb sizes
 */
export function getResponsiveOrbSize(baseSize: number, viewport: 'mobile' | 'tablet' | 'desktop'): number {
  const multipliers = {
    mobile: 0.5,
    tablet: 0.75,
    desktop: 1,
  };
  
  return baseSize * multipliers[viewport];
}

/**
 * Generate CSS variables for gradient mesh
 */
export function generateGradientMeshVars(config: GradientMeshConfig): Record<string, string> {
  const vars: Record<string, string> = {};
  
  if (config.blur) {
    vars['--gradient-mesh-blur'] = blurValues[config.blur];
  }
  
  if (config.opacity !== undefined) {
    vars['--gradient-mesh-opacity'] = config.opacity.toString();
  }
  
  return vars;
}
