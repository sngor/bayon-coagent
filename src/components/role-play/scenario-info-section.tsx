import { Badge } from '@/components/ui/badge';
import { Target, User, CheckCircle, AlertCircle } from 'lucide-react';
import { getDifficultyColor } from '@/lib/learning/utils';
import type { RolePlayScenario } from '@/lib/constants/learning-data';

interface ScenarioInfoSectionProps {
    scenario: RolePlayScenario;
}

export function ScenarioInfoSection({ scenario }: ScenarioInfoSectionProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {scenario.difficulty}
                    </Badge>
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Learning Objectives
                    </h4>
                    <ul className="space-y-2">
                        {scenario.learningObjectives.map((objective, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                {objective}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        AI Client: {scenario.persona.name}
                    </h4>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 rounded-lg bg-secondary/20">
                            <p className="italic">"{scenario.persona.background}"</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <strong className="text-xs uppercase tracking-wider text-muted-foreground">Personality</strong>
                                <p className="text-sm">{scenario.persona.personality}</p>
                            </div>
                            <div>
                                <strong className="text-xs uppercase tracking-wider text-muted-foreground">Communication</strong>
                                <p className="text-sm">{scenario.persona.communicationStyle}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface GoalsAndConcernsSectionProps {
    scenario: RolePlayScenario;
}

export function GoalsAndConcernsSection({ scenario }: GoalsAndConcernsSectionProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Client Goals
                </h4>
                <ul className="space-y-2">
                    {scenario.persona.goals.map((goal, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm p-2 rounded bg-green-50 dark:bg-green-900/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                            {goal}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Client Concerns
                </h4>
                <ul className="space-y-2">
                    {scenario.persona.concerns.map((concern, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                            {concern}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}