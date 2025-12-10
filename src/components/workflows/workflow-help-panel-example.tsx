/**
 * Workflow Help Panel Example
 * 
 * Example usage of the WorkflowHelpPanel component.
 * This demonstrates how to integrate the help panel into a workflow page.
 */

'use client';

import React from 'react';
import { WorkflowHelpPanel } from './workflow-help-panel';
import { WorkflowStepDefinition } from '@/types/workflows';

/**
 * Example step with all optional fields populated
 */
const exampleStepWithAllFeatures: WorkflowStepDefinition & {
    warnings?: string[];
    aiPromptTips?: string[];
    documentationLinks?: Array<{ title: string; url: string }>;
} = {
    id: 'blog-post',
    title: 'Write Blog Post',
    description: 'Generate a blog post about the market trend',
    hubRoute: '/studio/write?type=blog',
    estimatedMinutes: 10,
    isOptional: false,
    helpText: 'Turn data into engaging content that positions you as a market expert. A well-written blog post can drive traffic to your website and establish your authority.',
    tips: [
        'Include specific data points from your market research',
        'Add a clear call-to-action at the end',
        'Use subheadings to break up the content',
        'Keep paragraphs short for better readability'
    ],
    completionCriteria: 'Blog post generated and saved',
    contextInputs: ['trendData', 'researchReport'],
    contextOutputs: ['blogPost'],
    // Extended fields
    warnings: [
        'Don\'t copy content directly from sources - always paraphrase and add your own insights',
        'Avoid using too much jargon that might confuse first-time homebuyers',
        'Make sure to fact-check all statistics before publishing'
    ],
    aiPromptTips: [
        'Be specific about your target audience (e.g., "first-time homebuyers in Seattle")',
        'Include the tone you want (professional, friendly, authoritative)',
        'Mention any specific points you want to emphasize',
        'Request a specific word count or structure (e.g., "800 words with 3 sections")'
    ],
    documentationLinks: [
        {
            title: 'How to Write Effective Real Estate Blog Posts',
            url: '/docs/content-creation/blog-posts'
        },
        {
            title: 'SEO Best Practices for Real Estate Content',
            url: '/docs/seo/best-practices'
        },
        {
            title: 'Using AI to Generate Content',
            url: '/docs/ai/content-generation'
        }
    ]
};

/**
 * Example step with minimal fields (basic step)
 */
const exampleBasicStep: WorkflowStepDefinition = {
    id: 'profile-setup',
    title: 'Set Up Your Profile',
    description: 'Create your professional profile with business details',
    hubRoute: '/brand/profile',
    estimatedMinutes: 15,
    isOptional: false,
    helpText: 'Your profile is the foundation of your online presence. Complete information helps the AI generate better content tailored to your brand.',
    tips: [
        'Use a professional headshot',
        'Include all contact information',
        'Highlight your unique value proposition'
    ],
    completionCriteria: 'Profile saved with required fields',
    contextOutputs: ['profileData']
};

/**
 * Example step with warnings but no AI tips
 */
const exampleStepWithWarnings: WorkflowStepDefinition & {
    warnings?: string[];
} = {
    id: 'brand-audit',
    title: 'Audit Your Presence',
    description: 'Check NAP consistency and import reviews',
    hubRoute: '/brand/audit',
    estimatedMinutes: 10,
    isOptional: false,
    helpText: 'Ensure your business information is consistent everywhere online. Inconsistent NAP (Name, Address, Phone) data can hurt your local SEO.',
    tips: [
        'Fix any inconsistencies immediately',
        'Connect your Google Business Profile',
        'Check all major directories and social media profiles'
    ],
    completionCriteria: 'Audit completed',
    contextInputs: ['profileData'],
    contextOutputs: ['auditResults'],
    warnings: [
        'Don\'t skip fixing inconsistencies - they directly impact your search rankings',
        'Make sure your phone number format is consistent across all platforms',
        'Verify your business hours are up to date everywhere'
    ]
};

/**
 * Example component showing WorkflowHelpPanel usage
 */
export function WorkflowHelpPanelExample() {
    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold mb-2">Workflow Help Panel Examples</h1>
                <p className="text-muted-foreground">
                    Examples of the WorkflowHelpPanel component with different configurations
                </p>
            </div>

            {/* Example 1: Full-featured help panel */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Full-Featured Help Panel</h2>
                    <p className="text-sm text-muted-foreground">
                        Shows all features: help text, tips, warnings, AI prompt tips, and documentation links
                    </p>
                </div>
                <WorkflowHelpPanel
                    step={exampleStepWithAllFeatures}
                    defaultOpen={true}
                />
            </div>

            {/* Example 2: Basic help panel */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Basic Help Panel</h2>
                    <p className="text-sm text-muted-foreground">
                        Shows minimal configuration with just help text and tips
                    </p>
                </div>
                <WorkflowHelpPanel
                    step={exampleBasicStep}
                    defaultOpen={true}
                />
            </div>

            {/* Example 3: Help panel with warnings */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Help Panel with Warnings</h2>
                    <p className="text-sm text-muted-foreground">
                        Shows help panel with common mistakes section
                    </p>
                </div>
                <WorkflowHelpPanel
                    step={exampleStepWithWarnings}
                    defaultOpen={true}
                />
            </div>

            {/* Example 4: Collapsed by default */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Collapsed by Default</h2>
                    <p className="text-sm text-muted-foreground">
                        Help panel that starts collapsed to save space
                    </p>
                </div>
                <WorkflowHelpPanel
                    step={exampleStepWithAllFeatures}
                    defaultOpen={false}
                />
            </div>

            {/* Usage instructions */}
            <div className="mt-12 p-6 rounded-lg border bg-muted/50">
                <h3 className="text-lg font-semibold mb-4">Usage Instructions</h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-medium mb-2">Basic Usage:</h4>
                        <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                            {`import { WorkflowHelpPanel } from '@/components/workflows/workflow-help-panel';

<WorkflowHelpPanel
  step={currentStep}
  defaultOpen={true}
/>`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Extended Step Definition:</h4>
                        <p className="text-muted-foreground mb-2">
                            To use warnings, AI tips, or documentation links, extend your step definition:
                        </p>
                        <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                            {`const step: WorkflowStepDefinition & {
  warnings?: string[];
  aiPromptTips?: string[];
  documentationLinks?: Array<{ title: string; url: string }>;
} = {
  // ... standard fields
  warnings: ['Warning 1', 'Warning 2'],
  aiPromptTips: ['Tip 1', 'Tip 2'],
  documentationLinks: [
    { title: 'Guide', url: '/docs/guide' }
  ]
};`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Features:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Collapsible panel to save screen space</li>
                            <li>Help text explaining the step's purpose</li>
                            <li>Tips for completing the step effectively</li>
                            <li>Warnings about common mistakes (optional)</li>
                            <li>AI prompt tips for AI generation steps (optional)</li>
                            <li>Documentation links for additional help (optional)</li>
                            <li>Smooth animations with Framer Motion</li>
                            <li>Responsive design for mobile and desktop</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
