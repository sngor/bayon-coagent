import { useMemo } from 'react';
import type { Profile } from '@/lib/types';

interface ProfileField {
  key: keyof Profile;
  label: string;
  benefit: string;
  required: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
  {
    key: 'name',
    label: 'Full Name',
    benefit: 'Personalizes your marketing content',
    required: true,
  },
  {
    key: 'agencyName',
    label: 'Agency Name',
    benefit: 'Builds your brand identity',
    required: true,
  },
  {
    key: 'phone',
    label: 'Phone Number',
    benefit: 'Enables NAP consistency checks',
    required: true,
  },
  {
    key: 'address',
    label: 'Business Address',
    benefit: 'Powers local SEO features',
    required: true,
  },
  {
    key: 'bio',
    label: 'Professional Bio',
    benefit: 'Enhances your E-E-A-T profile',
    required: true,
  },
  {
    key: 'yearsOfExperience',
    label: 'Years of Experience',
    benefit: 'Demonstrates expertise',
    required: false,
  },
  {
    key: 'licenseNumber',
    label: 'License Number',
    benefit: 'Builds trust and credibility',
    required: false,
  },
  {
    key: 'website',
    label: 'Website URL',
    benefit: 'Improves online presence',
    required: false,
  },
  {
    key: 'photoURL',
    label: 'Profile Photo',
    benefit: 'Makes your content more personal',
    required: false,
  },
];

interface NextStep {
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

export function useProfileCompletion(profile: Partial<Profile> | null | undefined) {
  return useMemo(() => {
    if (!profile) {
      return {
        percentage: 0,
        isComplete: false,
        hasRequiredFields: false,
        missingFields: PROFILE_FIELDS,
        nextField: PROFILE_FIELDS[0],
        nextStep: null,
      };
    }

    const completed = PROFILE_FIELDS.filter((field) => {
      const value = profile[field.key];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });

    const requiredFields = PROFILE_FIELDS.filter((f) => f.required);
    const completedRequired = completed.filter((f) => f.required);
    const missingFields = PROFILE_FIELDS.filter((field) => {
      const value = profile[field.key];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === null || value === '';
    });

    const percentage = Math.round(
      (completed.length / PROFILE_FIELDS.length) * 100
    );
    const isComplete = percentage === 100;
    const hasRequiredFields = completedRequired.length === requiredFields.length;

    // Determine next step based on profile completion
    let nextStep: NextStep | null = null;

    if (!hasRequiredFields) {
      nextStep = {
        title: 'Complete Your Profile',
        description: 'Fill in required fields to unlock AI-powered features',
        href: '/profile',
        priority: 'high',
      };
    } else if (isComplete) {
      nextStep = {
        title: 'Generate Marketing Plan',
        description: 'Create a personalized marketing strategy',
        href: '/marketing-plan',
        priority: 'high',
      };
    } else {
      nextStep = {
        title: 'Enhance Your Profile',
        description: 'Add optional fields to maximize your marketing potential',
        href: '/profile',
        priority: 'medium',
      };
    }

    return {
      percentage,
      isComplete,
      hasRequiredFields,
      missingFields,
      nextField: missingFields[0],
      nextStep,
      completedCount: completed.length,
      totalCount: PROFILE_FIELDS.length,
      requiredComplete: completedRequired.length,
      requiredTotal: requiredFields.length,
    };
  }, [profile]);
}

/**
 * Get suggested next actions based on profile state and existing data
 */
export function getSuggestedNextActions(
  profile: Partial<Profile> | null | undefined,
  hasMarketingPlan: boolean,
  hasBrandAudit: boolean,
  hasCompetitors: boolean
): NextStep[] {
  // Calculate profile completion inline instead of calling the hook
  const requiredFields = PROFILE_FIELDS.filter((f) => f.required);
  const completed = PROFILE_FIELDS.filter((field) => {
    if (!profile) return false;
    const value = profile[field.key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });
  const completedRequired = completed.filter((f) => f.required);
  const hasRequiredFields = completedRequired.length === requiredFields.length;
  const isComplete = completed.length === PROFILE_FIELDS.length;
  
  const suggestions: NextStep[] = [];

  // Priority 1: Complete profile if required fields are missing
  if (!hasRequiredFields) {
    suggestions.push({
      title: 'Complete Your Profile',
      description: 'Fill in required fields to unlock AI-powered features',
      href: '/profile',
      priority: 'high',
    });
    return suggestions; // Return early - this is blocking
  }

  // Priority 2: Generate marketing plan if none exists
  if (!hasMarketingPlan) {
    suggestions.push({
      title: 'Generate Marketing Plan',
      description: 'Create a personalized marketing strategy',
      href: '/marketing-plan',
      priority: 'high',
    });
  }

  // Priority 3: Run brand audit if none exists
  if (!hasBrandAudit) {
    suggestions.push({
      title: 'Run Brand Audit',
      description: 'Check your NAP consistency across the web',
      href: '/brand-audit',
      priority: 'high',
    });
  }

  // Priority 4: Find competitors if none exist
  if (!hasCompetitors) {
    suggestions.push({
      title: 'Analyze Competitors',
      description: 'Discover and analyze your local competition',
      href: '/competitive-analysis',
      priority: 'medium',
    });
  }

  // Priority 5: Enhance profile if not complete
  if (!isComplete) {
    suggestions.push({
      title: 'Enhance Your Profile',
      description: 'Add optional fields to maximize your marketing potential',
      href: '/profile',
      priority: 'medium',
    });
  }

  // Priority 6: Create content
  suggestions.push({
    title: 'Create Content',
    description: 'Generate blog posts, social media content, and more',
    href: '/content-engine',
    priority: 'low',
  });

  return suggestions;
}
