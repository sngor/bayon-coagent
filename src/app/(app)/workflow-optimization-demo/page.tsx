'use client';

import { StandardPageLayout } from '@/components/standard';
import { WorkflowOptimizationDemo } from '@/components/workflow-optimization-demo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Profile } from '@/lib/types/common/common';

export default function WorkflowOptimizationDemoPage() {
    // Sample profile for demo
    const sampleProfile: Partial<Profile> = {
        id: 'demo-user',
        name: 'Demo Agent',
        agencyName: 'Demo Realty',
    };

    return (
        <StandardPageLayout
            title="Workflow Optimization Demo"
            description="Smart workflow detection, shortcuts, and contextual assistance"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>About Workflow Optimization</CardTitle>
                        <CardDescription>
                            Intelligent system that learns from user behavior to provide shortcuts and assistance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-headline font-semibold mb-2">Key Features:</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>✓ <strong>Pattern Detection:</strong> Identifies common sequences of actions</li>
                                    <li>✓ <strong>Smart Shortcuts:</strong> Suggests quick actions based on workflow patterns</li>
                                    <li>✓ <strong>Task Guidance:</strong> Step-by-step instructions for complex workflows</li>
                                    <li>✓ <strong>Stuck Detection:</strong> Contextual help when users need assistance</li>
                                    <li>✓ <strong>Efficiency Scoring:</strong> Tracks and improves workflow efficiency</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <WorkflowOptimizationDemo
                    profile={sampleProfile}
                    hasCompletedAction={true}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { useWorkflowOptimization } from '@/hooks/use-workflow-optimization';

const {
  patterns,
  shortcuts,
  stuckDetection,
  optimizations,
  efficiencyScore,
  getGuidance,
} = useWorkflowOptimization({
  profile: agentProfile,
  hasCompletedAction: true,
});

// Use shortcuts
{shortcuts.map(shortcut => (
  <Button onClick={() => navigate(shortcut.action.href)}>
    {shortcut.title}
  </Button>
))}

// Show stuck detection
{stuckDetection.isStuck && (
  <Alert>
    {stuckDetection.reason}
    {stuckDetection.suggestions.map(s => (
      <Button>{s.title}</Button>
    ))}
  </Alert>
)}`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
