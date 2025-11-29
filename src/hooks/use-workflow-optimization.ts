/**
 * React Hook for Workflow Optimization
 * 
 * Provides easy access to workflow optimization functionality in React components
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  detectWorkflowPatterns,
  suggestWorkflowShortcuts,
  detectIfStuck,
  getComplexTaskGuidance,
  updateGuidanceStep,
  getWorkflowOptimizations,
  getWorkflowEfficiencyScore,
  type WorkflowPattern,
  type WorkflowShortcut,
  type StuckDetection,
  type ComplexTaskGuidance,
  type WorkflowOptimization,
} from '@/lib/workflow-optimization';
import type { Profile } from '@/lib/types/common/common';

interface UseWorkflowOptimizationProps {
  profile: Partial<Profile> | null;
  hasCompletedAction?: boolean;
}

interface UseWorkflowOptimizationReturn {
  patterns: WorkflowPattern[];
  shortcuts: WorkflowShortcut[];
  stuckDetection: StuckDetection;
  optimizations: WorkflowOptimization[];
  efficiencyScore: number;
  getGuidance: (taskId: string) => ComplexTaskGuidance | null;
  updateStep: (guidance: ComplexTaskGuidance, stepId: string, completed: boolean) => ComplexTaskGuidance;
}

/**
 * Hook to access workflow optimization functionality
 * 
 * @example
 * ```tsx
 * const { shortcuts, stuckDetection, optimizations } = useWorkflowOptimization({
 *   profile,
 *   hasCompletedAction: false,
 * });
 * ```
 */
export function useWorkflowOptimization({
  profile,
  hasCompletedAction = false,
}: UseWorkflowOptimizationProps): UseWorkflowOptimizationReturn {
  const pathname = usePathname();
  const [timeOnPage, setTimeOnPage] = useState(0);

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime);
    }, 1000);

    return () => {
      clearInterval(interval);
      setTimeOnPage(0);
    };
  }, [pathname]);

  // Extract feature ID from pathname
  const currentFeature = useMemo(() => {
    return pathname.replace('/', '') || 'dashboard';
  }, [pathname]);

  // Detect workflow patterns
  const patterns = useMemo(() => {
    return detectWorkflowPatterns();
  }, []);

  // Get workflow shortcuts
  const shortcuts = useMemo(() => {
    return suggestWorkflowShortcuts(currentFeature, patterns);
  }, [currentFeature, patterns]);

  // Detect if user is stuck
  const stuckDetection = useMemo(() => {
    return detectIfStuck(currentFeature, timeOnPage, profile, hasCompletedAction);
  }, [currentFeature, timeOnPage, profile, hasCompletedAction]);

  // Get all optimizations
  const optimizations = useMemo(() => {
    return getWorkflowOptimizations(
      currentFeature,
      profile,
      timeOnPage,
      hasCompletedAction
    );
  }, [currentFeature, profile, timeOnPage, hasCompletedAction]);

  // Calculate efficiency score
  const efficiencyScore = useMemo(() => {
    return getWorkflowEfficiencyScore(profile);
  }, [profile]);

  // Get guidance for a task
  const getGuidance = useCallback((taskId: string) => {
    return getComplexTaskGuidance(taskId);
  }, []);

  // Update guidance step
  const updateStep = useCallback(
    (guidance: ComplexTaskGuidance, stepId: string, completed: boolean) => {
      return updateGuidanceStep(guidance, stepId, completed);
    },
    []
  );

  return {
    patterns,
    shortcuts,
    stuckDetection,
    optimizations,
    efficiencyScore,
    getGuidance,
    updateStep,
  };
}

/**
 * Hook to track time on page
 */
export function useTimeOnPage(): number {
  const [timeOnPage, setTimeOnPage] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime);
    }, 1000);

    return () => {
      clearInterval(interval);
      setTimeOnPage(0);
    };
  }, [pathname]);

  return timeOnPage;
}
