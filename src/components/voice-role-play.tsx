'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardCard } from '@/components/standard/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGeminiLive } from '@/hooks/use-gemini-live';
import { getGeminiApiKeyAction } from '@/app/actions';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, User, Pause, Play, Lightbulb } from 'lucide-react';
import type { RolePlayScenario } from '@/lib/constants/training-data';
import { Modality } from '@google/genai';

export interface VoiceRolePlayProps {
    scenario: RolePlayScenario;
    onEnd: () => void;
}

// Helper function to select appropriate voice based on gender
function getVoiceForGender(gender: 'male' | 'female'): string {
    // Female voices: Aoede, Kore
    // Male voices: Puck, Charon, Fenrir
    return gender === 'female' ? 'Aoede' : 'Puck';
}

export function VoiceRolePlay({ scenario, onEnd }: VoiceRolePlayProps) {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const { toast } = useToast();

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

    const router = useRouter();

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
                    description: 'Failed to initialize voice mode',
                    variant: 'destructive',
                });
            } finally {
                setIsInitializing(false);
            }
        };

        fetchApiKey();
    }, [toast, router]);

    // Connect to Gemini Live when API key is available
    useEffect(() => {
        if (!apiKey || isConnected) return;

        const initializeConnection = async () => {
            const systemInstruction = `You are roleplaying as ${scenario.persona.name}, a real estate client. 

Background: ${scenario.persona.background}
Personality: ${scenario.persona.personality}
Goals: ${scenario.persona.goals.join(', ')}
Concerns: ${scenario.persona.concerns.join(', ')}
Communication Style: ${scenario.persona.communicationStyle}

Stay in character throughout the conversation. Respond naturally as this persona would, with appropriate emotions and reactions. The agent you're speaking with is practicing their real estate skills, so be realistic but also provide opportunities for them to demonstrate their expertise.

Start the conversation by greeting the agent and briefly mentioning your situation.`;

            try {
                await connect(apiKey, {
                    model: 'gemini-2.0-flash-exp',
                    systemInstruction,
                    responseModalities: [Modality.AUDIO],
                    voiceName: getVoiceForGender(scenario.persona.gender),
                });

                toast({
                    title: 'Voice Mode Ready',
                    description: `You're now speaking with ${scenario.persona.name}`,
                });
            } catch (err) {
                console.error('Failed to connect:', err);
                toast({
                    title: 'Connection Failed',
                    description: 'Failed to connect to voice service',
                    variant: 'destructive',
                });
            }
        };

        initializeConnection();
    }, [apiKey, isConnected, connect, scenario, toast]);

    // Show error toast when errors occur
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

    if (isInitializing) {
        return (
            <StandardCard
                title={<span className="font-headline">Initializing Voice Mode...</span>}
                description="Setting up your voice practice session"
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
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                                <Mic className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-headline text-xl font-bold">
                                    Voice Practice
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
                {/* Status Bar */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Connection Status */}
                    <div className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 ${isConnected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3">
                                {isConnected && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                                <p className="text-sm font-bold">
                                    {isConnected ? 'Live Connection' : 'Disconnected'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Status */}
                    <div className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 ${isSpeaking
                        ? 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {isSpeaking ? (
                                    <Volume2 className="h-5 w-5 text-blue-500 animate-pulse" />
                                ) : (
                                    <VolumeX className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Coach</p>
                                <p className="text-sm font-bold">
                                    {isSpeaking ? 'Speaking...' : 'Listening'}
                                </p>
                            </div>
                        </div>
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

                    {/* Status Text */}
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
                                : isSpeaking
                                    ? 'Please wait while the AI responds.'
                                    : 'Tap the microphone button to begin speaking.'}
                        </p>
                    </div>
                </div>
            </StandardCard>

            {/* Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Persona Info */}
                <StandardCard
                    title={
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <span className="font-headline">About {scenario.persona.name}</span>
                        </div>
                    }
                    className="h-full"
                >
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/20">
                            <p className="text-sm leading-relaxed italic">
                                "{scenario.persona.background}"
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Personality</p>
                                <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                                    {scenario.persona.personality}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Style</p>
                                <div className="p-2 rounded bg-purple-50/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium">
                                    {scenario.persona.communicationStyle}
                                </div>
                            </div>
                        </div>
                    </div>
                </StandardCard>

                {/* Objectives & Tips */}
                <div className="space-y-6">
                    <StandardCard
                        title={
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <span className="font-headline">Objectives</span>
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

                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Pro Tip</h4>
                                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                    Speak at a natural pace. You can interrupt the AI if needed, but it's best to let it finish its thought for a smoother conversation flow.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
