/**
 * User Flow Management System
 * 
 * Provides intelligent user flow guidance with:
 * - "What's Next" suggestions after completing actions
 * - Prerequisite checks before allowing actions
 * - Contextual help based on current page and user state
 * - Breadcrumb trail showing user's journey
 * - Quick actions menu for common next steps
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */

import type { Profile, MarketingPlan, BrandAudit, Competitor } from '@/lib/types/common/common';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface NextStep {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
  icon?: string;
  estimatedTime?: string;
  prerequisitesMet: boolean;
  prerequisites?: Prerequisite[];
}

export interface Prerequisite {
  id: string;
  description: string;
  met: boolean;
  actionHref?: string;
  actionLabel?: string;
}

export interface UserFlowState {
  currentPage: string;
  previousPages: string[];
  completedActions: string[];
  profile: Partial<Profile> | null;
  hasMarketingPlan: boolean;
  hasBrandAudit: boolean;
  hasCompetitors: boolean;
  hasContent: boolean;
}

export interface ContextualHelp {
  title: string;
  description: string;
  tips: string[];
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon?: string;
  category: 'profile' | 'marketing' | 'content' | 'analysis';
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================================================
// User Flow Manager Class
// ============================================================================

export class UserFlowManager {
  private state: UserFlowState;

  constructor(state: UserFlowState) {
    this.state = state;
  }

