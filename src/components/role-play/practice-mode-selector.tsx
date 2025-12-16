import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mic, Lightbulb, Sparkles } from 'lucide-react';

type PracticeMode = 'text' | 'voice' | 'coaching';

interface PracticeModeSelectorProps {
    selectedMode: PracticeMode;
    onModeChange: (mode: PracticeMode) => void;
}

const PRACTICE_MODES = [
    {
        id: 'text' as const,
        title: 'Text Chat',
        badge: 'Beginner Friendly',
        description: 'Practice conversations through text messages. Perfect for learning objection handling and building confidence.',
        icon: MessageSquare,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
        id: 'voice' as const,
        title: 'Voice Practice',
        badge: 'Realistic',
        description: 'Have real-time voice conversations with AI clients. Experience natural dialogue and improve your speaking skills.',
        icon: Mic,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
        id: 'coaching' as const,
        title: 'Coaching Mode',
        badge: 'Advanced',
        description: 'Voice practice with real-time coaching feedback. Get technique recognition and improvement tips as you practice.',
        icon: Lightbulb,
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    }
] as const;

export function PracticeModeSelector({ selectedMode, onModeChange }: PracticeModeSelectorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Choose Your Practice Mode
                </CardTitle>
                <CardDescription>
                    Select how you want to practice your real estate skills
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRACTICE_MODES.map((mode) => {
                        const IconComponent = mode.icon;
                        const isSelected = selectedMode === mode.id;

                        return (
                            <div
                                key={mode.id}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                onClick={() => onModeChange(mode.id)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`h-10 w-10 rounded-lg ${mode.bgColor} flex items-center justify-center`}>
                                        <IconComponent className={`h-5 w-5 ${mode.iconColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{mode.title}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {mode.badge}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {mode.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}