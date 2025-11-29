/**
 * React Hook for User Flow Management
 * 
 * Provides easy access to user flow functionality in React components
 */

'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  createUserFlowManager,
  type NextStep,
  type ContextualHelp,
  type QuickAction,
  type BreadcrumbItem,
  type Prerequisite,
} from '@/lib/user-flow';
import type { Profile } from '@/lib/types/common/common';

interface UseUserFlowProps {
  profile: Partial<Profile> | null;
  hasMarketingPlan?: boolean;
  hasBrandAudit?: boolean;
  hasCompetitors?: boolean;
  hasContent?: boolean;
}

interface UseUserFlowReturn {
  nextSteps: NextStep[];
  contextualHelp: ContextualHelp | null;
  quickActions: QuickAction[];
  breadcrumbs: BreadcrumbItem[];
  checkPrerequisites: (actionId: string) => {
    canProceed: boolean;
    prerequisites: Prerequisite[];
  };
}

/**
 * Hook to access user flow management functionality
 * 
 * @example
 * ```tsx
 * const { nextSteps, contextualHelp, quickActions } = useUserFlow({
 *   profile,
 *   hasMarketingPlan: true,
 *   hasBrandAudit: false,
 * });
 * ```
 */
export function useUserFlow({
  profile,
  hasMarketingPlan = false,
  hasBrandAudit = false,
  hasCompetitors = false,
  hasContent = false,
}: UseUserFlowProps): UseUserFlowReturn {
  const pathname = usePathname();

  const flowManager = useMemo(() => {
    return createUserFlowManager(
      pathname,
      profile,
      hasMarketingPlan,
      hasBrandAudit,
      hasCompetitors,
      hasContent
    );
  }, [pathname, profile, hasMarketingPlan, hasBrandAudit, hasCompetitors, hasContent]);

  const nextSteps = useMemo(() => {
    return flowManager.getNextSteps();
  }, [flowManager]);

  const contextualHelp = useMemo(() => {
    return flowManager.getContextualHelp();
  }, [flowManager]);

  const quickActions = useMemo(() => {
    return flowManager.getQuickActions();
  }, [flowManager]);

  const breadcrumbs = useMemo(() => {
    return flowManager.getBreadcrumbs();
  }, [flowManager]);

  const checkPrerequisites = (actionId: string) => {
    return flowManager.checkPrerequisites(actionId);
  };

  return {
    nextSteps,
    contextualHelp,
    quickActions,
    breadcrumbs,
    checkPrerequisites,
  };
}
