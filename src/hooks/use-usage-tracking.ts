/**
 * React hook for usage tracking
 * 
 * Provides easy access to usage tracking functionality in React components
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  trackFeatureUsage,
  getFrequentFeatures,
  getRecentFeatures,
  getUsageInsights,
  type FrequentFeature,
  type UsageInsights,
} from '@/lib/usage-tracking';

/**
 * Hook to track feature usage automatically when component mounts
 */
export function useTrackFeature(
  featureId: string,
  featureName: string,
  featurePath: string,
  category?: string
) {
  useEffect(() => {
    trackFeatureUsage(featureId, featureName, featurePath, category);
  }, [featureId, featureName, featurePath, category]);
}

/**
 * Hook to get frequently used features with automatic updates
 */
export function useFrequentFeatures(limit: number = 5) {
  const [features, setFeatures] = useState<FrequentFeature[]>([]);

  const refresh = useCallback(() => {
    const frequent = getFrequentFeatures(limit);
    setFeatures(frequent);
  }, [limit]);

  useEffect(() => {
    refresh();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'co-agent-usage-patterns') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  return { features, refresh };
}

/**
 * Hook to get recently used features
 */
export function useRecentFeatures(limit: number = 5) {
  const [features, setFeatures] = useState<FrequentFeature[]>([]);

  const refresh = useCallback(() => {
    const recent = getRecentFeatures(limit);
    setFeatures(recent);
  }, [limit]);

  useEffect(() => {
    refresh();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'co-agent-usage-patterns') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  return { features, refresh };
}

/**
 * Hook to get usage insights
 */
export function useUsageInsights() {
  const [insights, setInsights] = useState<UsageInsights | null>(null);

  const refresh = useCallback(() => {
    const data = getUsageInsights();
    setInsights(data);
  }, []);

  useEffect(() => {
    refresh();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'co-agent-usage-patterns') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  return { insights, refresh };
}

/**
 * Hook to manually track feature usage
 */
export function useTrackFeatureManually() {
  const track = useCallback(
    (
      featureId: string,
      featureName: string,
      featurePath: string,
      category?: string
    ) => {
      trackFeatureUsage(featureId, featureName, featurePath, category);
    },
    []
  );

  return track;
}
