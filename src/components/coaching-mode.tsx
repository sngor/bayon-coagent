'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StandardCard } from '@/components/standard/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGeminiLive } from '@/hooks/use-gemini-live';
import { getGeminiApiKeyAction } from '@/app/actions';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Lightbulb, Target, TrendingUp, Pause, Play, Sparkles } from 'lucide-react';
import type { RolePlayScenario } from '@/lib/constants/training-data';
import { Modality } from '@google/genai';

export interface CoachingModeProps {
    scenario: RolePlayScenario;
    onEnd: () => void;
}

interface CoachingTip {
    type: 'technique' | 'warning' | 'success';
    message: string;
    timestamp: number;
}

// Helper function to select appropriate voice based on gender
function getVoiceForGender(gender: 'male' | 'female'): string {
    // Female voices: Aoede, Kore
    // Male voices: Puck, Charon, Fenrir
    return gender === 'female' ? 'Aoede' : 'Puck';
}

export function CoachingMode({ scenario, onEnd }: CoachingModeProps) {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
    const [sessionMetrics, setSessionMetrics] = useState({
        objections: 0,
        techniques: 0,
        duration: 0,
    });
    const { toast } = useToast();

    const router = useRouter();

    const {
        isConnected,
        isRecording,
        isSpeaking,
        error,
        connect,
        disconnect,
        startRecording,
        stopRecording,
    } = useGeminiLive();

    // Get API key on mount
    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const result = await getGeminiApiKeyAction();
                if (result.errors) {
                    const errorMessage = result.errors.join(', ');
                    if (errorMessage.includes('Access Token has expired')) {
                        toast({
                            title: 'Session Expired',
                            description: 'Please sign in again to continue.',
                            variant: 'destructive',
                        });
                        setTimeout(() => router.push('/login'), 2000);
                        return;
                    }

                    toast({
                        title: 'Configuration Error',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                    return;
                }
                if (result.data?.apiKey) {
                    setApiKey(result.data.apiKey);
                }
            } catch (err) {
                console.error('Failed to get API key:', err);
                toast({
                    title: 'Error',
                    description: 'Failed to initialize coaching mode',
                    variant: 'destructive',
                });
            } finally {
                setIsInitializing(false);
            }
        };

        fetchApiKey();
    }, [toast, router]);

    // Add coaching tips based on conversation
    const addCoachingTip = useCallback((type: CoachingTip['type'], message: string) => {
        setCoachingTips(prev => [...prev, {
            type,
            message,
            timestamp: Date.now(),
        }]);

        // Update metrics
        if (type === 'technique') {
            setSessionMetrics(prev => ({ ...prev, techniques: prev.techniques + 1 }));
        }
    }, []);

    // Parse AI messages for technique markers
    const parseAIMessage = useCallback((message: any) => {
        // Check if message contains text (serverContent or text field)
        const textContent = message.serverContent?.modelTurn?.parts?.[0]?.text ||
            message.text ||
            '';

        if (!textContent) return;

        console.log('Parsing message for techniques:', textContent);

        // Look for technique markers
        const techniqueMatch = textContent.match(/\[TECHNIQUE:\s*([^\]]+)\]/i);
        if (techniqueMatch) {
            const techniqueName = techniqueMatch[1].trim();
            addCoachingTip('technique', `Great! You used: ${techniqueName}`);
            console.log('Technique detected:', techniqueName);
        }

        // Look for success markers
        const successMatch = textContent.match(/\[SUCCESS:\s*([^\]]+)\]/i);
        if (successMatch) {
            const successMessage = successMatch[1].trim();
            addCoachingTip('success', `✓ ${successMessage}`);
            console.log('Success detected:', successMessage);
        }

        // Look for tip markers
        const tipMatch = textContent.match(/\[TIP:\s*([^\]]+)\]/i);
        if (tipMatch) {
            const tipMessage = tipMatch[1].trim();
            addCoachingTip('warning', `💡 ${tipMessage}`);
            console.log('Tip detected:', tipMessage);
        }
    }, [addCoachingTip]);

    // Connect to Gemini Live with coaching instructions
    useEffect(() => {
        if (!apiKey || isConnected) return;

        const initializeConnection = async () => {
            const systemInstruction = `You are a dual-role AI coach for real estate training:

**PRIMARY ROLE - Client Persona (${scenario.persona.name}):**
${scenario.persona.background}
Personality: ${scenario.persona.personality}
Goals: ${scenario.persona.goals.join(', ')}
Concerns: ${scenario.persona.concerns.join(', ')}
Communication Style: ${scenario.persona.communicationStyle}

**SECONDARY ROLE - Real-Time Coach:**
While staying in character as ${scenario.persona.name}, you will also provide REAL-TIME COACHING FEEDBACK. This is COACHING MODE.

**COACHING GUIDELINES:**
1. **Stay in Character**: Respond as ${scenario.persona.name} would naturally respond
2. **Present Objections**: Bring up concerns from the persona's list naturally in conversation
3. **Escalate Appropriately**: If the agent handles an objection well, move to the next concern. If they struggle, give them a chance to recover
4. **Provide Subtle Hints**: If the agent is struggling, give small verbal cues like "I'm not sure I understand..." or "Can you explain that differently?"
5. **Acknowledge Good Techniques**: When the agent uses effective techniques, respond positively as the client would
6. **Give Explicit Feedback**: After responding in character, briefly note when techniques are used

**TECHNIQUE DETECTION - Identify these objection handling techniques:**
1. **Feel, Felt, Found**: "I understand how you feel... others have felt... what they found..."
2. **Acknowledge + Reframe**: Validating concern then showing different perspective
3. **Clarifying Questions**: "What specifically concerns you about...?" or "Can you help me understand..."
4. **Trial Close**: "If we could address that, would you be ready to move forward?"
5. **Evidence-Based Response**: Using data, statistics, or examples to support points
6. **Active Listening**: Paraphrasing or summarizing what the client said
7. **Empathy Statements**: Showing understanding of emotions and concerns

**FEEDBACK FORMAT:**
When the agent uses a technique effectively, include a brief note in your response:
- Start your in-character response normally
- If a technique was used well, add at the end: "[TECHNIQUE: technique_name]"
- If they handled an objection well: "[SUCCESS: brief_praise]"
- If they need improvement: "[TIP: brief_suggestion]"

Examples:
- "That makes sense. I appreciate you taking the time to explain that. [TECHNIQUE: Active Listening]"
- "Okay, I can see how that data supports your recommendation. [TECHNIQUE: Evidence-Based Response]"
- "I like how you acknowledged my concern. Let me think about that. [SUCCESS: Great use of empathy]"
- "I'm still not sure I understand the value. [TIP: Try using specific examples]"

**CONVERSATION FLOW:**
1. Start with your main concern from the persona
2. Present 2-3 objections throughout the conversation
3. Gradually warm up if agent handles objections well
4. Become more resistant if agent is pushy or dismissive
5. Provide natural opportunities for the agent to demonstrate skills
6. Give feedback markers when techniques are used

Begin the conversation by introducing yourself and presenting your first concern or objection.`;

            try {
                await connect(apiKey, {
                    model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
                    systemInstruction,
                    responseModalities: [Modality.AUDIO],
                    voiceName: getVoiceForGender(scenario.persona.gender),
                    onMessage: parseAIMessage,
                });

                toast({
                    title: 'Coaching Mode Active',
                    description: `Practice objection handling with ${scenario.persona.name}`,
                });

                // Start session timer
                const startTime = Date.now();
                const timer = setInterval(() => {
                    setSessionMetrics(prev => ({
                        ...prev,
                        duration: Math.floor((Date.now() - startTime) / 1000),
                    }));
                }, 1000);

                return () => clearInterval(timer);
            } catch (err) {
                console.error('Failed to connect:', err);
                toast({
                    title: 'Connection Failed',
                    description: 'Failed to connect to coaching service',
                    variant: 'destructive',
                });
            }
        };

        initializeConnection();
    }, [apiKey, isConnected, connect, scenario, toast, parseAIMessage]);


    useEffect(() => {
        if (error) {
            toast({
                title: 'Voice Error',
                description: error,
                variant: 'destructive',
            });
        }
    }, [error, toast]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const handleToggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    };

    const handleEndSession = () => {
        disconnect();
        onEnd();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isInitializing) {
        return (
            <StandardCard
                title={<span className="font-headline">Initializing Coaching Mode...</span>}
                description="Setting up your personalized coaching session"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </StandardCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <StandardCard
                title={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                                <Lightbulb className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-headline text-xl font-bold">
                                    Coaching Mode
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {scenario.title}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleEndSession}
                            variant="outline"
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                        >
                            End Session
                        </Button>
                    </div>
                }
            >
                {/* Session Metrics Bar */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Duration</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatTime(sessionMetrics.duration)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Techniques</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{sessionMetrics.techniques}</p>
                    </div>

                    <div className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 ${isConnected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                        </div>
                        <p className="text-sm font-bold">
                            {isConnected ? 'Live Coaching' : 'Disconnected'}
                        </p>
                    </div>
                </div>

                {/* Main Interaction Area */}
                <div className="relative min-h-[400px] flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-secondary/20 to-secondary/5 border border-secondary/20 p-8">
                    {/* Microphone Button Area */}
                    <div className="flex flex-col items-center gap-8 z-10">
                        <div className="relative group">
                            {/* Glow Effect */}
                            {isRecording && (
                                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl transition-all duration-500" />
                            )}

                            {/* Main Mic Button */}
                            <Button
                                onClick={handleToggleRecording}
                                disabled={!isConnected || isSpeaking}
                                className={`h-48 w-48 rounded-full shadow-xl transition-all duration-300 flex flex-col gap-2 ${isRecording
                                    ? 'bg-red-500 hover:bg-red-600 scale-105'
                                    : 'bg-white dark:bg-gray-900 text-primary border-4 border-primary/10 hover:border-primary/30 hover:scale-105'
                                    } disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="h-16 w-16 text-white" />
                                        <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Mute</span>
                                    </>
                                ) : (
                                    <>
                                        <Mic className="h-16 w-16 text-primary" />
                                        <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">Speak</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-12 text-center space-y-2 z-10">
                        <h3 className="text-2xl font-bold font-headline">
                            {isRecording
                                ? <span className="text-red-500 animate-pulse">Listening to you...</span>
                                : isSpeaking
                                    ? <span className="text-blue-500">{scenario.persona.name} is speaking...</span>
                                    : <span className="text-muted-foreground">Mic Muted - Tap to Speak</span>}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            {isRecording
                                ? 'Speak naturally. Tap Mute when you are finished.'
                                : isSpeaking && (
                                    <span className="flex items-center justify-center gap-2">
                                        <Volume2 className="h-4 w-4 animate-pulse" />
                                        Listen carefully to the coach
                                    </span>
                                )}
                        </p>
                    </div>
                </div>
            </StandardCard>

            {/* Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coaching Tips Panel */}
                <StandardCard
                    title={
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <span className="font-headline">Real-time Feedback</span>
                        </div>
                    }
                    className="h-full"
                >
                    <div className="h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-secondary">
                        {coachingTips.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-2 border-dashed rounded-xl">
                                <Lightbulb className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Start speaking to receive real-time coaching tips and feedback</p>
                            </div>
                        ) : (
                            coachingTips.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border text-sm animate-in slide-in-from-bottom-2 fade-in duration-300 ${tip.type === 'success'
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                                        : tip.type === 'warning'
                                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                                        }`}
                                >
                                    {tip.message}
                                </div>
                            ))
                        )}
                    </div>
                </StandardCard>

                {/* Objectives & Reference */}
                <div className="space-y-6">
                    <StandardCard
                        title={
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                <span className="font-headline">Learning Objectives</span>
                            </div>
                        }
                    >
                        <ul className="space-y-2">
                            {scenario.learningObjectives.map((obj, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <span className="text-muted-foreground">{obj}</span>
                                </li>
                            ))}
                        </ul>
                    </StandardCard>

                    <div className="p-4 rounded-xl bg-secondary/30 border border-secondary">
                        <h4 className="font-semibold text-sm mb-3">Quick Reference</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="p-2 rounded bg-background/50">Feel, Felt, Found</div>
                            <div className="p-2 rounded bg-background/50">Clarifying Questions</div>
                            <div className="p-2 rounded bg-background/50">Active Listening</div>
                            <div className="p-2 rounded bg-background/50">Trial Close</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
