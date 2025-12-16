// Extract role-play session logic to a dedicated hook
'use client';

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    startRolePlayAction,
    sendRolePlayMessageAction,
    endRolePlayAction,
} from '@/app/actions';
import type { RolePlayMessage, RolePlayScenario } from '@/lib/constants/learning-data';

export interface RolePlaySessionState {
    sessionId: string | null;
    messages: RolePlayMessage[];
    isAIResponding: boolean;
    feedback: string | null;
    sessionStartTime: number | null;
    error: string | null;
}

export interface RolePlaySessionActions {
    startSession: (scenarioId: string) => Promise<boolean>;
    sendMessage: (message: string) => Promise<boolean>;
    endSession: () => Promise<boolean>;
    resetSession: () => void;
}

export function useRolePlaySession(scenario: RolePlayScenario | null): RolePlaySessionState & RolePlaySessionActions {
    const [state, setState] = useState<RolePlaySessionState>({
        sessionId: null,
        messages: [],
        isAIResponding: false,
        feedback: null,
        sessionStartTime: null,
        error: null,
    });

    const { toast } = useToast();
    const abortControllerRef = useRef<AbortController | null>(null);

    const updateState = useCallback((updates: Partial<RolePlaySessionState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const startSession = useCallback(async (scenarioId: string): Promise<boolean> => {
        if (!scenario) {
            updateState({ error: 'No scenario selected' });
            return false;
        }

        try {
            updateState({ isAIResponding: true, error: null });

            const result = await startRolePlayAction(scenarioId);

            if (result.errors) {
                const errorMessage = result.errors.join(', ');
                updateState({ error: errorMessage, isAIResponding: false });
                toast({
                    title: 'Failed to Start',
                    description: errorMessage,
                    variant: 'destructive',
                });
                return false;
            }

            if (result.data?.sessionId) {
                const greeting = `Hello! I'm ${scenario.persona.name}. ${scenario.persona.background}. How can you help me today?`;

                updateState({
                    sessionId: result.data.sessionId,
                    sessionStartTime: Date.now(),
                    messages: [{
                        role: 'ai',
                        content: greeting,
                        timestamp: new Date().toISOString(),
                    }],
                    feedback: null,
                    isAIResponding: false,
                });

                toast({
                    title: 'Session Started',
                    description: `You're now practicing with ${scenario.persona.name}.`,
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Start session error:', error);
            const errorMessage = 'Failed to start session. Please try again.';
            updateState({ error: errorMessage, isAIResponding: false });
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        }
    }, [scenario, updateState, toast]);

    const sendMessage = useCallback(async (messageContent: string): Promise<boolean> => {
        if (!state.sessionId || !scenario || !messageContent.trim()) {
            return false;
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        updateState({ isAIResponding: true });

        try {
            const result = await sendRolePlayMessageAction(
                state.sessionId,
                scenario.id,
                scenario.title,
                scenario.persona.name,
                scenario.persona.background,
                scenario.persona.personality,
                scenario.persona.goals,
                scenario.persona.concerns,
                scenario.persona.communicationStyle,
                state.messages,
                messageContent
            );

            if (result.errors) {
                const errorMessage = result.errors.join(', ');
                updateState({ error: errorMessage, isAIResponding: false });
                toast({
                    title: 'Failed to Send',
                    description: errorMessage,
                    variant: 'destructive',
                });
                return false;
            }

            if (result.data?.response) {
                const timestamp = new Date().toISOString();
                const newMessages = [
                    ...state.messages,
                    { role: 'user' as const, content: messageContent, timestamp },
                    { role: 'ai' as const, content: result.data.response, timestamp },
                ];

                updateState({
                    messages: newMessages,
                    isAIResponding: false,
                    error: null
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Send message error:', error);
            const errorMessage = 'Failed to send message. Please try again.';
            updateState({ error: errorMessage, isAIResponding: false });
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        }
    }, [state.sessionId, state.messages, scenario, updateState, toast]);

    const endSession = useCallback(async (): Promise<boolean> => {
        if (!state.sessionId || !scenario || !state.sessionStartTime) {
            return false;
        }

        updateState({ isAIResponding: true });

        try {
            const result = await endRolePlayAction(
                state.sessionId,
                scenario.id,
                scenario.title,
                scenario.persona.name,
                scenario.persona.background,
                scenario.persona.personality,
                scenario.persona.goals,
                scenario.persona.concerns,
                scenario.persona.communicationStyle,
                state.messages,
                state.sessionStartTime
            );

            if (result.errors) {
                const errorMessage = result.errors.join(', ');
                updateState({ error: errorMessage, isAIResponding: false });
                toast({
                    title: 'Failed to End Session',
                    description: errorMessage,
                    variant: 'destructive',
                });
                return false;
            }

            if (result.data?.feedback) {
                updateState({
                    feedback: result.data.feedback,
                    isAIResponding: false,
                    error: null
                });
                toast({
                    title: 'Session Complete',
                    description: 'Review your feedback below.',
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('End session error:', error);
            const errorMessage = 'Failed to end session. Please try again.';
            updateState({ error: errorMessage, isAIResponding: false });
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        }
    }, [state.sessionId, state.messages, state.sessionStartTime, scenario, updateState, toast]);

    const resetSession = useCallback(() => {
        // Cancel any ongoing requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setState({
            sessionId: null,
            messages: [],
            isAIResponding: false,
            feedback: null,
            sessionStartTime: null,
            error: null,
        });
    }, []);

    return {
        ...state,
        startSession,
        sendMessage,
        endSession,
        resetSession,
    };
}