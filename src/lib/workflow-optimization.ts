/**
 * Smart Workflow Optimization System
 * 
 * Detects common workflow patterns, suggests shortcuts and optimizations,
 * provides contextual AI assistance when users are stuck, and offers
 * step-by-step guidance for complex tasks.
 * 
 * Requirements: 27.6, 27.12
 */

import { getUsagePatterns, type FeatureUsage } from './usage-tracking';
import { createUserFlowManager, type UserFlowState } from './user-flow';
import type { Profile } from '@/lib/types/common';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  sequence: string[]; // Feature IDs in order
  frequency: number; // How often this pattern occurs
  avgTimeToComplete: number; // Average time in milliseconds
  lastDetected: number; // Timestamp
}

export interface WorkflowShortcut {
  id: string;
  title: string;
  description: string;
  fromFeature: string;
  toFeature: string;
  estimatedTimeSaved: string;
  action: {
    label: string;
    href: string;
  };
}

export interface StuckDetection {
  isStuck: boolean;
  reason: string;
  suggestions: StuckSuggestion[];
}

export interface StuckSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'shortcut' | 'help' | 'contact';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface ComplexTaskGuidance {
  taskId: string;
  taskName: string;
  steps: GuidanceStep[];
  currentStep: number;
  estimatedTotalTime: string;
  prerequisites: string[];
}

export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  tips?: string[];
  completed: boolean;
  estimatedTime: string;
  helpLink?: string;
}

