import { useMemo } from 'react';
import { useQuery } from '@/aws/dynamodb/hooks';
import { useUser } from '@/aws/auth';
import type { LearningModule } from '@/lib/learning/types';

// Type for better type safety
type LearningModuleArray = readonly LearningModule[];

interface LearningProgress {
    id: string;
    completed: boolean;
    completedAt?: string;
}

interface ProgressStats {
    overall: number;
    marketing: number;
    closing: number;
    professional: number;
    completedModules: Set<string>;
    totalCompleted: number;
    totalModules: number;
}

export function useLearningProgress(
    marketingModules: LearningModuleArray,
    closingModules: LearningModuleArray,
    professionalModules: LearningModuleArray
): {
    progressStats: ProgressStats;
    isLoading: boolean;
    error: Error | null;
} {
    const { user } = useUser();

    // Memoize DynamoDB keys
    const progressPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const progressSKPrefix = useMemo(() => 'LEARNING_PROGRESS#', []);

    const { data: progressData, isLoading, error } = useQuery<LearningProgress>(
        progressPK,
        progressSKPrefix
    );

    const progressStats = useMemo((): ProgressStats => {
        const completedModules = new Set(
            progressData?.filter(p => p.completed).map(p => p.id) || []
        );

        const marketingCompleted = marketingModules.filter(m => completedModules.has(m.id)).length;
        const closingCompleted = closingModules.filter(m => completedModules.has(m.id)).length;
        const professionalCompleted = professionalModules.filter(m => completedModules.has(m.id)).length;

        const totalCompleted = completedModules.size;
        const allModules = [...marketingModules, ...closingModules, ...professionalModules];
        const totalModules = allModules.length;

        return {
            overall: totalModules > 0 ? (totalCompleted / totalModules) * 100 : 0,
            marketing: marketingModules.length > 0 ? (marketingCompleted / marketingModules.length) * 100 : 0,
            closing: closingModules.length > 0 ? (closingCompleted / closingModules.length) * 100 : 0,
            professional: professionalModules.length > 0 ? (professionalCompleted / professionalModules.length) * 100 : 0,
            completedModules,
            totalCompleted,
            totalModules,
        };
    }, [progressData, marketingModules, closingModules, professionalModules]);

    return {
        progressStats,
        isLoading,
        error,
    };
}