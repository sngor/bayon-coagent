'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StandardCard } from '@/components/standard/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGeminiLive } from '../hooks/use-gemini-live';
import { getGeminiApiKeyAction } from '@/app/actions';
import { Mic, MicOff, Volume2, Loader2, Lightbulb, Target, TrendingUp, Sparkles } from 'lucide-react';
import type { RolePlayScenario } from '@/lib/constants/training-data';

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
        audioLevel,
        outputAudioLevel,
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

    // Enhanced AI message parsing for technique detection
    const parseAIMessage = useCallback((message: any) => {
        console.log('🎯 Coaching Mode - Received message:', message);

        // Check multiple possible message formats
        let textContent = '';

        // Try different message structures
        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
            textContent = message.serverContent.modelTurn.parts[0].text;
        } else if (message.text) {
            textContent = message.text;
        } else if (message.content) {
            textContent = message.content;
        } else if (typeof message === 'string') {
            textContent = message;
        }

        if (!textContent) {
            console.log('⚠️ No text content found in message');
            return;
        }

        console.log('📝 Parsing text content:', textContent);

        // Look for technique markers with improved regex patterns
        const techniquePatterns = [
            /\[TECHNIQUE:\s*([^\]]+)\]/gi,
            /\[SKILL:\s*([^\]]+)\]/gi,
            /\[METHOD:\s*([^\]]+)\]/gi,
        ];

        const successPatterns = [
            /\[SUCCESS:\s*([^\]]+)\]/gi,
            /\[GOOD:\s*([^\]]+)\]/gi,
            /\[WELL DONE:\s*([^\]]+)\]/gi,
        ];

        const tipPatterns = [
            /\[TIP:\s*([^\]]+)\]/gi,
            /\[HINT:\s*([^\]]+)\]/gi,
            /\[SUGGESTION:\s*([^\]]+)\]/gi,
        ];

        // Check for techniques
        techniquePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(textContent)) !== null) {
                const techniqueName = match[1].trim();
                addCoachingTip('technique', `Great! You used: ${techniqueName}`);
                console.log('✅ Technique detected:', techniqueName);
            }
        });

        // Check for success markers
        successPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(textContent)) !== null) {
                const successMessage = match[1].trim();
                addCoachingTip('success', `✓ ${successMessage}`);
                console.log('🎉 Success detected:', successMessage);
            }
        });

        // Check for tips
        tipPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(textContent)) !== null) {
                const tipMessage = match[1].trim();
                addCoachingTip('warning', `💡 ${tipMessage}`);
                console.log('💡 Tip detected:', tipMessage);
            }
        });

        // Also look for common objection handling patterns in natural language
        const naturalPatterns = [
            { pattern: /feel.*felt.*found/i, technique: 'Feel, Felt, Found' },
            { pattern: /understand.*concern/i, technique: 'Acknowledge & Reframe' },
            { pattern: /what.*specifically.*concerns/i, technique: 'Clarifying Questions' },
            { pattern: /if.*could.*address.*would.*ready/i, technique: 'Trial Close' },
            { pattern: /data.*shows.*statistics/i, technique: 'Evidence-Based Response' },
        ];

        naturalPatterns.forEach(({ pattern, technique }) => {
            if (pattern.test(textContent)) {
                addCoachingTip('technique', `Detected: ${technique}`);
                console.log('🔍 Natural pattern detected:', technique);
            }
        });

    }, [addCoachingTip]);

    // Connect to Gemini Live with enhanced coaching instructions
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

**CRITICAL: ALWAYS INCLUDE FEEDBACK MARKERS**
After every response, you MUST include coaching feedback using these exact formats:

