/**
 * Usage Pattern Tracking System
 * 
 * Tracks feature usage patterns to surface frequently used tools
 * and provide personalized navigation experiences.
 * 
 * Requirements: 27.1 - Learn and surface frequently used features
 */

// Storage key for usage data
const USAGE_STORAGE_KEY = 'co-agent-usage-patterns';

// Time window for "recent" usage (7 days)
const RECENT_USAGE_WINDOW = 7 * 24 * 60 * 60 * 1000;

// Minimum usage count to be considered "frequent"
const FREQUENT_USAGE_THRESHOLD = 3;

export interface FeatureUsage {
  featureId: string;
  featureName: string;
  featurePath: string;
  count: number;
  lastUsed: number; // timestamp
  firstUsed: number; // timestamp
  category?: string;
}

export interface UsagePatterns {
  features: Record<string, FeatureUsage>;
  totalUsage: number;
  lastUpdated: number;
}

export interface FrequentFeature {
  featureId: string;
  featureName: string;
  featurePath: string;
  count: number;
  category?: string;
  score: number; // Weighted score based on recency and frequency
}

/**
 * Track a feature usage event
 */
export function trackFeatureUsage(
  featureId: string,
  featureName: string,
  featurePath: string,
  category?: string
): void {
  try {
    const patterns = getUsagePatterns();
    const now = Date.now();

    if (patterns.features[featureId]) {
      // Update existing feature
      patterns.features[featureId].count++;
      patterns.features[featureId].lastUsed = now;
    } else {
      // Add new feature
      patterns.features[featureId] = {
        featureId,
        featureName,
        featurePath,
        count: 1,
        lastUsed: now,
        firstUsed: now,
        category,
      };
    }

    patterns.totalUsage++;
    patterns.lastUpdated = now;

    saveUsagePatterns(patterns);
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

/**
 * Get all usage patterns from storage
 */
export function getUsagePatterns(): UsagePatterns {
  try {
    if (typeof window === 'undefined') {
      return getEmptyPatterns();
    }

    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!stored) {
      return getEmptyPatterns();
    }

    const patterns = JSON.parse(stored) as UsagePatterns;
    return patterns;
  } catch (error) {
    console.error('Failed to get usage patterns:', error);
    return getEmptyPatterns();
  }
}

/**
 * Save usage patterns to storage
 */
function saveUsagePatterns(patterns: UsagePatterns): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(patterns));
  } catch (error) {
    console.error('Failed to save usage patterns:', error);
  }
}

/**
 * Get frequently used features sorted by usage score
 */
export function getFrequentFeatures(limit: number = 5): FrequentFeature[] {
  const patterns = getUsagePatterns();
  const now = Date.now();

  // Calculate scores for each feature
  const scoredFeatures = Object.values(patterns.features)
    .map((feature) => {
      // Calculate recency score (0-1, higher for more recent)
      const daysSinceLastUse = (now - feature.lastUsed) / (24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, 1 - daysSinceLastUse / 30); // Decay over 30 days

      // Calculate frequency score (normalized by total usage)
      const frequencyScore = patterns.totalUsage > 0 
        ? feature.count / patterns.totalUsage 
        : 0;

      // Combined score (weighted: 60% frequency, 40% recency)
      const score = frequencyScore * 0.6 + recencyScore * 0.4;

      return {
        featureId: feature.featureId,
        featureName: feature.featureName,
        featurePath: feature.featurePath,
        count: feature.count,
        category: feature.category,
        score,
      };
    })
    .filter((feature) => feature.count >= FREQUENT_USAGE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredFeatures;
}

/**
 * Get recently used features (within the last 7 days)
 */
export function getRecentFeatures(limit: number = 5): FrequentFeature[] {
  const patterns = getUsagePatterns();
  const now = Date.now();
  const cutoff = now - RECENT_USAGE_WINDOW;

  const recentFeatures = Object.values(patterns.features)
    .filter((feature) => feature.lastUsed >= cutoff)
    .map((feature) => ({
      featureId: feature.featureId,
      featureName: feature.featureName,
      featurePath: feature.featurePath,
      count: feature.count,
      category: feature.category,
      score: feature.count, // Simple count-based score for recent features
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recentFeatures;
}

/**
 * Get usage statistics for a specific feature
 */
export function getFeatureStats(featureId: string): FeatureUsage | null {
  const patterns = getUsagePatterns();
  return patterns.features[featureId] || null;
}

/**
 * Get usage statistics by category
 */
export function getUsageByCategory(): Record<string, number> {
  const patterns = getUsagePatterns();
  const categoryStats: Record<string, number> = {};

  Object.values(patterns.features).forEach((feature) => {
    const category = feature.category || 'uncategorized';
    categoryStats[category] = (categoryStats[category] || 0) + feature.count;
  });

  return categoryStats;
}

/**
 * Clear all usage data (useful for testing or reset)
 */
export function clearUsageData(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(USAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear usage data:', error);
  }
}

/**
 * Export usage data for analysis or backup
 */
export function exportUsageData(): string {
  const patterns = getUsagePatterns();
  return JSON.stringify(patterns, null, 2);
}

/**
 * Import usage data from backup
 */
export function importUsageData(data: string): boolean {
  try {
    const patterns = JSON.parse(data) as UsagePatterns;
    saveUsagePatterns(patterns);
    return true;
  } catch (error) {
    console.error('Failed to import usage data:', error);
    return false;
  }
}

/**
 * Get empty patterns object
 */
function getEmptyPatterns(): UsagePatterns {
  return {
    features: {},
    totalUsage: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Get usage insights for display
 */
export interface UsageInsights {
  totalFeatures: number;
  totalUsage: number;
  mostUsedFeature: FrequentFeature | null;
  favoriteCategory: string | null;
  usageStreak: number; // Days with usage
}

export function getUsageInsights(): UsageInsights {
  const patterns = getUsagePatterns();
  const frequentFeatures = getFrequentFeatures(1);
  const categoryStats = getUsageByCategory();

  // Find favorite category
  let favoriteCategory: string | null = null;
  let maxCategoryUsage = 0;
  Object.entries(categoryStats).forEach(([category, count]) => {
    if (count > maxCategoryUsage && category !== 'uncategorized') {
      favoriteCategory = category;
      maxCategoryUsage = count;
    }
  });

  return {
    totalFeatures: Object.keys(patterns.features).length,
    totalUsage: patterns.totalUsage,
    mostUsedFeature: frequentFeatures[0] || null,
    favoriteCategory,
    usageStreak: calculateUsageStreak(patterns),
  };
}

/**
 * Calculate usage streak (consecutive days with usage)
 */
function calculateUsageStreak(patterns: UsagePatterns): number {
  const usageDates = new Set<string>();
  
  Object.values(patterns.features).forEach((feature) => {
    const date = new Date(feature.lastUsed).toDateString();
    usageDates.add(date);
  });

  // Simple implementation: count unique days in last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  let streak = 0;
  Object.values(patterns.features).forEach((feature) => {
    if (feature.lastUsed >= thirtyDaysAgo) {
      streak++;
    }
  });

  return Math.min(streak, 30);
}
