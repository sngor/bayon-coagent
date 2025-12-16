import { useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { getPracticeModeConfig, type PracticeMode } from '@/lib/constants/practice-modes';
import { ScenarioInfoSection, GoalsAndConcernsSection } from './scenario-info-section';
import type { RolePlayScenario } from '@/lib/constants/learning-data';

interface ScenarioDetailDialogProps {
    scenario: RolePlayScenario | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartSession: (scenario: RolePlayScenario) => void;
    selectedMode?: PracticeMode;
}

export function ScenarioDetailDialog({
    scenario,
    open,
    onOpenChange,
    onStartSession,
    selectedMode = 'text',
}: ScenarioDetailDialogProps) {
    if (!scenario) return null;

    const currentMode = useMemo(() => getPracticeModeConfig(selectedMode), [selectedMode]);

    const handleStartSession = useCallback(() => {
        onStartSession(scenario);
    }, [onStartSession, scenario]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{scenario.title}</DialogTitle>
                    <DialogDescription className="text-base">
                        {scenario.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6">
                    {/* Practice Mode Info */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                            <currentMode.icon className="h-4 w-4" />
                            <div>
                                <h4 className="font-semibold">{currentMode.label} Practice Mode</h4>
                                <p className="text-sm text-muted-foreground">{currentMode.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scenario Info */}
                    <ScenarioInfoSection scenario={scenario} />

                    {/* Goals and Concerns */}
                    <GoalsAndConcernsSection scenario={scenario} />

                    {/* Related Modules */}
                    {scenario.relatedModules.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Related Learning Modules</h4>
                            <div className="flex flex-wrap gap-2">
                                {scenario.relatedModules.map((module, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {module.replace('-', ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleStartSession}>
                        <Play className="h-4 w-4 mr-2" />
                        Start {currentMode.label} Practice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}