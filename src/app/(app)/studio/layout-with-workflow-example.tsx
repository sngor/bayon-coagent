/**
 * Example: Studio Layout with Workflow Integration
 * 
 * This is an example showing how to integrate workflows into the Studio hub layout.
 * To enable workflows in the Studio hub, replace the content of layout.tsx with this code.
 * 
 * Requirements: 2.1, 2.2, 4.3, 4.4, 4.5
 */

'use client';

import { HubLayoutWithWorkflow } from '@/components/hub/hub-layout-with-workflow';
import { WorkflowProvider } from '@/contexts/workflow-context';
import { FeatureGuard } from '@/components/feature-guard';
import { Sparkles, PenTool, FileText, Image } from 'lucide-react';
import { useCallback, useState } from 'react';

const studioTabs = [
    { id: 'write', label: 'Write', href: '/studio/write', icon: PenTool },
    { id: 'describe', label: 'Describe', href: '/studio/describe', icon: FileText },
    { id: 'reimagine', label: 'Reimagine', href: '/studio/reimagine', icon: Image },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    // Store current page data for workflow context
    const [currentPageData, setCurrentPageData] = useState<Record<string, any>>({});

    /**
     * Provide context data when workflow step is completed
     * 
     * For Studio hub, this might include:
     * - Generated content (blog posts, social media posts, descriptions)
     * - Property details
     * - Enhanced images
     * - Content metadata
     */
    const getWorkflowContext = useCallback(() => {
        return {
            ...currentPageData,
            timestamp: new Date().toISOString(),
        };
    }, [currentPageData]);

    /**
     * Handle workflow step completion
     */
    const handleStepComplete = useCallback((stepId: string, data?: Record<string, any>) => {
        console.log('Studio workflow step completed:', stepId, data);

        // Optional: Auto-save generated content to library
        if (data?.generatedContent) {
            // saveToLibrary(data.generatedContent);
        }
    }, []);

    return (
        <FeatureGuard featureId="studio">
            <WorkflowProvider>
                <HubLayoutWithWorkflow
                    title="Content Studio"
                    description="Turn ideas into polished content in minutes with AI-powered creation tools"
                    icon={Sparkles}
                    tabs={studioTabs}
                    tabsVariant="pills"
                    getWorkflowContext={getWorkflowContext}
                    onWorkflowStepComplete={handleStepComplete}
                >
                    {children}
                </HubLayoutWithWorkflow>
            </WorkflowProvider>
        </FeatureGuard>
    );
}

/**
 * Example: Using Workflow Context in Studio Pages
 * 
 * The Studio hub is commonly used in content creation workflows.
 * Here's how to integrate workflow context in Studio pages:
 * 
 * ## Write Page (Blog Post Generation)
 * 
 * ```tsx
 * import { useWorkflowContext, useWorkflowStepInputs } from '@/hooks/use-workflow-context';
 * 
 * export default function WritePage() {
 *     const { isInWorkflowMode } = useWorkflowContext();
 *     const stepInputs = useWorkflowStepInputs();
 * 
 *     // Pre-populate with context from previous steps
 *     // e.g., market data, research results, property details
 *     const initialPrompt = useMemo(() => {
 *         if (stepInputs.trendData) {
 *             return `Write a blog post about ${stepInputs.trendData.topic}`;
 *         }
 *         if (stepInputs.researchReport) {
 *             return `Create content based on: ${stepInputs.researchReport.summary}`;
 *         }
 *         return '';
 *     }, [stepInputs]);
 * 
 *     return (
 *         <ContentGenerator
 *             initialPrompt={initialPrompt}
 *             contextData={stepInputs}
 *         />
 *     );
 * }
 * ```
 * 
 * ## Describe Page (Listing Descriptions)
 * 
 * ```tsx
 * export default function DescribePage() {
 *     const { getContext, hasContext } = useWorkflowContext();
 * 
 *     // Get property details from workflow context
 *     const propertyDetails = useMemo(() => {
 *         if (hasContext('propertyDetails')) {
 *             return getContext('propertyDetails');
 *         }
 *         return null;
 *     }, [hasContext, getContext]);
 * 
 *     return (
 *         <ListingDescriptionGenerator
 *             propertyDetails={propertyDetails}
 *         />
 *     );
 * }
 * ```
 * 
 * ## Reimagine Page (Image Enhancement)
 * 
 * ```tsx
 * export default function ReimagineP() {
 *     const { getContext, hasContext } = useWorkflowContext();
 * 
 *     // Get property images from workflow context
 *     const propertyImages = useMemo(() => {
 *         if (hasContext('propertyImages')) {
 *             return getContext('propertyImages', []);
 *         }
 *         return [];
 *     }, [hasContext, getContext]);
 * 
 *     return (
 *         <ImageEnhancer
 *             initialImages={propertyImages}
 *         />
 *     );
 * }
 * ```
 * 
 * ## Context Data Structure Examples
 * 
 * ### Market Update Post Workflow
 * - Step 1 (Market Insights): `{ trendData: { topic, data, charts } }`
 * - Step 2 (Research): `{ researchReport: { summary, sources, insights } }`
 * - Step 3 (Write): `{ blogPost: { title, content, metadata } }`
 * - Step 4 (Social): `{ socialPosts: [{ platform, content, hashtags }] }`
 * 
 * ### New Listing Campaign Workflow
 * - Step 1 (Property Details): `{ propertyDetails: { address, features, price } }`
 * - Step 2 (Description): `{ listingDescription: { headline, body, highlights } }`
 * - Step 3 (Reimagine): `{ enhancedImages: [{ original, enhanced, type }] }`
 * - Step 4 (Social Campaign): `{ socialCampaign: [{ platform, post, image }] }`
 */