  /**
   * Get suggested next steps based on current state
   * Requirement 20.2: Suggest related actions after completing tasks
   */
  getNextSteps(): NextStep[] {
    const steps: NextStep[] = [];

    // Check profile completion first (blocking prerequisite)
    const profilePrereqs = this.checkProfilePrerequisites();
    if (!profilePrereqs.allMet) {
      steps.push({
        id: 'complete-profile',
        title: 'Complete Your Profile',
        description: 'Fill in required fields to unlock AI-powered features',
        href: '/brand/profile',
        priority: 'high',
        icon: 'User',
        estimatedTime: '5 minutes',
        prerequisitesMet: false,
        prerequisites: profilePrereqs.prerequisites,
      });
      return steps; // Return early - this is blocking
    }

    // Marketing plan generation
    if (!this.state.hasMarketingPlan) {
      steps.push({
        id: 'generate-marketing-plan',
        title: 'Generate Marketing Plan',
        description: 'Create a personalized 3-step marketing strategy',
        href: '/marketing-plan',
        priority: 'high',
        icon: 'Sparkles',
        estimatedTime: '2 minutes',
        prerequisitesMet: true,
      });
    }

    // Brand audit
    if (!this.state.hasBrandAudit) {
      steps.push({
        id: 'run-brand-audit',
        title: 'Run Brand Audit',
        description: 'Check your NAP consistency across the web',
        href: '/brand-audit',
        priority: 'high',
        icon: 'Shield',
        estimatedTime: '3 minutes',
        prerequisitesMet: true,
      });
    }

    // Competitor analysis
    if (!this.state.hasCompetitors) {
      steps.push({
        id: 'analyze-competitors',
        title: 'Analyze Competitors',
        description: 'Discover and analyze your local competition',
        href: '/competitive-analysis',
        priority: 'medium',
        icon: 'Users',
        estimatedTime: '5 minutes',
        prerequisitesMet: true,
      });
    }

    // Content creation
    if (!this.state.hasContent) {
      steps.push({
        id: 'create-content',
        title: 'Create Your First Content',
        description: 'Generate blog posts, social media content, and more',
        href: '/content-engine',
        priority: 'medium',
        icon: 'FileText',
        estimatedTime: '3 minutes',
        prerequisitesMet: true,
      });
    }

    // Context-specific suggestions based on current page
    const contextualSteps = this.getContextualNextSteps();
    steps.push(...contextualSteps);

    // Sort by priority
    return steps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get next steps specific to the current page context
   * Requirement 20.2: Suggest related actions
   */
  private getContextualNextSteps(): NextStep[] {
    const steps: NextStep[] = [];
    const page = this.state.currentPage;

    switch (page) {
      case '/marketing-plan':
        if (this.state.hasMarketingPlan) {
          steps.push({
            id: 'execute-marketing-task',
            title: 'Execute Marketing Tasks',
            description: 'Start working on your marketing plan action items',
            href: '/marketing-plan',
            priority: 'high',
            icon: 'CheckSquare',
            estimatedTime: 'Varies',
            prerequisitesMet: true,
          });
        }
        break;

      case '/brand-audit':
        if (this.state.hasBrandAudit) {
          steps.push({
            id: 'fix-nap-issues',
            title: 'Fix NAP Inconsistencies',
            description: 'Update your business information across platforms',
            href: '/brand-audit',
            priority: 'high',
            icon: 'AlertCircle',
            estimatedTime: '15 minutes',
            prerequisitesMet: true,
          });
        }
        break;

      case '/content-engine':
        if (this.state.hasContent) {
          steps.push({
            id: 'schedule-content',
            title: 'Schedule Your Content',
            description: 'Plan when to publish your generated content',
            href: '/content-engine',
            priority: 'medium',
            icon: 'Calendar',
            estimatedTime: '5 minutes',
            prerequisitesMet: true,
          });
        }
        break;

      case '/competitive-analysis':
        if (this.state.hasCompetitors) {
          steps.push({
            id: 'track-rankings',
            title: 'Track Keyword Rankings',
            description: 'Monitor your position against competitors',
            href: '/competitive-analysis',
            priority: 'medium',
            icon: 'TrendingUp',
            estimatedTime: '2 minutes',
            prerequisitesMet: true,
          });
        }
        break;

      case '/brand/profile':
        if (this.checkProfilePrerequisites().allMet) {
          steps.push({
            id: 'enhance-profile',
            title: 'Enhance Your Profile',
            description: 'Add optional fields to maximize your marketing potential',
            href: '/brand/profile',
            priority: 'low',
            icon: 'Star',
            estimatedTime: '10 minutes',
            prerequisitesMet: true,
          });
        }
        break;
    }

    return steps;
  }

  /**
   * Check prerequisites for a specific action
   * Requirement 20.3: Add prerequisite checks before allowing actions
   */
  checkPrerequisites(actionId: string): {
    canProceed: boolean;
    prerequisites: Prerequisite[];
  } {
    const prerequisites: Prerequisite[] = [];

    switch (actionId) {
      case 'generate-marketing-plan':
        const profileCheck = this.checkProfilePrerequisites();
        prerequisites.push(...profileCheck.prerequisites);
        return {
          canProceed: profileCheck.allMet,
          prerequisites,
        };

      case 'run-brand-audit':
        prerequisites.push({
          id: 'profile-nap',
          description: 'Name, Address, and Phone number must be in your profile',
          met: !!(
            this.state.profile?.name &&
            this.state.profile?.address &&
            this.state.profile?.phone
          ),
          actionHref: '/brand/profile',
          actionLabel: 'Complete Profile',
        });
        break;

      case 'analyze-competitors':
        prerequisites.push({
          id: 'profile-location',
          description: 'Business address must be in your profile',
          met: !!this.state.profile?.address,
          actionHref: '/brand/profile',
          actionLabel: 'Add Address',
        });
        break;

      case 'create-content':
        prerequisites.push({
          id: 'profile-basic',
          description: 'Basic profile information must be complete',
          met: !!(
            this.state.profile?.name &&
            this.state.profile?.agencyName
          ),
          actionHref: '/brand/profile',
          actionLabel: 'Complete Profile',
        });
        break;

      case 'track-rankings':
        prerequisites.push({
          id: 'has-competitors',
          description: 'You must have analyzed competitors first',
          met: this.state.hasCompetitors,
          actionHref: '/competitive-analysis',
          actionLabel: 'Analyze Competitors',
        });
        break;

      default:
        // No specific prerequisites
        break;
    }

    const canProceed = prerequisites.every((p) => p.met);
    return { canProceed, prerequisites };
  }

  /**
   * Check profile completion prerequisites
   */
  private checkProfilePrerequisites(): {
    allMet: boolean;
    prerequisites: Prerequisite[];
  } {
    const prerequisites: Prerequisite[] = [
      {
        id: 'profile-name',
        description: 'Full name',
        met: !!this.state.profile?.name,
        actionHref: '/brand/profile',
        actionLabel: 'Add Name',
      },
      {
        id: 'profile-agency',
        description: 'Agency name',
        met: !!this.state.profile?.agencyName,
        actionHref: '/brand/profile',
        actionLabel: 'Add Agency Name',
      },
      {
        id: 'profile-phone',
        description: 'Phone number',
        met: !!this.state.profile?.phone,
        actionHref: '/brand/profile',
        actionLabel: 'Add Phone',
      },
      {
        id: 'profile-address',
        description: 'Business address',
        met: !!this.state.profile?.address,
        actionHref: '/brand/profile',
        actionLabel: 'Add Address',
      },
      {
        id: 'profile-bio',
        description: 'Professional bio',
        met: !!this.state.profile?.bio,
        actionHref: '/brand/profile',
        actionLabel: 'Add Bio',
      },
    ];

    const allMet = prerequisites.every((p) => p.met);
    return { allMet, prerequisites };
  }

  /**
   * Get contextual help for the current page
   * Requirement 20.4: Add contextual help based on current page and user state
   */
  getContextualHelp(): ContextualHelp | null {
    const page = this.state.currentPage;

    const helpContent: Record<string, ContextualHelp> = {
      '/dashboard': {
        title: 'Welcome to Your Dashboard',
        description:
          'Your dashboard provides an overview of your marketing performance and quick access to key features.',
        tips: [
          'Check your profile completion status to unlock all features',
          'Review suggested next steps to maximize your marketing impact',
          'Monitor your brand score and review sentiment',
        ],
        relatedLinks: [
          { label: 'Complete Profile', href: '/brand/profile' },
          { label: 'Generate Marketing Plan', href: '/marketing-plan' },
        ],
      },
      '/marketing-plan': {
        title: 'AI Marketing Plan Generator',
        description:
          'Generate a personalized 3-step marketing plan based on your profile and market analysis.',
        tips: [
          'Ensure your profile is complete for the best results',
          'Run a brand audit first to identify areas for improvement',
          'Each step includes a rationale and links to relevant tools',
        ],
        relatedLinks: [
          { label: 'Brand Audit', href: '/brand-audit' },
          { label: 'Content Engine', href: '/content-engine' },
        ],
      },
      '/brand-audit': {
        title: 'Brand Audit Tool',
        description:
          'Check your NAP (Name, Address, Phone) consistency across major platforms and import reviews.',
        tips: [
          'Ensure your NAP information is accurate in your profile',
          'Fix any inconsistencies to improve local SEO',
          'Import reviews to analyze sentiment and identify themes',
        ],
        relatedLinks: [
          { label: 'Update Profile', href: '/brand/profile' },
          { label: 'View Competitors', href: '/competitive-analysis' },
        ],
      },
      '/competitive-analysis': {
        title: 'Competitive Analysis',
        description:
          'Discover and analyze your local competition to understand your market position.',
        tips: [
          'AI will find competitors based on your location',
          'Compare metrics like reviews, ratings, and domain authority',
          'Track keyword rankings to monitor your position',
        ],
        relatedLinks: [
          { label: 'Brand Audit', href: '/brand-audit' },
          { label: 'Marketing Plan', href: '/marketing-plan' },
        ],
      },
      '/content-engine': {
        title: 'AI Content Engine',
        description:
          'Generate high-quality marketing content including blog posts, social media posts, and more.',
        tips: [
          'Choose the content type that fits your marketing goals',
          'Provide specific details for more personalized content',
          'Save generated content to your library for future use',
        ],
        relatedLinks: [
          { label: 'Marketing Plan', href: '/marketing-plan' },
          { label: 'Knowledge Base', href: '/knowledge-base' },
        ],
      },
      '/brand/profile': {
        title: 'Your Professional Profile',
        description:
          'Complete your profile to unlock AI-powered features and personalize your marketing content.',
        tips: [
          'Required fields are marked with an asterisk (*)',
          'A complete profile enables all AI features',
          'Your information is used to personalize generated content',
        ],
        relatedLinks: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Marketing Plan', href: '/marketing-plan' },
        ],
      },
      '/research-agent': {
        title: 'AI Research Agent',
        description:
          'Conduct deep-dive research on any real estate topic with AI-powered web search.',
        tips: [
          'Be specific with your research topic for better results',
          'The AI will search the web and synthesize findings',
          'Save reports to your knowledge base for future reference',
        ],
        relatedLinks: [
          { label: 'Knowledge Base', href: '/knowledge-base' },
          { label: 'Content Engine', href: '/content-engine' },
        ],
      },
      '/knowledge-base': {
        title: 'Knowledge Base',
        description:
          'Access all your saved research reports and in-depth analyses.',
        tips: [
          'Use research reports to inform your content creation',
          'Search through your knowledge base to find specific topics',
          'Export reports to share with clients or colleagues',
        ],
        relatedLinks: [
          { label: 'Research Agent', href: '/research-agent' },
          { label: 'Content Engine', href: '/content-engine' },
        ],
      },
    };

    return helpContent[page] || null;
  }

