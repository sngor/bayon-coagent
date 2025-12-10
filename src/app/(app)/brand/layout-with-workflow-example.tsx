/**
 * Example: Brand Layout with Workflow Integration
 * 
 * This is an example showing how to integrate workflows into the Brand hub layout.
 * To enable workflows in the Brand hub, replace the content of layout.tsx with this code.
 * 
 * Requirements: 2.1, 2.2, 4.3, 4.4, 4.5
 */

'use client';

import { HubLayoutWithWorkflow } from '@/components/hub/hub-layout-with-workflow';
import { WorkflowProvider } from '@/contexts/workflow-context';
import { FeatureGuard } from '@/components/feature-guard';
import { Target, User, Shield, Users, Zap, Calendar, MessageSquareQuote, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';

const brandTabs = [
    { id: 'profile', label: 'Profile', href: '/brand/profile', icon: User },
    { id: 'audit', label: 'Audit', href: '/brand/audit', icon: Shield },
    { id: 'ai-visibility', label: 'AI Visibility', href: '/brand/audit/ai-visibility', icon: Sparkles },
    { id: 'competitors', label: 'Competitors', href: '/brand/competitors', icon: Users },
    { id: 'strategy', label: 'Strategy', href: '/brand/strategy', icon: Zap },
    { id: 'testimonials', label: 'Testimonials', href: '/brand/testimonials', icon: MessageSquareQuote },
    { id: 'calendar', label: 'Calendar', href: '/brand/calendar', icon: Calendar },
];

export default function BrandLayout({ children }: { children: React.ReactNode }) {
    // Store current page data for workflow context
    const [currentPageData, setCurrentPageData] = useState<Record<string, any>>({});

    /**
     * Provide context data when workflow step is completed
     * 
     * This function is called by HubLayoutWithWorkflow when a step is completed.
     * It should return all relevant data from the current page that should be
     * passed to subsequent workflow steps.
     */
    const getWorkflowContext = useCallback(() => {
        return {
            ...currentPageData,
            timestamp: new Date().toISOString(),
        };
    }, [currentPageData]);

    /**
     * Handle workflow step completion
     * 
     * This callback is invoked after a step is successfully completed.
     * Use it for logging, analytics, or additional side effects.
     */
    const handleStepComplete = useCallback((stepId: string, data?: Record<string, any>) => {
        console.log('Brand workflow step completed:', stepId, data);

        // Optional: Send analytics event
        // trackEvent('workflow_step_completed', { stepId, hub: 'brand' });

        // Optional: Show success message
        // toast({ title: 'Step completed!', description: 'Moving to next step...' });
    }, []);

    return (
        <FeatureGuard featureId="brand">
            <WorkflowProvider>
                <HubLayoutWithWorkflow
                    title="Brand Identity & Strategy"
                    description="Own your market position and outshine the competition with professional branding tools"
                    icon={Target}
                    tabs={brandTabs}
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
 * Usage in Child Pages:
 * 
 * Child pages can access workflow context using the useWorkflowContext hook:
 * 
 * ```tsx
 * import { useWorkflowContext } from '@/hooks/use-workflow-context';
 * 
 * export default function ProfilePage() {
 *     const {
 *         isInWorkflowMode,
 *         getContext,
 *         hasContext,
 *     } = useWorkflowContext();
 * 
 *     // Pre-populate form with workflow context
 *     const initialData = useMemo(() => {
 *         if (isInWorkflowMode && hasContext('profileData')) {
 *             return getContext('profileData');
 *         }
 *         return {};
 *     }, [isInWorkflowMode, hasContext, getContext]);
 * 
 *     return <ProfileForm initialData={initialData} />;
 * }
 * ```
 * 
 * The workflow progress tracker will automatically appear when the page is
 * accessed with workflow query parameters:
 * 
 * /brand/profile?workflowInstanceId=abc123&workflowStepId=profile-setup
 */