**TECHNIQUE DETECTION - When the agent uses these techniques, mark them:**
1. **Feel, Felt, Found**: "I understand how you feel... others have felt... what they found..." → [TECHNIQUE: Feel, Felt, Found]
2. **Acknowledge + Reframe**: Validating concern then showing different perspective → [TECHNIQUE: Acknowledge & Reframe]
3. **Clarifying Questions**: "What specifically concerns you about...?" → [TECHNIQUE: Clarifying Questions]
4. **Trial Close**: "If we could address that, would you be ready to move forward?" → [TECHNIQUE: Trial Close]
5. **Evidence-Based Response**: Using data, statistics, or examples → [TECHNIQUE: Evidence-Based Response]
6. **Active Listening**: Paraphrasing or summarizing → [TECHNIQUE: Active Listening]
7. **Empathy Statements**: Showing understanding of emotions → [TECHNIQUE: Empathy Statements]

**FEEDBACK MARKERS - Use these EXACT formats:**
- When technique used well: [TECHNIQUE: technique_name]
- When they handle objection well: [SUCCESS: brief_praise]
- When they need improvement: [TIP: brief_suggestion]

**EXAMPLES:**
- "That makes sense. I appreciate you taking the time to explain that. [TECHNIQUE: Active Listening]"
- "Okay, I can see how that data supports your recommendation. [TECHNIQUE: Evidence-Based Response]"
- "I like how you acknowledged my concern. Let me think about that. [SUCCESS: Great use of empathy]"
- "I'm still not sure I understand the value. [TIP: Try using specific examples]"

**CONVERSATION FLOW:**
1. Start with your main concern from the persona
2. Present 2-3 objections throughout the conversation
3. ALWAYS include feedback markers in your responses
4. Gradually warm up if agent handles objections well
5. Become more resistant if agent is pushy or dismissive
6. Give clear technique recognition when skills are demonstrated

Begin the conversation by introducing yourself and presenting your first concern or objection. Remember to include feedback markers in EVERY response.`;

            try {
                await connect(apiKey, {
                    model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
                    systemInstruction,
                    responseModalities: ['AUDIO'],
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
                    <div className="flex flex-col items-center gap-6 z-10">
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

                        {/* Audio-Responsive Waveform Below Mic Button */}
                        {(isRecording || isSpeaking) && (
                            <div className="flex items-end gap-2 h-16 justify-center">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    // Create different frequency responses for each bar
                                    const baseHeight = 8;
                                    const maxHeight = 50;

                                    // Use audio level for recording, outputAudioLevel for AI speaking
                                    const currentLevel = isRecording
                                        ? audioLevel || 0
                                        : isSpeaking
                                            ? outputAudioLevel || 0
                                            : 0;

                                    // Each bar responds differently to create realistic waveform
                                    const barMultiplier = 0.5 + Math.sin(i * 0.8) * 0.5;
                                    const height = baseHeight + (currentLevel * barMultiplier * maxHeight);

                                    return (
                                        <div
                                            key={i}
                                            className={`w-2 rounded-full transition-all duration-75 ${isRecording
                                                ? 'bg-red-400/70'
                                                : 'bg-blue-400/70'
                                                } ${currentLevel > 0.1 ? 'scale-y-110' : 'scale-y-100'}`}
                                            style={{
                                                height: `${Math.max(baseHeight, height)}px`,
                                                minHeight: '8px'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
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
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                {coachingTips.length} tips
                            </span>
                        </div>
                    }
                    className="h-full"
                >
                    <div className="h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-secondary">
                        {coachingTips.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-2 border-dashed rounded-xl">
                                <Lightbulb className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Start speaking to receive real-time coaching tips and feedback</p>
                                <p className="text-xs mt-2 opacity-60">The AI will analyze your objection handling techniques</p>
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
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs opacity-60">
                                            {new Date(tip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex-1">{tip.message}</span>
                                    </div>
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
                        <h4 className="font-semibold text-sm mb-3">Technique Reference</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                            <div className="p-2 rounded bg-background/50">Feel, Felt, Found</div>
                            <div className="p-2 rounded bg-background/50">Clarifying Questions</div>
                            <div className="p-2 rounded bg-background/50">Active Listening</div>
                            <div className="p-2 rounded bg-background/50">Trial Close</div>
                            <div className="p-2 rounded bg-background/50">Evidence-Based Response</div>
                            <div className="p-2 rounded bg-background/50">Acknowledge & Reframe</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}