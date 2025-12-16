'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScenarioCard } from '@/components/role-play/scenario-card';
import { ScenarioDetailDialog } from '@/components/role-play/scenario-detail-dialog';
import { VoiceRolePlay } from '@/components/voice-role-play';
import { CoachingMode } from '@/components/coaching-mode';
import { rolePlayScenarios } from '@/lib/constants/learning-data';
import type { RolePlayScenario } from '@/lib/constants/learning-data';
import {
    Mic,
    Lightbulb,
    Filter,
    Search,
    BookOpen,
    Target,
    Sparkles,
    ChevronUp,
    ChevronDown,
    MessageSquare,
    Clock
} from 'lucide-react';
import { StandardCard } from '@/components/standard';
import { Calendar } from '@/components/ui/calendar';
import { getRolePlaySessionsAction } from '@/app/actions';

type PracticeMode = 'voice' | 'coaching';

export default function RolePlayPage() {
    // TODO: Consider extracting scenario filtering logic to a custom hook
    // TODO: Add error boundary for voice/coaching mode failures
    // TODO: Implement session persistence for interrupted practice sessions
    const [selectedMode, setSelectedMode] = useState<PracticeMode>('voice');
    const [selectedScenario, setSelectedScenario] = useState<RolePlayScenario | null>(null);
    const [showScenarioDetail, setShowScenarioDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showPastSessions, setShowPastSessions] = useState(false);
    const [showPracticeTips, setShowPracticeTips] = useState(false);
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

    // Filter scenarios based on search and difficulty (memoized for performance)
    const filteredScenarios = useMemo(() => {
        return rolePlayScenarios.filter(scenario => {
            const matchesSearch = searchTerm === '' ||
                scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scenario.persona.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDifficulty = difficultyFilter === 'all' || scenario.difficulty === difficultyFilter;
            return matchesSearch && matchesDifficulty;
        });
    }, [searchTerm, difficultyFilter]);

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

    const handleScenarioSelect = useCallback((scenario: RolePlayScenario) => {
        setSelectedScenario(scenario);
        setShowScenarioDetail(true);
    }, []);

    const handleStartSession = useCallback((scenario: RolePlayScenario) => {
        setSelectedScenario(scenario);
        setIsSessionActive(true);
        setShowScenarioDetail(false);
    }, []);

    const handleEndSession = useCallback(() => {
        setIsSessionActive(false);
        setSelectedScenario(null);
    }, []);

    // Render active session based on mode
    if (isSessionActive && selectedScenario) {
        switch (selectedMode) {
            case 'voice':
                return (
                    <VoiceRolePlay
                        scenario={selectedScenario}
                        onEnd={handleEndSession}
                    />
                );
            case 'coaching':
                return (
                    <CoachingMode
                        scenario={selectedScenario}
                        onEnd={handleEndSession}
                    />
                );
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Target className="h-4 w-4 text-white" />
                        </div>
                        Role-Play Practice
                    </CardTitle>
                    <CardDescription>
                        Practice real-world scenarios with AI-powered clients using voice conversations and coaching feedback. Choose from voice practice or coaching mode with real-time technique recognition.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Setup Info Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Mic className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Voice Practice Setup</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Voice features require microphone access. When you start a session, you'll be prompted to allow microphone permissions.
                                If you encounter any issues, the system will provide step-by-step troubleshooting guidance.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                                <span className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    Real-time voice conversations
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                    Technique recognition
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    Live coaching feedback
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Practice Mode Selection */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Voice Mode */}
                        <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedMode === 'voice'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`} onClick={() => setSelectedMode('voice')}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <Mic className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Voice Practice</h3>
                                    <Badge variant="secondary" className="text-xs">Realistic</Badge>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Have real-time voice conversations with AI clients. Experience natural dialogue and improve your speaking skills.
                            </p>
                        </div>

                        {/* Coaching Mode */}
                        <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedMode === 'coaching'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`} onClick={() => setSelectedMode('coaching')}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Coaching Mode</h3>
                                    <Badge variant="secondary" className="text-xs">Advanced</Badge>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Voice practice with real-time coaching feedback. Get technique recognition and improvement tips as you practice.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search scenarios by title, description, or client name..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Scenario Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredScenarios.map((scenario) => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        onClick={handleScenarioSelect}
                    />
                ))}
            </div>

            {/* No Results */}
            {filteredScenarios.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No scenarios found</h3>
                            <p className="text-muted-foreground mb-4">
                                Try adjusting your search terms or filters to find scenarios.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setDifficultyFilter('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            className="w-full flex items-center justify-center gap-2"
                        >
                            {showPastSessions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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

            {/* Practice Tips */}
            <StandardCard
                title={<span className="font-headline">Practice Tips</span>}
                description="Get the most out of your role-play sessions"
            >
                <div className="space-y-4">
                    <Button
                        onClick={() => setShowPracticeTips(!showPracticeTips)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        {showPracticeTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showPracticeTips ? 'Hide' : 'Show'} Practice Tips
                    </Button>

                    {showPracticeTips && (
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
                    )}
                </div>
            </StandardCard>

            {/* Enhanced Scenario Detail Dialog */}
            <ScenarioDetailDialog
                scenario={selectedScenario}
                open={showScenarioDetail}
                onOpenChange={setShowScenarioDetail}
                onStartSession={handleStartSession}
                selectedMode={selectedMode}
            />
        </div>
    );
}