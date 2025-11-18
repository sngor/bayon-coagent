
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { TrainingProgress } from '@/lib/types';
import { trainingModules } from '@/lib/training-data';
import { Quiz } from '@/components/quiz';

export default function TrainingHubPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(trainingModules[0].id);

    const trainingProgressRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/trainingProgress`);
    }, [user, firestore]);

    const { data: progressData } = useCollection<TrainingProgress>(trainingProgressRef);

    const completedModules = useMemo(() => {
        if (!progressData) return new Set<string>();
        return new Set(progressData.filter(p => p.completed).map(p => p.id));
    }, [progressData]);

    const completionPercentage = useMemo(() => {
        if (completedModules.size === 0) return 0;
        return (completedModules.size / trainingModules.length) * 100;
    }, [completedModules, trainingModules.length]);
    
    const handleQuizComplete = (moduleId: string) => {
        if (!user || !firestore) return;
        const progressDocRef = doc(firestore, `users/${user.uid}/trainingProgress/${moduleId}`);
        setDocumentNonBlocking(progressDocRef, {
            id: moduleId,
            completed: true,
            completedAt: new Date().toISOString()
        }, { merge: true });

        // Open the next available module
        const currentIndex = trainingModules.findIndex(m => m.id === moduleId);
        if (currentIndex < trainingModules.length - 1) {
            setOpenAccordion(trainingModules[currentIndex + 1].id);
        } else {
             setOpenAccordion(undefined); // Close all if it's the last one
        }
    };

    return (
        <div className="animate-fade-in-up space-y-8">
        <PageHeader
            title="Training Hub"
            description="Your guide to building a dominant online presence and mastering real estate SEO."
        />

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Your Progress</CardTitle>
                <CardDescription>Complete all modules to become a Co-agent Marketer expert.</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={completionPercentage} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{completedModules.size} of {trainingModules.length} modules completed.</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Agent-First Learning Modules</CardTitle>
                <CardDescription>Actionable strategies you can implement today to attract more clients and build your brand authority.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                    {trainingModules.map((module) => (
                        <AccordionItem value={module.id} key={module.id}>
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline text-left">
                                <div className="flex items-center gap-4">
                                     {completedModules.has(module.id) ? (
                                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                    )}
                                    <span>{module.title}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-secondary/30 rounded-b-lg">
                                <div className="prose max-w-none text-foreground/80 dark:prose-invert" dangerouslySetInnerHTML={{ __html: module.content }} />
                                
                                <Quiz
                                    moduleId={module.id}
                                    questions={module.quiz}
                                    onComplete={() => handleQuizComplete(module.id)}
                                    isCompleted={completedModules.has(module.id)}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
        </div>
    );
}
