'use client';

import { useState, useMemo, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Handshake, Award, BookOpen, Clock, Target, Star, Trophy, Zap, Play, Sparkles } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import type { TrainingProgress } from '@/lib/types/common';
import { saveTrainingProgressAction } from '@/app/actions';
import { marketingModules, closingModules, professionalExcellenceModules, allModules } from '@/lib/constants/training-data';
import { Quiz } from '@/components/quiz';
// Removed framer-motion to improve performance
import { cn } from '@/lib/utils/common';


export default function TrainingLessonsPage() {
    const { user } = useUser();
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<string>('marketing');
    // Use the allModules from training-data instead of combining manually

    // Memoize DynamoDB keys
    const progressPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const progressSKPrefix = useMemo(() => 'TRAINING#', []);

    const { data: progressData } = useQuery<TrainingProgress>(progressPK, progressSKPrefix);

    const completedModules = useMemo(() => {
        if (!progressData) return new Set<string>();
        return new Set(progressData.filter(p => p.completed).map(p => p.id));
    }, [progressData]);

    const completionPercentage = useMemo(() => {
        if (completedModules.size === 0) return 0;
        return (completedModules.size / allModules.length) * 100;
    }, [completedModules, allModules.length]);

    const marketingCompletionPercentage = useMemo(() => {
        const completed = marketingModules.filter(m => completedModules.has(m.id)).length;
        return (completed / marketingModules.length) * 100;
    }, [completedModules]);

    const closingCompletionPercentage = useMemo(() => {
        const completed = closingModules.filter(m => completedModules.has(m.id)).length;
        return (completed / closingModules.length) * 100;
    }, [completedModules]);

    const professionalCompletionPercentage = useMemo(() => {
        const completed = professionalExcellenceModules.filter(m => completedModules.has(m.id)).length;
        return (completed / professionalExcellenceModules.length) * 100;
    }, [completedModules]);

    // Auto-open first incomplete module when data loads
    const firstIncompleteModule = useMemo(() => {
        return allModules.find(module => !completedModules.has(module.id));
    }, [allModules, completedModules]);

    // Auto-open first incomplete module on load
    useEffect(() => {
        if (firstIncompleteModule && !openAccordion) {
            setOpenAccordion(firstIncompleteModule.id);

            // Switch to the correct tab based on module type
            if (marketingModules.some(m => m.id === firstIncompleteModule.id)) {
                setActiveTab('marketing');
            } else if (closingModules.some(m => m.id === firstIncompleteModule.id)) {
                setActiveTab('closing');
            } else if (professionalExcellenceModules.some(m => m.id === firstIncompleteModule.id)) {
                setActiveTab('professional');
            }
        }
    }, [firstIncompleteModule, openAccordion, marketingModules, closingModules, professionalExcellenceModules]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaCmd) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        setActiveTab('marketing');
                        break;
                    case '2':
                        e.preventDefault();
                        setActiveTab('closing');
                        break;
                    case '3':
                        e.preventDefault();
                        setActiveTab('professional');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleQuizComplete = async (moduleId: string) => {
        if (!user) return;
        try {
            await saveTrainingProgressAction(moduleId, true);
        } catch (error) {
            console.error('Failed to save training progress:', error);
            // Could add toast notification here for better UX
            return;
        }

        // Open the next available module
        const currentIndex = allModules.findIndex(m => m.id === moduleId);
        if (currentIndex < allModules.length - 1) {
            const nextModule = allModules[currentIndex + 1];
            setOpenAccordion(nextModule.id);

            // Switch to correct tab for next module
            if (marketingModules.some(m => m.id === nextModule.id)) {
                setActiveTab('marketing');
            } else if (closingModules.some(m => m.id === nextModule.id)) {
                setActiveTab('closing');
            } else if (professionalExcellenceModules.some(m => m.id === nextModule.id)) {
                setActiveTab('professional');
            }
        } else {
            setOpenAccordion(undefined);
        }
    };

    const renderModuleAccordion = (modules: typeof marketingModules, colorTheme: 'blue' | 'green' | 'purple' = 'blue') => {
        const themeColors = {
            blue: {
                bg: 'bg-blue-50/50 dark:bg-blue-950/20',
                border: 'border-blue-200/50 dark:border-blue-800/30',
                text: 'text-blue-900 dark:text-blue-100',
                accent: 'text-blue-600 dark:text-blue-400',
                hover: 'hover:border-blue-300/50 dark:hover:border-blue-700/50',
                active: 'border-blue-400/50 dark:border-blue-600/50 shadow-blue-200/20 dark:shadow-blue-800/20',
                completed: 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-300/50 dark:border-blue-700/50'
            },
            green: {
                bg: 'bg-green-50/50 dark:bg-green-950/20',
                border: 'border-green-200/50 dark:border-green-800/30',
                text: 'text-green-900 dark:text-green-100',
                accent: 'text-green-600 dark:text-green-400',
                hover: 'hover:border-green-300/50 dark:hover:border-green-700/50',
                active: 'border-green-400/50 dark:border-green-600/50 shadow-green-200/20 dark:shadow-green-800/20',
                completed: 'bg-green-100/50 dark:bg-green-900/30 border-green-300/50 dark:border-green-700/50'
            },
            purple: {
                bg: 'bg-purple-50/50 dark:bg-purple-950/20',
                border: 'border-purple-200/50 dark:border-purple-800/30',
                text: 'text-purple-900 dark:text-purple-100',
                accent: 'text-purple-600 dark:text-purple-400',
                hover: 'hover:border-purple-300/50 dark:hover:border-purple-700/50',
                active: 'border-purple-400/50 dark:border-purple-600/50 shadow-purple-200/20 dark:shadow-purple-800/20',
                completed: 'bg-purple-100/50 dark:bg-purple-900/30 border-purple-300/50 dark:border-purple-700/50'
            }
        };

        const theme = themeColors[colorTheme];

        return (
            <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordion} onValueChange={setOpenAccordion}>
                {modules.map((module, index) => {
                    const isCompleted = completedModules.has(module.id);
                    const isActive = openAccordion === module.id;

                    return (
                        <div
                            key={module.id}
                            className="animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <AccordionItem
                                value={module.id}
                                className={cn(
                                    'border-0 rounded-xl transition-all duration-300 overflow-hidden',
                                    isCompleted ? theme.completed : 'border border-border',
                                    isActive ? `${theme.active} shadow-lg` : theme.hover,
                                    'group'
                                )}
                            >
                                <AccordionTrigger className="px-6 py-5 hover:no-underline text-left group-hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="relative flex-shrink-0">
                                            {isCompleted ? (
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg animate-in zoom-in">
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    'h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                                                    isActive
                                                        ? `border-${colorTheme}-500 bg-${colorTheme}-50 dark:bg-${colorTheme}-950/30`
                                                        : 'border-muted-foreground group-hover:border-primary'
                                                )}>
                                                    <span className={cn(
                                                        'text-sm font-bold transition-colors',
                                                        isActive
                                                            ? theme.accent
                                                            : 'text-muted-foreground group-hover:text-primary'
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                </div>
                                            )}
                                            {!isCompleted && isActive && (
                                                <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-headline text-base md:text-lg font-semibold text-foreground">
                                                    {module.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {isCompleted && (
                                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
                                                            <Award className="h-3 w-3 mr-1" />
                                                            Completed
                                                        </Badge>
                                                    )}
                                                    {!isCompleted && isActive && (
                                                        <Badge variant="outline" className={cn('border-primary/50', theme.accent)}>
                                                            <Play className="h-3 w-3 mr-1" />
                                                            In Progress
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    15-20 min
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Target className="h-3 w-3" />
                                                    {module.quiz.length} quiz questions
                                                </span>
                                                {isCompleted && (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <Sparkles className="h-3 w-3" />
                                                        Mastered
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="pt-4 space-y-6 animate-in fade-in duration-300">
                                        {/* Content */}
                                        <div className="prose prose-sm md:prose-base max-w-none text-foreground/80 dark:prose-invert prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-p:leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: module.content }} />
                                        </div>

                                        {/* Quiz Section */}
                                        <div className="border-t pt-6">
                                            <Quiz
                                                moduleId={module.id}
                                                questions={module.quiz}
                                                onComplete={() => handleQuizComplete(module.id)}
                                                isCompleted={isCompleted}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>
                    );
                })}
            </Accordion>
        );
    };

    return (
        <div className="space-y-6">
            {/* Enhanced Progress Hero Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                            {completedModules.size === allModules.length
                                                ? "🎉 Congratulations! You've mastered all modules!"
                                                : `${allModules.length - completedModules.size} modules remaining to complete your training`}
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                            {completedModules.size === allModules.length ? (
                                <div className="animate-in zoom-in spin-in-180 duration-500">
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-2 text-sm">
                                        <Trophy className="h-4 w-4 mr-2" />
                                        Expert Level
                                    </Badge>
                                </div>
                            ) : firstIncompleteModule && (
                                <Button
                                    onClick={() => {
                                        setOpenAccordion(firstIncompleteModule.id);
                                        // Switch to correct tab
                                        if (marketingModules.some(m => m.id === firstIncompleteModule.id)) {
                                            setActiveTab('marketing');
                                        } else if (closingModules.some(m => m.id === firstIncompleteModule.id)) {
                                            setActiveTab('closing');
                                        } else if (professionalExcellenceModules.some(m => m.id === firstIncompleteModule.id)) {
                                            setActiveTab('professional');
                                        }
                                    }}
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
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 hover:scale-[1.02] transition-transform duration-200">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Marketing</p>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {marketingModules.filter(m => completedModules.has(m.id)).length}/{marketingModules.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/50 dark:border-green-800/30 hover:scale-[1.02] transition-transform duration-200">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                    <Handshake className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Closing</p>
                                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                                        {closingModules.filter(m => completedModules.has(m.id)).length}/{closingModules.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 hover:scale-[1.02] transition-transform duration-200">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Professional</p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                        {professionalExcellenceModules.filter(m => completedModules.has(m.id)).length}/{professionalExcellenceModules.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Enhanced Learning Modules */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="marketing">
                            <span className="whitespace-nowrap">Marketing</span>
                        </TabsTrigger>
                        <TabsTrigger value="closing">
                            <span className="whitespace-nowrap">Closing</span>
                        </TabsTrigger>
                        <TabsTrigger value="professional">
                            <span className="whitespace-nowrap">Professional</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="marketing" className="mt-8">
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <Card>
                                <CardHeader className="space-y-6 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                            <TrendingUp className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="font-headline text-3xl text-blue-900 dark:text-blue-100">
                                                Marketing & SEO Mastery
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-base text-blue-700 dark:text-blue-300">
                                                Build your online presence and attract more clients through strategic marketing and search optimization.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-xl bg-gradient-to-r from-blue-100/50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-950/10 border border-blue-200/50 dark:border-blue-800/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Learning Progress
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {Math.round(marketingCompletionPercentage)}%
                                                </span>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                    {marketingModules.filter(m => completedModules.has(m.id)).length}/{marketingModules.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress value={marketingCompletionPercentage} className="h-3 bg-blue-200/50 dark:bg-blue-900/30" />
                                            <div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-blue-400/30 to-transparent transition-all duration-1000 ease-out"
                                                style={{ width: `${marketingCompletionPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Estimated time: {(marketingModules.length - marketingModules.filter(m => completedModules.has(m.id)).length) * 20} minutes remaining
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {renderModuleAccordion(marketingModules, 'blue')}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="closing" className="mt-8">
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card>
                                <CardHeader className="space-y-6 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                            <Handshake className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="font-headline text-3xl text-green-900 dark:text-green-100">
                                                Deal Closing Excellence
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-base text-green-700 dark:text-green-300">
                                                Master communication and closing techniques to convert more leads into clients and close more deals.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-xl bg-gradient-to-r from-green-100/50 to-green-50/30 dark:from-green-900/20 dark:to-green-950/10 border border-green-200/50 dark:border-green-800/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Learning Progress
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {Math.round(closingCompletionPercentage)}%
                                                </span>
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                                    {closingModules.filter(m => completedModules.has(m.id)).length}/{closingModules.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress value={closingCompletionPercentage} className="h-3 bg-green-200/50 dark:bg-green-900/30" />
                                            <div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400/30 to-transparent transition-all duration-1000 ease-out"
                                                style={{ width: `${closingCompletionPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Estimated time: {(closingModules.length - closingModules.filter(m => completedModules.has(m.id)).length) * 20} minutes remaining
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {renderModuleAccordion(closingModules, 'green')}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="professional" className="mt-8">
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card>
                                <CardHeader className="space-y-6 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <Award className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="font-headline text-3xl text-purple-900 dark:text-purple-100">
                                                Professional Excellence
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-base text-purple-700 dark:text-purple-300">
                                                Master market analysis, legal compliance, and professional standards to become the trusted expert in your market.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-xl bg-gradient-to-r from-purple-100/50 to-purple-50/30 dark:from-purple-900/20 dark:to-purple-950/10 border border-purple-200/50 dark:border-purple-800/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Learning Progress
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {Math.round(professionalCompletionPercentage)}%
                                                </span>
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                                    {professionalExcellenceModules.filter(m => completedModules.has(m.id)).length}/{professionalExcellenceModules.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress value={professionalCompletionPercentage} className="h-3 bg-purple-200/50 dark:bg-purple-900/30" />
                                            <div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-purple-400/30 to-transparent transition-all duration-1000 ease-out"
                                                style={{ width: `${professionalCompletionPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Estimated time: {(professionalExcellenceModules.length - professionalExcellenceModules.filter(m => completedModules.has(m.id)).length) * 20} minutes remaining
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {renderModuleAccordion(professionalExcellenceModules, 'purple')}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}