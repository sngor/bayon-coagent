'use client';

import { useState } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface FlowStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
}

export default function UserFlowDemoPage() {
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [contentCreationStep, setContentCreationStep] = useState(0);

    const onboardingSteps: FlowStep[] = [
        { id: '1', title: 'Create Account', description: 'Sign up with email', completed: true },
        { id: '2', title: 'Complete Profile', description: 'Add your professional information', completed: onboardingStep >= 1 },
        { id: '3', title: 'Connect Accounts', description: 'Link Google Business Profile', completed: onboardingStep >= 2 },
        { id: '4', title: 'Generate Plan', description: 'Create your marketing strategy', completed: onboardingStep >= 3 },
    ];

    const contentCreationSteps: FlowStep[] = [
        { id: '1', title: 'Choose Type', description: 'Select content format', completed: true },
        { id: '2', title: 'Provide Details', description: 'Enter topic and keywords', completed: contentCreationStep >= 1 },
        { id: '3', title: 'AI Generation', description: 'Let AI create content', completed: contentCreationStep >= 2 },
        { id: '4', title: 'Review & Edit', description: 'Refine the output', completed: contentCreationStep >= 3 },
        { id: '5', title: 'Save & Share', description: 'Export or publish', completed: contentCreationStep >= 4 },
    ];

    const onboardingProgress = ((onboardingStep + 1) / onboardingSteps.length) * 100;
    const contentProgress = ((contentCreationStep + 1) / contentCreationSteps.length) * 100;

    return (
        <StandardPageLayout
            title="User Flow Demo"
            description="Multi-step workflow demonstrations with progress tracking"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Onboarding Flow</CardTitle>
                        <CardDescription>
                            4-step process to get new users started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Progress</span>
                                <span className="text-muted-foreground">
                                    Step {onboardingStep + 1} of {onboardingSteps.length}
                                </span>
                            </div>
                            <Progress value={onboardingProgress} className="h-2" />
                        </div>

                        <div className="space-y-3">
                            {onboardingSteps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={cn(
                                        'flex items-start gap-4 p-4 rounded-lg border transition-all',
                                        step.completed ? 'bg-success/5 border-success/20' : 'bg-muted/50',
                                        index === onboardingStep && 'ring-2 ring-primary'
                                    )}
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-headline font-semibold">{step.title}</h4>
                                            {index === onboardingStep && (
                                                <Badge variant="default" className="text-xs">Current</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setOnboardingStep(Math.max(0, onboardingStep - 1))}
                                disabled={onboardingStep === 0}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                onClick={() => setOnboardingStep(Math.min(onboardingSteps.length - 1, onboardingStep + 1))}
                                disabled={onboardingStep === onboardingSteps.length - 1}
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Content Creation Flow</CardTitle>
                        <CardDescription>
                            5-step process for generating marketing content
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Progress</span>
                                <span className="text-muted-foreground">
                                    {Math.round(contentProgress)}% Complete
                                </span>
                            </div>
                            <Progress value={contentProgress} className="h-2" />
                        </div>

                        <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                            <div className="space-y-4">
                                {contentCreationSteps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            'relative flex items-start gap-4 p-4 rounded-lg border transition-all',
                                            step.completed ? 'bg-success/5 border-success/20' : 'bg-muted/50',
                                            index === contentCreationStep && 'ring-2 ring-primary'
                                        )}
                                    >
                                        <div className="relative z-10">
                                            {step.completed ? (
                                                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                                            ) : (
                                                <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-headline font-semibold">{step.title}</h4>
                                                {index === contentCreationStep && (
                                                    <Badge variant="default" className="text-xs">Active</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setContentCreationStep(Math.max(0, contentCreationStep - 1))}
                                disabled={contentCreationStep === 0}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={() => setContentCreationStep(Math.min(contentCreationSteps.length - 1, contentCreationStep + 1))}
                                disabled={contentCreationStep === contentCreationSteps.length - 1}
                            >
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Visual progress tracking with percentage</li>
                            <li>✓ Step-by-step navigation with back/forward buttons</li>
                            <li>✓ Current step highlighting</li>
                            <li>✓ Completed step indicators</li>
                            <li>✓ Responsive design for all screen sizes</li>
                            <li>✓ Accessible keyboard navigation</li>
                            <li>✓ Timeline view for sequential processes</li>
                            <li>✓ Contextual descriptions for each step</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { id: '1', title: 'Step 1', completed: true },
  { id: '2', title: 'Step 2', completed: currentStep >= 1 },
  { id: '3', title: 'Step 3', completed: currentStep >= 2 },
];

<Progress value={(currentStep / steps.length) * 100} />

{steps.map((step, index) => (
  <div className={step.completed ? 'completed' : 'pending'}>
    {step.completed ? <CheckCircle2 /> : <Circle />}
    <h4>{step.title}</h4>
  </div>
))}`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
