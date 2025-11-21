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
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Handshake, Award, BookOpen, Clock, Target, Star, Trophy, Zap, Play, ChevronRight, Sparkles } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import type { TrainingProgress } from '@/lib/types';
import { saveTrainingProgressAction } from '@/app/actions';
import { marketingModules, closingModules, professionalExcellenceModules, allModules } from '@/lib/training-data';
import { Quiz } from '@/components/quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TrainingLessonsPage() {
    const { user } = useUser();
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);
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

    const renderModuleAccordion = (modules: typeof marketingModules, colorTheme: 'blue' | 'green' = 'blue') => {
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
            }
        };

        const theme = themeColors[colorTheme];

        return (
            <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordion} onValueChange={setOpenAccordion}>
                {modules.map((module, index) => {
                    const isCompleted = completedModules.has(module.id);
                    const isActive = openAccordion === module.id;

                    return (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
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
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg"
                                                >
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </motion.div>
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
                                                <motion.div
                                                    className="absolute -inset-1 rounded-full border-2 border-primary/30"
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-base md:text-lg font-semibold text-foreground">
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
                                        <ChevronRight className={cn(
                                            'h-5 w-5 transition-transform duration-200',
                                            isActive ? 'rotate-90' : '',
                                            theme.accent
                                        )} />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="pt-4 space-y-6"
                                    >
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
                                    </motion.div>
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    );
                })}
            </Accordion>
        );
    };

    return (
        <div className="space-y-6">
            {/* Enhanced Progress Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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
                            <AnimatePresence>
                                {completedModules.size === allModules.length && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", duration: 0.6 }}
                                    >
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-2 text-sm">
                                            <Trophy className="h-4 w-4 mr-2" />
                                            Expert Level
                                        </Badge>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                                <motion.div
                                    className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-primary/20 to-transparent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercentage}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30"
                            >
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Marketing</p>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {marketingModules.filter(m => completedModules.has(m.id)).length}/{marketingModules.length}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/50 dark:border-green-800/30"
                            >
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                    <Handshake className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Closing</p>
                                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                                        {closingModules.filter(m => completedModules.has(m.id)).length}/{closingModules.length}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30"
                            >
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Professional</p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                        {professionalExcellenceModules.filter(m => completedModules.has(m.id)).length}/{professionalExcellenceModules.length}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Enhanced Learning Modules */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Tabs defaultValue="marketing" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
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
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="border-2 border-blue-200/50 dark:border-blue-800/30">
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
                                            <motion.div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-blue-400/30 to-transparent"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${marketingCompletionPercentage}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
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
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="closing" className="mt-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="border-2 border-green-200/50 dark:border-green-800/30">
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
                                            <motion.div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400/30 to-transparent"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${closingCompletionPercentage}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
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
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="professional" className="mt-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="border-2 border-purple-200/50 dark:border-purple-800/30">
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
                                            <motion.div
                                                className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-purple-400/30 to-transparent"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${professionalCompletionPercentage}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                            />
                                        </div>
                                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Estimated time: {(professionalExcellenceModules.length - professionalExcellenceModules.filter(m => completedModules.has(m.id)).length) * 20} minutes remaining
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {renderModuleAccordion(professionalExcellenceModules, 'green')}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                </Tabs>
            </motion.div>
        </div>
    );
}