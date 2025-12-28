/**
 * Gradient Mesh Components
 * 
 * Export all gradient mesh components and utilities
 */

export {
  GradientMesh,
  SubtleGradientMesh,
  HeroGradientMesh,
  CardGradientMesh,
} from './gradient-mesh';

export type { GradientMeshConfig, GradientOrb } from '@/lib/gradient-mesh';

export {
  defaultOrbs,
  createSubtleMesh,
  createHeroMesh,
  createCardMesh,
  getResponsiveOrbSize,
  generateOrbStyle,
  generateGradientMeshVars,
} from '@/lib/gradient-mesh';