export interface WorkflowOptimization {
  type: 'pattern' | 'shortcut' | 'efficiency';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// ============================================================================
// Workflow Pattern Detection
// ============================================================================

/**
 * Detect common workflow patterns from usage history
 * Requirement 27.6: Detect common workflow patterns
 */
export function detectWorkflowPatterns(): WorkflowPattern[] {
  const patterns = getUsagePatterns();
  const features = Object.values(patterns.features);

  if (features.length < 2) {
    return [];
  }

  // Sort features by last used to find sequences
  const sortedFeatures = [...features].sort((a, b) => a.lastUsed - b.lastUsed);

  const detectedPatterns: WorkflowPattern[] = [];

  // Common pattern: Profile → Marketing Plan → Content Creation
  const profileToContent = detectSequencePattern(
    sortedFeatures,
    ['profile', 'marketing-plan', 'content-engine']
  );
  if (profileToContent) {
    detectedPatterns.push({
      id: 'profile-to-content',
      name: 'Profile Setup to Content Creation',
      description: 'Complete profile, generate marketing plan, then create content',
      sequence: ['profile', 'marketing-plan', 'content-engine'],
      frequency: profileToContent.frequency,
      avgTimeToComplete: profileToContent.avgTime,
      lastDetected: Date.now(),
    });
  }

  // Pattern: Brand Audit → Competitive Analysis → Marketing Plan
  const auditToStrategy = detectSequencePattern(
    sortedFeatures,
    ['brand-audit', 'competitive-analysis', 'marketing-plan']
  );
  if (auditToStrategy) {
    detectedPatterns.push({
      id: 'audit-to-strategy',
      name: 'Analysis to Strategy',
      description: 'Run brand audit, analyze competitors, then generate marketing plan',
      sequence: ['brand-audit', 'competitive-analysis', 'marketing-plan'],
      frequency: auditToStrategy.frequency,
      avgTimeToComplete: auditToStrategy.avgTime,
      lastDetected: Date.now(),
    });
  }

  // Pattern: Research → Content Creation
  const researchToContent = detectSequencePattern(
    sortedFeatures,
    ['research-agent', 'content-engine']
  );
  if (researchToContent) {
    detectedPatterns.push({
      id: 'research-to-content',
      name: 'Research to Content',
      description: 'Research topics then create content based on findings',
      sequence: ['research-agent', 'content-engine'],
      frequency: researchToContent.frequency,
      avgTimeToComplete: researchToContent.avgTime,
      lastDetected: Date.now(),
    });
  }

  return detectedPatterns;
}

/**
 * Helper to detect if a sequence pattern exists in usage history
 */
function detectSequencePattern(
  features: FeatureUsage[],
  sequence: string[]
): { frequency: number; avgTime: number } | null {
  let matchCount = 0;
  let totalTime = 0;

  // Look for the sequence in the sorted features
  for (let i = 0; i < features.length - sequence.length + 1; i++) {
    let matches = true;
    for (let j = 0; j < sequence.length; j++) {
      if (!features[i + j]?.featureId.includes(sequence[j])) {
        matches = false;
        break;
      }
    }

    if (matches) {
      matchCount++;
      // Calculate time between first and last in sequence
      const timeSpan = features[i + sequence.length - 1].lastUsed - features[i].lastUsed;
      totalTime += timeSpan;
    }
  }

  if (matchCount === 0) {
    return null;
  }

  return {
    frequency: matchCount,
    avgTime: totalTime / matchCount,
  };
}

// ============================================================================
// Workflow Shortcuts
// ============================================================================

/**
 * Suggest workflow shortcuts based on detected patterns
 * Requirement 27.6: Suggest shortcuts and optimizations
 */
export function suggestWorkflowShortcuts(
  currentFeature: string,
  patterns: WorkflowPattern[]
): WorkflowShortcut[] {
  const shortcuts: WorkflowShortcut[] = [];

  // Find patterns that include the current feature
  patterns.forEach((pattern) => {
    const currentIndex = pattern.sequence.findIndex((f) => f === currentFeature);

    if (currentIndex >= 0 && currentIndex < pattern.sequence.length - 1) {
      const nextFeature = pattern.sequence[currentIndex + 1];

      shortcuts.push({
        id: `${currentFeature}-to-${nextFeature}`,
        title: `Continue to ${formatFeatureName(nextFeature)}`,
        description: `Based on your workflow, you typically move to ${formatFeatureName(nextFeature)} next`,
        fromFeature: currentFeature,
        toFeature: nextFeature,
        estimatedTimeSaved: '2-3 minutes',
        action: {
          label: `Go to ${formatFeatureName(nextFeature)}`,
          href: getFeaturePath(nextFeature),
        },
      });
    }
  });

  // Add common shortcuts regardless of patterns
  const commonShortcuts = getCommonShortcuts(currentFeature);
  shortcuts.push(...commonShortcuts);

  return shortcuts;
}

/**
 * Get common shortcuts for a feature
 */
function getCommonShortcuts(currentFeature: string): WorkflowShortcut[] {
  const shortcuts: Record<string, WorkflowShortcut[]> = {
    'profile': [
      {
        id: 'profile-to-plan',
        title: 'Generate Marketing Plan',
        description: 'Now that your profile is complete, create your marketing strategy',
        fromFeature: 'profile',
        toFeature: 'marketing-plan',
        estimatedTimeSaved: '5 minutes',
        action: {
          label: 'Generate Plan',
          href: '/marketing-plan',
        },
      },
    ],
    'brand-audit': [
      {
        id: 'audit-to-competitors',
        title: 'Analyze Competitors',
        description: 'Compare your brand against local competition',
        fromFeature: 'brand-audit',
        toFeature: 'competitive-analysis',
        estimatedTimeSaved: '3 minutes',
        action: {
          label: 'Analyze Competitors',
          href: '/competitive-analysis',
        },
      },
    ],
    'marketing-plan': [
      {
        id: 'plan-to-content',
        title: 'Create Content',
        description: 'Start executing your marketing plan by creating content',
        fromFeature: 'marketing-plan',
        toFeature: 'content-engine',
        estimatedTimeSaved: '2 minutes',
        action: {
          label: 'Create Content',
          href: '/content-engine',
        },
      },
    ],
    'research-agent': [
      {
        id: 'research-to-content',
        title: 'Turn Research into Content',
        description: 'Use your research findings to create marketing content',
        fromFeature: 'research-agent',
        toFeature: 'content-engine',
        estimatedTimeSaved: '3 minutes',
        action: {
          label: 'Create Content',
          href: '/content-engine',
        },
      },
    ],
  };

  return shortcuts[currentFeature] || [];
}

// ============================================================================
// Stuck Detection and AI Assistance
// ============================================================================

/**
 * Detect if user is stuck and provide contextual assistance
 * Requirement 27.12: Add contextual AI assistance when user is stuck
 */
export function detectIfStuck(
  currentFeature: string,
  timeOnPage: number, // milliseconds
  profile: Partial<Profile> | null,
  hasCompletedAction: boolean
): StuckDetection {
  const suggestions: StuckSuggestion[] = [];
  let isStuck = false;
  let reason = '';

  // Stuck indicator 1: Long time on page without action (> 3 minutes)
  if (timeOnPage > 3 * 60 * 1000 && !hasCompletedAction) {
    isStuck = true;
    reason = 'You\'ve been on this page for a while without taking action';

    suggestions.push({
      id: 'tutorial',
      title: 'Watch Tutorial',
      description: `Learn how to use ${formatFeatureName(currentFeature)}`,
      type: 'tutorial',
      action: {
        label: 'View Tutorial',
        href: `/training-hub?topic=${currentFeature}`,
      },
    });

    suggestions.push({
      id: 'help',
      title: 'Get Help',
      description: 'View contextual help for this feature',
      type: 'help',
      action: {
        label: 'Show Help',
        onClick: () => {
          // This will be handled by the component
        },
      },
    });
  }

  // Stuck indicator 2: Missing prerequisites
  const flowManager = createUserFlowManager(
    currentFeature,
    profile,
    false,
    false,
    false,
    false
  );

  const prereqCheck = flowManager.checkPrerequisites(currentFeature);
  if (!prereqCheck.canProceed) {
    isStuck = true;
    reason = 'You need to complete some prerequisites first';

    prereqCheck.prerequisites
      .filter((p) => !p.met)
      .forEach((prereq) => {
        suggestions.push({
          id: `prereq-${prereq.id}`,
          title: prereq.actionLabel || 'Complete Prerequisite',
          description: prereq.description,
          type: 'shortcut',
          action: {
            label: prereq.actionLabel || 'Go',
            href: prereq.actionHref,
          },
        });
      });
  }

  // Stuck indicator 3: Repeated visits without completion
  const patterns = getUsagePatterns();
  const featureUsage = patterns.features[currentFeature];
  if (featureUsage && featureUsage.count > 5 && !hasCompletedAction) {
    isStuck = true;
    reason = 'You\'ve visited this feature multiple times without completing an action';

    suggestions.push({
      id: 'contact-support',
      title: 'Contact Support',
      description: 'Get personalized help from our team',
      type: 'contact',
      action: {
        label: 'Contact Us',
        href: '/settings?tab=support',
      },
    });
  }

  // Always offer general help
  if (isStuck) {
    suggestions.push({
      id: 'training-hub',
      title: 'Visit Training Hub',
      description: 'Browse all tutorials and guides',
      type: 'tutorial',
      action: {
        label: 'Training Hub',
        href: '/training-hub',
      },
    });
  }

  return {
    isStuck,
    reason,
    suggestions,
  };
}

// ============================================================================
// Complex Task Guidance
// ============================================================================

/**
 * Provide step-by-step guidance for complex tasks
 * Requirement 27.12: Provide step-by-step guidance for complex tasks
 */
export function getComplexTaskGuidance(taskId: string): ComplexTaskGuidance | null {
  const guidanceMap: Record<string, ComplexTaskGuidance> = {
    'setup-complete-profile': {
      taskId: 'setup-complete-profile',
      taskName: 'Complete Your Professional Profile',
      currentStep: 0,
      estimatedTotalTime: '10-15 minutes',
      prerequisites: [],
      steps: [
        {
          id: 'basic-info',
          title: 'Add Basic Information',
          description: 'Start with your name and agency details',
          instructions: [
            'Enter your full name as you want it to appear publicly',
            'Add your agency or brokerage name',
            'Provide your professional title (e.g., "Real Estate Agent")',
          ],
          tips: [
            'Use your legal name for credibility',
            'Include any professional designations (e.g., "Realtor®")',
          ],
          completed: false,
          estimatedTime: '2 minutes',
        },
        {
          id: 'contact-info',
          title: 'Add Contact Information',
          description: 'Ensure clients can reach you',
          instructions: [
            'Enter your business phone number',
            'Add your professional email address',
            'Include your business address',
          ],
          tips: [
            'Use a dedicated business phone if possible',
            'Ensure NAP (Name, Address, Phone) consistency across all platforms',
          ],
          completed: false,
          estimatedTime: '3 minutes',
        },
        {
          id: 'bio-expertise',
          title: 'Write Your Bio and Expertise',
          description: 'Tell your story and highlight your strengths',
          instructions: [
            'Write a compelling professional bio (2-3 paragraphs)',
            'List your areas of expertise (e.g., "Luxury Homes", "First-Time Buyers")',
            'Add your years of experience',
          ],
          tips: [
            'Focus on what makes you unique',
            'Include specific achievements or awards',
            'Mention your local market knowledge',
          ],
          completed: false,
          estimatedTime: '5 minutes',
          helpLink: '/training-hub?topic=writing-bio',
        },
        {
          id: 'social-links',
          title: 'Connect Social Media',
          description: 'Link your professional social profiles',
          instructions: [
            'Add your LinkedIn profile URL',
            'Include your Facebook business page',
            'Add Instagram if you use it for business',
          ],
          tips: [
            'Ensure all social profiles are professional and active',
            'Use consistent branding across all platforms',
          ],
          completed: false,
          estimatedTime: '2 minutes',
        },
      ],
    },
    'generate-first-marketing-plan': {
      taskId: 'generate-first-marketing-plan',
      taskName: 'Generate Your First Marketing Plan',
      currentStep: 0,
      estimatedTotalTime: '5-7 minutes',
      prerequisites: ['Complete profile with NAP information'],
      steps: [
        {
          id: 'run-brand-audit',
          title: 'Run Brand Audit',
          description: 'Check your online presence consistency',
          instructions: [
            'Navigate to Brand Audit page',
            'Click "Run Brand Audit" button',
            'Wait for AI to analyze your NAP consistency',
            'Review the results and note any issues',
          ],
          tips: [
            'Fix any NAP inconsistencies before generating your plan',
            'Import reviews to get sentiment analysis',
          ],
          completed: false,
          estimatedTime: '3 minutes',
          helpLink: '/training-hub?topic=brand-audit',
        },
        {
          id: 'analyze-competitors',
          title: 'Analyze Competitors (Optional)',
          description: 'Understand your competitive landscape',
          instructions: [
            'Go to Competitive Analysis page',
            'Let AI discover your local competitors',
            'Review competitor metrics and rankings',
          ],
          tips: [
            'This step is optional but provides valuable context',
            'Use competitor insights to differentiate yourself',
          ],
          completed: false,
          estimatedTime: '2 minutes',
        },
        {
          id: 'generate-plan',
          title: 'Generate Marketing Plan',
          description: 'Create your personalized strategy',
          instructions: [
            'Navigate to Marketing Plan page',
            'Click "Generate Marketing Plan" button',
            'Wait for AI to create your 3-step plan',
            'Review each action item and its rationale',
          ],
          tips: [
            'The plan is based on your profile and audit results',
            'Each step includes links to relevant tools',
          ],
          completed: false,
          estimatedTime: '2 minutes',
          helpLink: '/training-hub?topic=marketing-plan',
        },
      ],
    },
    'create-first-content': {
      taskId: 'create-first-content',
      taskName: 'Create Your First Marketing Content',
      currentStep: 0,
      estimatedTotalTime: '5-10 minutes',
      prerequisites: ['Complete profile'],
      steps: [
        {
          id: 'choose-content-type',
          title: 'Choose Content Type',
          description: 'Select what you want to create',
          instructions: [
            'Navigate to Content Engine',
            'Browse available content types',
            'Choose one that aligns with your marketing goals',
          ],
          tips: [
            'Start with a blog post or social media post',
            'Consider your audience and where they consume content',
          ],
          completed: false,
          estimatedTime: '1 minute',
        },
        {
          id: 'fill-form',
          title: 'Provide Content Details',
          description: 'Give AI context for generation',
          instructions: [
            'Fill in the required fields',
            'Be specific about your topic or focus',
            'Add any specific keywords or themes',
          ],
          tips: [
            'More detail = better results',
            'Think about your target audience',
          ],
          completed: false,
          estimatedTime: '3 minutes',
        },
        {
          id: 'review-edit',
          title: 'Review and Edit',
          description: 'Refine the generated content',
          instructions: [
            'Review the AI-generated content',
            'Make any necessary edits',
            'Ensure it matches your voice and brand',
          ],
          tips: [
            'Add personal touches and local insights',
            'Check for accuracy and relevance',
          ],
          completed: false,
          estimatedTime: '3 minutes',
        },
        {
          id: 'save-use',
          title: 'Save and Use',
          description: 'Save to library and publish',
          instructions: [
            'Copy the content or save to your library',
            'Publish to your chosen platform',
            'Track engagement and results',
          ],
          tips: [
            'Schedule content in advance for consistency',
            'Repurpose content across multiple platforms',
          ],
          completed: false,
          estimatedTime: '2 minutes',
        },
      ],
    },
  };

  return guidanceMap[taskId] || null;
}

/**
 * Update guidance step completion
 */
export function updateGuidanceStep(
  guidance: ComplexTaskGuidance,
  stepId: string,
  completed: boolean
): ComplexTaskGuidance {
  const updatedSteps = guidance.steps.map((step) =>
    step.id === stepId ? { ...step, completed } : step
  );

  // Update current step to next incomplete step
  const nextIncompleteIndex = updatedSteps.findIndex((step) => !step.completed);
  const currentStep = nextIncompleteIndex >= 0 ? nextIncompleteIndex : updatedSteps.length - 1;

  return {
    ...guidance,
    steps: updatedSteps,
    currentStep,
  };
}

// ============================================================================
// Workflow Optimizations
// ============================================================================

/**
 * Get all workflow optimizations for current context
 * Combines patterns, shortcuts, and efficiency suggestions
 */
export function getWorkflowOptimizations(
  currentFeature: string,
  profile: Partial<Profile> | null,
  timeOnPage: number,
  hasCompletedAction: boolean
): WorkflowOptimization[] {
  const optimizations: WorkflowOptimization[] = [];

  // Detect patterns and suggest shortcuts
  const patterns = detectWorkflowPatterns();
  const shortcuts = suggestWorkflowShortcuts(currentFeature, patterns);

  shortcuts.forEach((shortcut) => {
    optimizations.push({
      type: 'shortcut',
      title: shortcut.title,
      description: shortcut.description,
      impact: 'high',
      action: shortcut.action,
    });
  });

  // Check if stuck and provide assistance
  const stuckDetection = detectIfStuck(
    currentFeature,
    timeOnPage,
    profile,
    hasCompletedAction
  );

  if (stuckDetection.isStuck) {
    stuckDetection.suggestions.forEach((suggestion) => {
      optimizations.push({
        type: 'efficiency',
        title: suggestion.title,
        description: suggestion.description,
        impact: 'high',
        action: {
          label: suggestion.action?.label || 'Learn More',
          href: suggestion.action?.href,
          onClick: suggestion.action?.onClick,
        },
      });
    });
  }

  // Add efficiency suggestions based on usage patterns
  const efficiencySuggestions = getEfficiencySuggestions(currentFeature);
  optimizations.push(...efficiencySuggestions);

  return optimizations;
}

/**
 * Get efficiency suggestions for a feature
 */
function getEfficiencySuggestions(currentFeature: string): WorkflowOptimization[] {
  const suggestions: Record<string, WorkflowOptimization[]> = {
    'content-engine': [
      {
        type: 'efficiency',
        title: 'Batch Create Content',
        description: 'Create multiple pieces of content at once to save time',
        impact: 'medium',
        action: {
          label: 'Learn How',
          href: '/training-hub?topic=batch-content',
        },
      },
      {
        type: 'efficiency',
        title: 'Use Content Templates',
        description: 'Save frequently used content structures as templates',
        impact: 'medium',
        action: {
          label: 'View Templates',
          href: '/content-engine?tab=templates',
        },
      },
    ],
    'marketing-plan': [
      {
        type: 'efficiency',
        title: 'Set Recurring Tasks',
        description: 'Schedule regular marketing activities to stay consistent',
        impact: 'high',
        action: {
          label: 'Set Schedule',
          href: '/marketing-plan?action=schedule',
        },
      },
    ],
    'brand-audit': [
      {
        type: 'efficiency',
        title: 'Schedule Regular Audits',
        description: 'Run monthly audits to catch issues early',
        impact: 'medium',
        action: {
          label: 'Set Reminder',
          href: '/settings?tab=notifications',
        },
      },
    ],
  };

  return suggestions[currentFeature] || [];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format feature ID to readable name
 */
function formatFeatureName(featureId: string): string {
  const names: Record<string, string> = {
    'profile': 'Profile',
    'marketing-plan': 'Marketing Plan',
    'brand-audit': 'Brand Audit',
    'competitive-analysis': 'Competitive Analysis',
    'content-engine': 'Content Engine',
    'research-agent': 'Research Agent',
    'knowledge-base': 'Knowledge Base',
    'training-hub': 'Training Hub',
    'integrations': 'Integrations',
    'settings': 'Settings',
  };

  return names[featureId] || featureId;
}

/**
 * Get feature path from ID
 */
function getFeaturePath(featureId: string): string {
  return `/${featureId}`;
}

/**
 * Calculate time saved by using a shortcut
 */
export function calculateTimeSaved(
  fromFeature: string,
  toFeature: string,
  patterns: WorkflowPattern[]
): string {
  const pattern = patterns.find(
    (p) => p.sequence.includes(fromFeature) && p.sequence.includes(toFeature)
  );

  if (pattern) {
    const minutes = Math.round(pattern.avgTimeToComplete / (60 * 1000));
    return `${minutes} minutes`;
  }

  return '2-3 minutes';
}

/**
 * Get workflow efficiency score (0-100)
 */
export function getWorkflowEfficiencyScore(
  profile: Partial<Profile> | null
): number {
  let score = 0;

  // Profile completion (40 points)
  const requiredFields = ['name', 'agencyName', 'phone', 'address', 'bio'];
  const completedFields = requiredFields.filter(
    (field) => profile?.[field as keyof Profile]
  ).length;
  score += (completedFields / requiredFields.length) * 40;

  // Usage patterns (30 points)
  const patterns = getUsagePatterns();
  const featureCount = Object.keys(patterns.features).length;
  score += Math.min((featureCount / 5) * 30, 30);

  // Workflow patterns (30 points)
  const detectedPatterns = detectWorkflowPatterns();
  score += Math.min((detectedPatterns.length / 3) * 30, 30);

  return Math.round(score);
}
