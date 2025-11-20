'use client';

import { useState, useMemo } from 'react';
import { StandardPageLayout } from '@/components/standard';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Handshake, Award, BookOpen, Clock, Target } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import type { TrainingProgress } from '@/lib/types';
import { saveTrainingProgressAction } from '@/app/actions';
import { marketingModules, closingModules } from '@/lib/training-data';
import { Quiz } from '@/components/quiz';

export default function TrainingLessonsPage() {
    const { user } = useUser();
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(marketingModules[0].id);
    const allModules = [...marketingModules, ...closingModules];

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

    const handleQuizComplete = async (moduleId: string) => {
        if (!user) return;
        try {
            await saveTrainingProgressAction(moduleId, true);
        } catch (error) {
            console.error('Failed to save training progress:', error);
        }

        // Open the next available module
        const currentIndex = allModules.findIndex(m => m.id === moduleId);
        if (currentIndex < allModules.length - 1) {
            setOpenAccordion(allModules[currentIndex + 1].id);
        } else {
            setOpenAccordion(undefined);
        }
    };

    const renderModuleAccordion = (modules: typeof marketingModules) => (
        <Accordion type="single" collapsible className="w-full space-y-3" value={openAccordion} onValueChange={setOpenAccordion}>
            {modules.map((module, index) => {
                const isCompleted = completedModules.has(module.id);
                const isActive = openAccordion === module.id;

                return (
                    <AccordionItem
                        value={module.id}
                        key={module.id}
                        className={`border-b-0 border rounded-lg transition-all duration-200 ${isActive ? 'shadow-md border-primary/50' : 'border-border hover:border-primary/30'
                            } ${isCompleted ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}
                    >
                        <AccordionTrigger className="px-4 py-4 hover:no-underline text-left group">
                            <div className="flex items-center gap-4 w-full">
                                <div className="relative flex-shrink-0">
                                    {isCompleted ? (
                                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-full border-2 border-muted-foreground flex items-center justify-center group-hover:border-primary transition-colors">
                                            <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary">
                                                {index + 1}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base md:text-lg font-semibold">{module.title}</h3>
                                        {isCompleted && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                <Award className="h-3 w-3 mr-1" />
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            15-20 min
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Target className="h-3 w-3" />
                                            {module.quiz.length} quiz questions
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <div className="pt-4">
                                <div className="prose prose-sm md:prose-base max-w-none text-foreground/80 dark:prose-invert prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground"
                                    dangerouslySetInnerHTML={{ __html: module.content }}
                                />

                                <div className="mt-6">
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
                );
            })}
        </Accordion>
    );

    return (
        <StandardPageLayout
            spacing="default"
        >
            {/* Overall Progress Card */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Your Learning Journey
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {completedModules.size === allModules.length
                                    ? "🎉 Congratulations! You've completed all modules!"
                                    : `${allModules.length - completedModules.size} modules remaining`}
                            </CardDescription>
                        </div>
                        {completedModules.size === allModules.length && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                <Award className="h-4 w-4 mr-1" />
                                Expert
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm font-bold text-primary">{Math.round(completionPercentage)}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Marketing</p>
                                <p className="text-lg font-bold">{marketingModules.filter(m => completedModules.has(m.id)).length}/{marketingModules.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Handshake className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Closing</p>
                                <p className="text-lg font-bold">{closingModules.filter(m => completedModules.has(m.id)).length}/{closingModules.length}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Learning Modules */}
            <Tabs defaultValue="marketing" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                    <TabsTrigger value="marketing" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Marketing & SEO</span>
                        <span className="sm:hidden">Marketing</span>
                    </TabsTrigger>
                    <TabsTrigger value="closing" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Handshake className="h-4 w-4" />
                        <span className="hidden sm:inline">Closing Deals</span>
                        <span className="sm:hidden">Closing</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marketing" className="mt-6">
                    <Card>
                        <CardHeader className="space-y-4">
                            <div>
                                <CardTitle className="font-headline text-2xl">Marketing & SEO Mastery</CardTitle>
                                <CardDescription className="mt-2">
                                    Build your online presence and attract more clients through strategic marketing.
                                </CardDescription>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Track Progress</span>
                                    <span className="text-sm font-bold text-primary">{Math.round(marketingCompletionPercentage)}%</span>
                                </div>
                                <Progress value={marketingCompletionPercentage} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                    {marketingModules.filter(m => completedModules.has(m.id)).length} of {marketingModules.length} modules completed
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderModuleAccordion(marketingModules)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="closing" className="mt-6">
                    <Card>
                        <CardHeader className="space-y-4">
                            <div>
                                <CardTitle className="font-headline text-2xl">Deal Closing Excellence</CardTitle>
                                <CardDescription className="mt-2">
                                    Master communication and closing techniques to convert more leads into clients.
                                </CardDescription>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Track Progress</span>
                                    <span className="text-sm font-bold text-primary">{Math.round(closingCompletionPercentage)}%</span>
                                </div>
                                <Progress value={closingCompletionPercentage} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                    {closingModules.filter(m => completedModules.has(m.id)).length} of {closingModules.length} modules completed
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderModuleAccordion(closingModules)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </StandardPageLayout>
    );
}
