import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Target, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDifficultyColor } from '@/lib/learning/utils';
import type { RolePlayScenario } from '@/lib/constants/learning-data';

interface ScenarioCardProps {
    scenario: RolePlayScenario;
    onClick: (scenario: RolePlayScenario) => void;
}

export function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
    return (
        <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
            onClick={() => onClick(scenario)}
        >
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 group-hover:from-primary/30 group-hover:to-purple-600/30 transition-all" />
                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <Badge className={cn(getDifficultyColor(scenario.difficulty), "text-xs")}>
                        {scenario.difficulty}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {scenario.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                            {scenario.description}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                            <span className="font-medium">{scenario.persona.name}</span>
                            <span className="text-muted-foreground">({scenario.persona.gender})</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3 flex-shrink-0" />
                            <span>{scenario.learningObjectives.length} learning objectives</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                            "{scenario.persona.background.substring(0, 100)}..."
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}