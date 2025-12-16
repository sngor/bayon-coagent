'use client';

import { useState, useCallback } from 'react';
import { useGeminiLive, type GeminiLiveConfig } from '@/hooks/use-gemini-live';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface RolePlayScenario {
    id: string;
    title: string;
    description: string;
    persona: string;
    situation: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: 'objection-handling' | 'negotiation' | 'consultation';
}

interface RolePlaySessionProps {
    scenario: RolePlayScenario;
    apiKey: string;
    onSessionEnd?: (duration: number) => void;
}

export function RolePlaySession({ scenario, apiKey, onSessionEnd }: RolePlaySessionProps) {
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);

    // Create role-play specific configuration
    const createRolePlayConfig = useCallback((): GeminiLiveConfig => {
        const systemInstruction = `You are an AI role-play partner for real estate training. 

SCENARIO: ${scenario.title}
PERSONA: You are playing the role of ${scenario.persona}
SITUATION: ${scenario.situation}

INSTRUCTIONS:
- Stay in character throughout the conversation
- Present realistic challenges appropriate for ${scenario.difficulty} level
- Respond naturally as the persona would in this situation
- Keep responses conversational and realistic (30-60 seconds max)
- Challenge the agent appropriately but fairly
- End the session naturally when the scenario reaches a conclusion

Remember: This is a training exercise to help real estate agents improve their skills.`;

        const autoStartMessage = `Hello! I'm ${scenario.persona}. ${scenario.situation} Let me start by explaining my situation...`;

        return {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            systemInstruction,
            responseModalities: ['AUDIO'],
            voiceName: 'Puck', // Use appropriate voice for the persona
            autoStartMessage,
            autoStartDelay: 2000, // 2 second delay to let user get ready
            onMessage: (message) => {
                // Handle any specific message processing if needed
                console.log('Role-play message:', message);
            }
        };
    }, [scenario]);

    const {
        isConnected,
        isRecording,
        isSpeaking,
        connectionState,
        error,
        audioLevel,
        outputAudioLevel,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        triggerAutoStart
    } = useGeminiLive();

    const handleStartSession = async () => {
        try {
            const config = createRolePlayConfig();
            await connect(apiKey, config);
            setSessionStarted(true);

            // Start timer
            const startTime = Date.now();
            const timer = setInterval(() => {
                setSessionDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

            // Clean up timer when session ends
            return () => clearInterval(timer);
        } catch (err) {
            console.error('Failed to start role-play session:', err);
        }
    };

    const handleEndSession = () => {
        disconnect();
        setSessionStarted(false);
        onSessionEnd?.(sessionDuration);
        setSessionDuration(0);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{scenario.title}</CardTitle>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                        {scenario.difficulty}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Scenario Details */}
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Persona: </span>
                        <span className="text-muted-foreground">{scenario.persona}</span>
                    </div>
                    <div>
                        <span className="font-medium">Situation: </span>
                        <span className="text-muted-foreground">{scenario.situation}</span>
                    </div>
                </div>

                {/* Session Controls */}
                {!sessionStarted ? (
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Ready to practice? The AI will introduce the scenario and start the conversation.
                        </p>
                        <Button
                            onClick={handleStartSession}
                            disabled={connectionState === 'connecting'}
                            size="lg"
                            className="w-full"
                        >
                            {connectionState === 'connecting' ? 'Connecting...' : 'Start Role-Play Session'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Session Status */}
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <div className="text-sm font-mono">
                                {formatDuration(sessionDuration)}
                            </div>
                        </div>

                        {/* Audio Levels */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Your Voice</span>
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-100"
                                        style={{ width: `${audioLevel * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>AI Response</span>
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-100"
                                        style={{ width: `${outputAudioLevel * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recording Controls */}
                        <div className="flex items-center justify-center space-x-4">
                            <Button
                                onClick={isRecording ? stopRecording : startRecording}
                                variant={isRecording ? "destructive" : "default"}
                                size="lg"
                                className="flex-1"
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="w-4 h-4 mr-2" />
                                        Stop Talking
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-4 h-4 mr-2" />
                                        Start Talking
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={handleEndSession}
                                variant="outline"
                                size="lg"
                            >
                                <PhoneOff className="w-4 h-4 mr-2" />
                                End Session
                            </Button>
                        </div>

                        {/* Manual restart if needed */}
                        {isConnected && !isSpeaking && (
                            <div className="text-center">
                                <Button
                                    onClick={triggerAutoStart}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Restart Scenario Introduction
                                </Button>
                            </div>
                        )}

                        {/* Status Messages */}
                        {isSpeaking && (
                            <div className="text-center text-sm text-muted-foreground">
                                🎭 AI is speaking...
                            </div>
                        )}

                        {isRecording && (
                            <div className="text-center text-sm text-muted-foreground">
                                🎤 Listening...
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}