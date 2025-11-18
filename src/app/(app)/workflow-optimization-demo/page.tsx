/**
 * Workflow Optimization Demo Page
 * 
 * Demonstrates the smart workflow optimization system
 */

import { WorkflowOptimizationDemo } from '@/components/workflow-optimization-demo';

// Mock profile data for demo
const mockProfile = {
    name: 'John Smith',
    agencyName: 'Smith Realty Group',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, CA 90210',
    bio: 'Experienced real estate agent specializing in luxury homes and first-time buyers.',
};

export default function WorkflowOptimizationDemoPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Workflow Optimization System
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Smart workflow detection, shortcuts, contextual assistance, and step-by-step guidance
                    </p>
                </div>

                <WorkflowOptimizationDemo
                    profile={mockProfile}
                    hasCompletedAction={false}
                />
            </div>
        </div>
    );
}
