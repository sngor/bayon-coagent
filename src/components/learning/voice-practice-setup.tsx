'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceDiagnostics } from '@/components/voice-diagnostics';
import { VoiceErrorBoundary } from '@/components/voice-error-boundary';
import { useVoiceService } from '@/hooks/use-voice-service';
import { getVoiceConfig } from '@/lib/voice-config';
import {
    Mic,
    Settings,
    Play,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

interface VoicePracticeSetupProps {
    onSetupComplete: (config: { apiKey: string; voiceName?: string }) => void;
    onCancel: () => void;
}

/**
 * Voice practice setup component for the Learning hub
 * Follows the hub architecture pattern with proper error handling
 */
export function VoicePracticeSetup({ onSetupComplete, onCancel }: VoicePracticeSetupProps) {
    const [apiKey, setApiKey] = useState('');
    const [voiceName, setVoiceName] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    const voiceService = useVoiceService();

    const handleValidateAndConnect = useCallback(async () => {
        if (!apiKey.trim()) {
            return;
        }

        setIsValidating(true);

        try {
            const config = {
                voiceName: voiceName || undefined,
                systemInstruction: `You are a real estate client in a role-play scenario. 
                Stay in character and respond naturally to the agent's questions and statements. 
                Be realistic but cooperative to help them practice their skills.`
            };

            await voiceService.connect(apiKey, config);

            if (voiceService.isReady) {
                onSetupComplete({
                    apiKey,
                    voiceName: voiceName || undefined
                });
            } else {
                setShowDiagnostics(true);
            }
        } catch (error) {
            console.error('Voice setup failed:', error);
            setShowDiagnostics(true);
        } finally {
            setIsValidating(false);
        }
    }, [apiKey, voiceName, voiceService, onSetupComplete]);

    const handleRunDiagnostics = useCallback(() => {
        if (apiKey.trim()) {
            handleValidateAndConnect();
        }
    }, [apiKey, handleValidateAndConnect]);

    if (showDiagnostics) {
        return (
            <VoiceErrorBoundary>
                <div className="space-y-6">
                    <VoiceDiagnostics
                        isConnected={voiceService.isConnected}
                        error={voiceService.error?.message || null}
                        onRunDiagnostics={handleRunDiagnostics}
                        showDevNote={false}
                    />
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowDiagnostics(false)}
                            variant="outline"
                            className="flex-1"
                        >
                            Back to Setup
                        </Button>
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </VoiceErrorBoundary>
        );
    }

    return (
        <VoiceErrorBoundary>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-primary" />
                        Voice Practice Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Connection Status */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        {voiceService.connectionStatus === 'connected' ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Connected and ready</span>
                            </>
                        ) : voiceService.connectionStatus === 'error' ? (
                            <>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium">Connection failed</span>
                            </>
                        ) : (
                            <>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Setup required</span>
                            </>
                        )}
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">Gemini API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="Enter your Gemini API key (AIza...)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Get your API key from{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {/* Voice Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="voiceName">Voice (Optional)</Label>
                        <Input
                            id="voiceName"
                            placeholder="e.g., Aoede, Charon (leave empty for default)"
                            value={voiceName}
                            onChange={(e) => setVoiceName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Choose a voice for the AI client. Leave empty to use the default voice.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleValidateAndConnect}
                            disabled={!apiKey.trim() || isValidating}
                            className="flex-1"
                        >
                            {isValidating ? (
                                <>
                                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Practice
                                </>
                            )}
                        </Button>
                        <Button onClick={onCancel} variant="outline">
                            Cancel
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>How it works:</strong> You'll have a voice conversation with an AI client.
                            The AI will stay in character for the scenario you selected, helping you practice
                            real-world situations in a safe environment.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </VoiceErrorBoundary>
    );
}