  /**
   * Get quick actions menu for common next steps
   * Requirement 20.5: Add quick actions menu for common next steps
   */
  getQuickActions(): QuickAction[] {
    const actions: QuickAction[] = [];

    // Profile actions
    if (!this.checkProfilePrerequisites().allMet) {
      actions.push({
        id: 'complete-profile',
        label: 'Complete Profile',
        description: 'Fill in required information',
        href: '/brand/profile',
        icon: 'User',
        category: 'profile',
      });
    }

    // Marketing actions
    if (this.checkProfilePrerequisites().allMet) {
      if (!this.state.hasMarketingPlan) {
        actions.push({
          id: 'generate-plan',
          label: 'Generate Marketing Plan',
          description: 'Create your strategy',
          href: '/marketing-plan',
          icon: 'Sparkles',
          category: 'marketing',
        });
      }

      if (!this.state.hasBrandAudit) {
        actions.push({
          id: 'run-audit',
          label: 'Run Brand Audit',
          description: 'Check NAP consistency',
          href: '/brand-audit',
          icon: 'Shield',
          category: 'analysis',
        });
      }
    }

    // Content actions
    actions.push({
      id: 'create-content',
      label: 'Create Content',
      description: 'Generate marketing materials',
      href: '/content-engine',
      icon: 'FileText',
      category: 'content',
    });

    actions.push({
      id: 'research-topic',
      label: 'Research Topic',
      description: 'Deep-dive into any subject',
      href: '/research-agent',
      icon: 'Search',
      category: 'content',
    });

    // Analysis actions
    if (!this.state.hasCompetitors) {
      actions.push({
        id: 'analyze-competitors',
        label: 'Analyze Competitors',
        description: 'Discover local competition',
        href: '/competitive-analysis',
        icon: 'Users',
        category: 'analysis',
      });
    }

    return actions;
  }

