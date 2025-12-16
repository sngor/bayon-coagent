/**
 * Learning Component Types
 * Centralized type definitions for learning components
 */

import type { LearningModule } from '@/lib/learning/types';

export interface ProgressHeroProps {
    completedModules: Set<string>;
    totalModules: number;
    marketingModules: LearningModule[];
    closingModules: LearningModule[];
    professionalModules: LearningModule[];
    firstIncompleteModule?: LearningModule;
    onContinueLearning: () => void;
}

export interface LearningErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export interface ModuleCardProps {
    module: LearningModule;
    isCompleted: boolean;
    isActive: boolean;
    onSelect: (module: LearningModule) => void;
}

export interface LearningProgressCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    completed: number;
    total: number;
    color: 'blue' | 'green' | 'purple';
    onClick?: () => void;
    isLoading?: boolean;
}