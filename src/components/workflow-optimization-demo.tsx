/**
 * Workflow Optimization Demo Component
 * 
 * Example integration showing how to use the workflow optimization system
 */

'use client';

import { useState } from 'react';
import { useWorkflowOptimization } from '@/hooks/use-workflow-optimization';
import { WorkflowOptimizationPanel } from './ui/workflow-optimization-panel';
import { TaskGuidance } from './ui/task-guidance';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import type { Profile } from '@/lib/types/common';
import type { ComplexTaskGuidance } from '@/lib/workflow-optimization';

interface WorkflowOptimizationDemoProps {
    profile: Partial<Profile> | null;
    hasCompletedAction?: boolean;
}

export function WorkflowOptimizationDemo({
    profile,
    hasCompletedAction = false,
}: WorkflowOptimizationDemoProps) {
    const [showPanel, setShowPanel] = useState(true);
    const [selectedGuidance, setSelectedGuidance] = useState<ComplexTaskGuidance | null>(null);

    const {
        patterns,
        shortcuts,
        stuckDetection,
        optimizations,
        efficiencyScore,
        getGuidance,
        updateStep,
    } = useWorkflowOptimization({
        profile,
        hasCompletedAction,
    });

    const handleOpenGuidance = (taskId: string) => {
        const guidance = getGuidance(taskId);
        if (guidance) {
            setSelectedGuidance(guidance);
        }
    };

    const handleStepComplete = (stepId: string) => {
        if (selectedGuidance) {
            const updated = updateStep(selectedGuidance, stepId, true);
            setSelectedGuidance(updated);
        }
    };

    return (
        <div className="space-y-6">
            {/* Demo Header */}
            <Card>
                <CardHeader>
                    <CardTitle>Workflow Optimization System</CardTitle>
                    <CardDescription>
                        Smart workflow detection, shortcuts, and contextual assistance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm font-medium">Efficiency Score</p>
                            <p className="text-2xl font-bold text-primary">{efficiencyScore}%</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Detected Patterns</p>
                            <p className="text-2xl font-bold">{patterns.length}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Available Shortcuts</p>
                            <p className="text-2xl font-bold">{shortcuts.length}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Optimizations</p>
                            <p className="text-2xl font-bold">{optimizations.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="patterns" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="patterns">Patterns</TabsTrigger>
                    <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                    <TabsTrigger value="guidance">Task Guidance</TabsTrigger>
                    <TabsTrigger value="stuck">Stuck Detection</TabsTrigger>
                </TabsList>

                {/* Workflow Patterns */}
                <TabsContent value="patterns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detected Workflow Patterns</CardTitle>
                            <CardDescription>
                                Common sequences of actions you perform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {patterns.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No patterns detected yet. Keep using the platform to build your workflow history.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {patterns.map((pattern) => (
                                        <div
                                            key={pattern.id}
                                            className="p-4 rounded-lg border bg-card"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-headline font-medium">{pattern.name}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {pattern.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {pattern.frequency} times
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            Avg: {Math.round(pattern.avgTimeToComplete / 60000)} min
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Workflow Shortcuts */}
                <TabsContent value="shortcuts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workflow Shortcuts</CardTitle>
                            <CardDescription>
                                Quick actions based on your workflow patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {shortcuts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No shortcuts available yet. Complete more actions to unlock shortcuts.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {shortcuts.map((shortcut) => (
                                        <div
                                            key={shortcut.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <h3 className="font-headline font-medium">{shortcut.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {shortcut.description}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <Badge variant="secondary" className="text-xs">
                                                    Saves {shortcut.estimatedTimeSaved}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={() => window.location.href = shortcut.action.href}
                                                >
                                                    {shortcut.action.label}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Task Guidance */}
                <TabsContent value="guidance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Complex Task Guidance</CardTitle>
                            <CardDescription>
                                Step-by-step instructions for complex workflows
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleOpenGuidance('setup-complete-profile')}
                            >
                                Complete Your Professional Profile
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleOpenGuidance('generate-first-marketing-plan')}
                            >
                                Generate Your First Marketing Plan
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleOpenGuidance('create-first-content')}
                            >
                                Create Your First Marketing Content
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stuck Detection */}
                <TabsContent value="stuck" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stuck Detection</CardTitle>
                            <CardDescription>
                                Contextual assistance when you need help
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stuckDetection.isStuck ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                            {stuckDetection.reason}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Suggestions:</p>
                                        {stuckDetection.suggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="p-3 rounded-lg border bg-card"
                                            >
                                                <h3 className="font-headline font-medium text-sm">{suggestion.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {suggestion.description}
                                                </p>
                                                {suggestion.action && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-2"
                                                        onClick={() => {
                                                            if (suggestion.action?.href) {
                                                                window.location.href = suggestion.action.href;
                                                            } else if (suggestion.action?.onClick) {
                                                                suggestion.action.onClick();
                                                            }
                                                        }}
                                                    >
                                                        {suggestion.action.label}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    You're doing great! No issues detected.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Floating Optimization Panel */}
            {showPanel && (
                <WorkflowOptimizationPanel
                    shortcuts={shortcuts}
                    stuckDetection={stuckDetection}
                    optimizations={optimizations}
                    efficiencyScore={efficiencyScore}
                    onDismiss={() => setShowPanel(false)}
                />
            )}

            {/* Task Guidance Dialog */}
            <Dialog
                open={selectedGuidance !== null}
                onOpenChange={(open) => !open && setSelectedGuidance(null)}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedGuidance && (
                        <TaskGuidance
                            guidance={selectedGuidance}
                            onStepComplete={handleStepComplete}
                            onClose={() => setSelectedGuidance(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Toggle Panel Button */}
            {!showPanel && (
                <Button
                    className="fixed bottom-4 right-4 z-50"
                    onClick={() => setShowPanel(true)}
                >
                    Show Workflow Assistant
                </Button>
            )}
        </div>
    );
}
