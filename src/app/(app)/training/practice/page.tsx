'use client';

import { AIRolePlay } from '@/components/ai-role-play';
import { useState, useEffect } from 'react';
import { StandardCard } from '@/components/standard/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRolePlaySessionsAction } from '@/app/actions';
import { rolePlayScenarios } from '@/lib/training-data';
import { Clock, MessageSquare, Calendar } from 'lucide-react';

export default function PracticePage() {
    const [showPastSessions, setShowPastSessions] = useState(false);
    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch past sessions when showing them
    useEffect(() => {
        if (showPastSessions && pastSessions.length === 0) {
            const fetchSessions = async () => {
                setIsLoading(true);
                try {
                    const result = await getRolePlaySessionsAction();
                    setPastSessions(result.data || []);
                } catch (error) {
                    console.error('Failed to fetch sessions:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSessions();
        }
    }, [showPastSessions, pastSessions.length]);

    const completedSessions = pastSessions.filter((s: any) => s.completedAt);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Main Role-Play Component */}
            <AIRolePlay />

            {/* Past Sessions Section */}
            {completedSessions.length > 0 && (
                <StandardCard
                    title={<span className="font-headline">Past Practice Sessions</span>}
                    description="Review your previous role-play sessions and feedback"
                >
                    <div className="space-y-4">
                        <Button
                            onClick={() => setShowPastSessions(!showPastSessions)}
                            variant="outline"
                            className="w-full"
                        >
                            {showPastSessions ? 'Hide' : 'Show'} Past Sessions ({completedSessions.length})
                        </Button>

                        {showPastSessions && (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4 pr-4">
                                    {completedSessions.map((session: any) => {
                                        const scenario = rolePlayScenarios.find(
                                            (s) => s.id === session.scenarioId
                                        );

                                        return (
                                            <div
                                                key={session.id}
                                                className="p-4 border rounded-lg space-y-3 bg-secondary/20"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-headline font-semibold">
                                                            {scenario?.title || 'Unknown Scenario'}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {scenario?.persona.name}
                                                        </p>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(session.completedAt)}
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {session.messages?.length || 0} messages
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDuration(session.duration || 0)}
                                                    </div>
                                                </div>

                                                {session.feedback && (
                                                    <details className="text-sm">
                                                        <summary className="cursor-pointer font-medium text-primary hover:underline">
                                                            View Feedback
                                                        </summary>
                                                        <div className="mt-2 p-3 bg-background rounded border whitespace-pre-wrap">
                                                            {session.feedback}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </StandardCard>
            )}

            {/* Learning Tips */}
            <StandardCard
                title={<span className="font-headline">Practice Tips</span>}
                description="Get the most out of your role-play sessions"
            >
                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">1</span>
                        </div>
                        <div>
                            <strong>Start with beginner scenarios</strong> to build confidence before
                            tackling advanced situations.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">2</span>
                        </div>
                        <div>
                            <strong>Practice active listening</strong> by acknowledging the client's
                            concerns before responding.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">3</span>
                        </div>
                        <div>
                            <strong>Review your feedback</strong> after each session to identify patterns
                            and areas for improvement.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">4</span>
                        </div>
                        <div>
                            <strong>Repeat challenging scenarios</strong> multiple times to master
                            difficult situations.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">5</span>
                        </div>
                        <div>
                            <strong>Apply what you learn</strong> by using techniques from the training
                            lessons in your practice sessions.
                        </div>
                    </div>
                </div>
            </StandardCard>
        </div>
    );
}
