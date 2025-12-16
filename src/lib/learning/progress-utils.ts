/**
 * Learning Progress Utilities
 * Centralized logic for progress calculations and formatting
 */

export interface ProgressStats {
    completed: number;
    total: number;
    percentage: number;
    remaining: number;
    estimatedTimeRemaining: number; // in minutes
}

export interface LearningModule {
    id: string;
    title: string;
    estimatedMinutes?: number;
}

/**
 * Calculate progress statistics for a set of modules
 */
export function calculateProgressStats(
    modules: LearningModule[],
    completedModuleIds: Set<string>,
    defaultMinutesPerModule = 20
): ProgressStats {
    const total = modules.length;
    const completed = modules.filter(m => completedModuleIds.has(m.id)).length;
    const remaining = total - completed;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    const estimatedTimeRemaining = modules
        .filter(m => !completedModuleIds.has(m.id))
        .reduce((sum, module) => sum + (module.estimatedMinutes || defaultMinutesPerModule), 0);

    return {
        completed,
        total,
        percentage: Math.round(percentage),
        remaining,
        estimatedTimeRemaining,
    };
}

/**
 * Format time duration in a human-readable way
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get progress status text
 */
export function getProgressStatusText(stats: ProgressStats): string {
    if (stats.completed === stats.total) {
        return "🎉 Congratulations! You've mastered all modules!";
    }

    if (stats.completed === 0) {
        return `Start your learning journey with ${stats.total} modules`;
    }

    return `${stats.remaining} modules remaining to complete your learning journey`;
}

/**
 * Calculate learning streak (simplified implementation)
 * In a real implementation, this would analyze actual learning activity dates
 */
export function calculateLearningStreak(lastActivities: string[]): number {
    // Simplified: return mock value
    // Real implementation would:
    // 1. Parse dates from lastActivities
    // 2. Check for consecutive days of activity
    // 3. Return actual streak count
    return Math.min(lastActivities.length, 7);
}

/**
 * Get the next recommended module
 */
export function getNextRecommendedModule<T extends LearningModule>(
    modules: T[],
    completedModuleIds: Set<string>
): T | null {
    return modules.find(module => !completedModuleIds.has(module.id)) || null;
}

/**
 * Group modules by completion status
 */
export function groupModulesByStatus<T extends LearningModule>(
    modules: T[],
    completedModuleIds: Set<string>
): {
    completed: T[];
    inProgress: T[];
    notStarted: T[];
} {
    const completed: T[] = [];
    const inProgress: T[] = [];
    const notStarted: T[] = [];

    modules.forEach(module => {
        if (completedModuleIds.has(module.id)) {
            completed.push(module);
        } else {
            // For now, treat all non-completed as not started
            // In the future, could track partial progress
            notStarted.push(module);
        }
    });

    return { completed, inProgress, notStarted };
}

/**
 * Calculate overall learning analytics
 */
export function calculateLearningAnalytics(data: {
    courseProgress: Array<{ completedAt?: string; lastAccessedAt: string }>;
    tutorialProgress: Array<{ isWatched: boolean; watchTime: number; watchedAt?: string }>;
    certificates: Array<{ issuedAt: string }>;
}) {
    const coursesEnrolled = data.courseProgress.length;
    const coursesCompleted = data.courseProgress.filter(p => p.completedAt).length;
    const tutorialsWatched = data.tutorialProgress.filter(p => p.isWatched).length;
    const certificatesEarned = data.certificates.length;

    // Calculate total learning time (in minutes)
    const totalLearningTime = Math.round(
        data.tutorialProgress.reduce((total, p) => total + (p.watchTime / 60), 0)
    );

    // Get last activity
    const allActivities = [
        ...data.courseProgress.map(p => p.lastAccessedAt),
        ...data.tutorialProgress.map(p => p.watchedAt).filter(Boolean) as string[],
    ];

    const lastActivity = allActivities.length > 0
        ? allActivities.sort().reverse()[0]!
        : new Date().toISOString();

    const streakDays = calculateLearningStreak(allActivities);

    return {
        coursesEnrolled,
        coursesCompleted,
        tutorialsWatched,
        certificatesEarned,
        totalLearningTime,
        streakDays,
        lastActivity,
    };
}