  /**
   * Generate breadcrumb trail showing user's journey
   * Requirement 20.4: Add breadcrumb trail showing user's journey
   */
  getBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' },
    ];

    const page = this.state.currentPage;

    // Map routes to breadcrumb labels
    const routeLabels: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/brand/profile': 'Profile',
      '/marketing-plan': 'Marketing Plan',
      '/brand-audit': 'Brand Audit',
      '/competitive-analysis': 'Competitive Analysis',
      '/content-engine': 'Content Engine',
      '/research-agent': 'Research Agent',
      '/knowledge-base': 'Knowledge Base',
      '/training-hub': 'Training Hub',
      '/integrations': 'Integrations',
      '/settings': 'Settings',
    };

    if (page !== '/dashboard' && routeLabels[page]) {
      breadcrumbs.push({ label: routeLabels[page] });
    }

    return breadcrumbs;
  }

  /**
   * Track completed action and update state
   */
  markActionCompleted(actionId: string): void {
    if (!this.state.completedActions.includes(actionId)) {
      this.state.completedActions.push(actionId);
    }
  }

  /**
   * Track page navigation for journey tracking
   */
  trackPageVisit(page: string): void {
    if (this.state.currentPage !== page) {
      this.state.previousPages.push(this.state.currentPage);
      this.state.currentPage = page;
    }
  }

  /**
   * Get user's journey history
   */
  getJourneyHistory(): string[] {
    return [...this.state.previousPages, this.state.currentPage];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a UserFlowManager instance from user data
 */
export function createUserFlowManager(
  currentPage: string,
  profile: Partial<Profile> | null,
  hasMarketingPlan: boolean,
  hasBrandAudit: boolean,
  hasCompetitors: boolean,
  hasContent: boolean,
  previousPages: string[] = [],
  completedActions: string[] = []
): UserFlowManager {
  const state: UserFlowState = {
    currentPage,
    previousPages,
    completedActions,
    profile,
    hasMarketingPlan,
    hasBrandAudit,
    hasCompetitors,
    hasContent,
  };

  return new UserFlowManager(state);
}

/**
 * Get page title for breadcrumbs
 */
export function getPageTitle(path: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/brand/profile': 'Profile',
    '/marketing-plan': 'Marketing Plan',
    '/brand-audit': 'Brand Audit',
    '/competitive-analysis': 'Competitive Analysis',
    '/content-engine': 'Content Engine',
    '/research-agent': 'Research Agent',
    '/knowledge-base': 'Knowledge Base',
    '/training-hub': 'Training Hub',
    '/integrations': 'Integrations',
    '/settings': 'Settings',
  };

  return titles[path] || 'Page';
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(
  featureId: string,
  profile: Partial<Profile> | null
): { canAccess: boolean; reason?: string } {
  const requiredFields = ['name', 'agencyName', 'phone', 'address', 'bio'];
  const hasRequiredFields = requiredFields.every(
    (field) => profile?.[field as keyof Profile]
  );

  const featureRequirements: Record<
    string,
    { requiresProfile: boolean; requiresOther?: string[] }
  > = {
    'marketing-plan': { requiresProfile: true },
    'brand-audit': { requiresProfile: true },
    'competitive-analysis': { requiresProfile: true },
    'content-engine': { requiresProfile: false },
    'research-agent': { requiresProfile: false },
  };

  const requirements = featureRequirements[featureId];
  if (!requirements) {
    return { canAccess: true };
  }

  if (requirements.requiresProfile && !hasRequiredFields) {
    return {
      canAccess: false,
      reason: 'Please complete your profile to access this feature',
    };
  }

  return { canAccess: true };
}
