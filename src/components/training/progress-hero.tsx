'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, Play, Zap, TrendingUp, Handshake, Award } from 'lucide-react';

interface ProgressHeroProps {
    completedModules: Set<string>;
    totalModules: number;
    marketingModules: any[];
    closingModules: any[];
    professionalModules: any[];
    firstIncompleteModule?: any;
    onContinueLearning: () => void;
}

export function ProgressHero({
    completedModules,
    totalModules,
    marketingModules,
    closingModules,
    professionalModules,
    firstIncompleteModule,
    onContinueLearning,
}: ProgressHeroProps) {
    const completionPercentage = (completedModules.size / totalModules) * 100;
    const isCompleted = completedModules.size === totalModules;

    return (
        <Card className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
            </div>

            <CardHeader className="relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-2xl">Your Learning Journey</CardTitle>
                                <CardDescription className="text-base">
                                    {isCompleted
                                        ? "🎉 Congratulations! You've mastered all modules!"
                                        : `${totalModules - completedModules.size} modules remaining to complete your learning journey`}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                    {isCompleted ? (
                        <div className="animate-in zoom-in spin-in-180 duration-500">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-2 text-sm">
                                <Trophy className="h-4 w-4 mr-2" />
                                Expert Level
                            </Badge>
                        </div>
                    ) : firstIncompleteModule && (
                        <Button
                            onClick={onContinueLearning}
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white border-0 px-6 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Continue Learning
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="relative space-y-6">
                {/* Enhanced Progress Bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Overall Progress
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">{Math.round(completionPercentage)}%</span>
                            <span className="text-sm text-muted-foreground">complete</span>
                        </div>
                    </div>
                    <div className="relative">
                        <Progress value={completionPercentage} className="h-4 bg-secondary/50" />
                        <div
                            className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-primary/20 to-transparent transition-all duration-1000 ease-out"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <ProgressCard
                        icon={TrendingUp}
                        label="Marketing"
                        completed={marketingModules.filter(m => completedModules.has(m.id)).length}
                        total={marketingModules.length}
                        color="blue"
                    />
                    <ProgressCard
                        icon={Handshake}
                        label="Closing"
                        completed={closingModules.filter(m => completedModules.has(m.id)).length}
                        total={closingModules.length}
                        color="green"
                    />
                    <ProgressCard
                        icon={Award}
                        label="Professional"
                        completed={professionalModules.filter(m => completedModules.has(m.id)).length}
                        total={professionalModules.length}
                        color="purple"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

interface ProgressCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    completed: number;
    total: number;
    color: 'blue' | 'green' | 'purple';
}

function ProgressCard({ icon: Icon, label, completed, total, color }: ProgressCardProps) {
    const colorClasses = {
        blue: {
            bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10',
            border: 'border-blue-200/50 dark:border-blue-800/30',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            text: 'text-blue-700 dark:text-blue-300',
            number: 'text-blue-900 dark:text-blue-100',
        },
        green: {
            bg: 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10',
            border: 'border-green-200/50 dark:border-green-800/30',
            iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
            text: 'text-green-700 dark:text-green-300',
            number: 'text-green-900 dark:text-green-100',
        },
        purple: {
            bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10',
            border: 'border-purple-200/50 dark:border-purple-800/30',
            iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            text: 'text-purple-700 dark:text-purple-300',
            number: 'text-purple-900 dark:text-purple-100',
        },
    };

    const classes = colorClasses[color];

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${classes.bg} border ${classes.border} hover:scale-[1.02] transition-transform duration-200`}>
            <div className={`h-10 w-10 rounded-lg ${classes.iconBg} flex items-center justify-center shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className={`text-xs font-medium ${classes.text}`}>{label}</p>
                <p className={`text-lg font-bold ${classes.number}`}>
                    {completed}/{total}
                </p>
            </div>
        </div>
    );
}