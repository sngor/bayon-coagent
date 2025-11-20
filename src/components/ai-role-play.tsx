'use client';

import { useState, useRef, useEffect } from 'react';
import { StandardCard } from '@/components/standard/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, StopCircle, User, Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    startRolePlayAction,
    sendRolePlayMessageAction,
    endRolePlayAction,
} from '@/app/actions';
import { rolePlayScenarios, type RolePlayScenario } from '@/lib/training-data';
import type { RolePlayMessage } from '@/aws/bedrock/flows/role-play-flow';

export interface AIRolePlayProps {
    moduleId?: string;
    className?: string;
}

export function AIRolePlay({ moduleId, className }: AIRolePlayProps = {}) {
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<RolePlayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isAIResponding, setIsAIResponding] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter scenarios by module if provided
    const availableScenarios = moduleId
        ? rolePlayScenarios.filter((s) => s.relatedModules.includes(moduleId))
        : rolePlayScenarios;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const selectedScenario = rolePlayScenarios.find(
        (s) => s.id === selectedScenarioId
    );

    const handleStartSession = async () => {
        if (!selectedScenarioId) {
            toast({
                title: 'Select a Scenario',
                description: 'Please choose a role-play scenario to begin.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await startRolePlayAction(selectedScenarioId);

            if (result.errors) {
                toast({
                    title: 'Failed to Start',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
                return;
            }

            if (result.data?.sessionId) {
                setSessionId(result.data.sessionId);
                setSessionStartTime(Date.now());
                setMessages([]);
                setFeedback(null);

                // Add initial AI greeting
                const scenario = selectedScenario!;
                const greeting = `Hello! I'm ${scenario.persona.name}. ${scenario.persona.background}. How can you help me today?`;

                setMessages([
                    {
                        role: 'ai',
                        content: greeting,
                        timestamp: new Date().toISOString(),
                    },
                ]);

                toast({
                    title: 'Session Started',
                    description: `You're now practicing with ${scenario.persona.name}.`,
                });
            }
        } catch (error) {
            console.error('Start session error:', error);
            toast({
                title: 'Error',
                description: 'Failed to start session. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || !sessionId || !selectedScenario) return;

        const messageToSend = userInput.trim();
        setUserInput('');
        setIsAIResponding(true);

        try {
            const result = await sendRolePlayMessageAction(
                sessionId,
                selectedScenario.id,
                selectedScenario.title,
                selectedScenario.persona.name,
                selectedScenario.persona.background,
                selectedScenario.persona.personality,
                selectedScenario.persona.goals,
                selectedScenario.persona.concerns,
                selectedScenario.persona.communicationStyle,
                messages,
                messageToSend
            );

            if (result.errors) {
                toast({
                    title: 'Failed to Send',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
                setUserInput(messageToSend); // Restore message
                return;
            }

            if (result.data?.response) {
                const timestamp = new Date().toISOString();
                setMessages((prev) => [
                    ...prev,
                    { role: 'user', content: messageToSend, timestamp },
                    { role: 'ai', content: result.data!.response, timestamp },
                ]);
            }
        } catch (error) {
            console.error('Send message error:', error);
            toast({
                title: 'Error',
                description: 'Failed to send message. Please try again.',
                variant: 'destructive',
            });
            setUserInput(messageToSend); // Restore message
        } finally {
            setIsAIResponding(false);
        }
    };

    const handleEndSession = async () => {
        if (!sessionId || !selectedScenario || !sessionStartTime) return;

        setIsAIResponding(true);

        try {
            const result = await endRolePlayAction(
                sessionId,
                selectedScenario.id,
                selectedScenario.title,
                selectedScenario.persona.name,
                selectedScenario.persona.background,
                selectedScenario.persona.personality,
                selectedScenario.persona.goals,
                selectedScenario.persona.concerns,
                selectedScenario.persona.communicationStyle,
                messages,
                sessionStartTime
            );

            if (result.errors) {
                toast({
                    title: 'Failed to End Session',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
                return;
            }

            if (result.data?.feedback) {
                setFeedback(result.data.feedback);
                toast({
                    title: 'Session Complete',
                    description: 'Review your feedback below.',
                });
            }
        } catch (error) {
            console.error('End session error:', error);
            toast({
                title: 'Error',
                description: 'Failed to end session. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsAIResponding(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={className}>
            {!sessionId ? (
                // Scenario Selection
                <StandardCard
                    title={<span className="font-headline">AI Role-Play Practice</span>}
                    description="Practice real-world scenarios with AI personas to build confidence and improve your skills"
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="scenario" className="text-sm font-medium">
                                Choose a Scenario
                            </label>
                            <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
                                <SelectTrigger id="scenario">
                                    <SelectValue placeholder="Select a practice scenario..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableScenarios.map((scenario) => (
                                        <SelectItem key={scenario.id} value={scenario.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{scenario.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({scenario.difficulty})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedScenario && (
                            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border">
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Scenario</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedScenario.description}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-1">You'll Practice</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {selectedScenario.learningObjectives.map((obj, idx) => (
                                            <li key={idx}>• {obj}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-1">
                                        About {selectedScenario.persona.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedScenario.persona.background}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        <strong>Personality:</strong> {selectedScenario.persona.personality}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleStartSession}
                            disabled={!selectedScenarioId}
                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            size="lg"
                        >
                            <Sparkles className="mr-2 h-5 w-5" />
                            Start Practice Session
                        </Button>
                    </div>
                </StandardCard>
            ) : feedback ? (
                // Feedback Display
                <StandardCard
                    title={<span className="font-headline">Session Complete</span>}
                    description="Here's your performance feedback"
                >
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-lg border-2 border-primary/10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Your Feedback</h3>
                            </div>
                            <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap">
                                {feedback}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setSessionId(null);
                                    setMessages([]);
                                    setFeedback(null);
                                    setSessionStartTime(null);
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                Practice Another Scenario
                            </Button>
                            <Button
                                onClick={() => {
                                    setSessionId(null);
                                    setMessages([]);
                                    setFeedback(null);
                                    setSessionStartTime(null);
                                    setSelectedScenarioId('');
                                }}
                                className="flex-1"
                            >
                                Back to Scenarios
                            </Button>
                        </div>
                    </div>
                </StandardCard>
            ) : (
                // Active Conversation
                <StandardCard
                    title={
                        <div className="flex items-center justify-between">
                            <span className="font-headline">
                                Practicing: {selectedScenario?.title}
                            </span>
                            <Button
                                onClick={handleEndSession}
                                disabled={isAIResponding || messages.length < 2}
                                variant="outline"
                                size="sm"
                            >
                                <StopCircle className="mr-2 h-4 w-4" />
                                End Session
                            </Button>
                        </div>
                    }
                    description={`You're speaking with ${selectedScenario?.persona.name}`}
                >
                    <div className="space-y-4">
                        {/* Messages */}
                        <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        {msg.role === 'ai' && (
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                                <User className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isAIResponding && (
                                    <div className="flex gap-3 justify-start">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="bg-secondary rounded-lg p-3">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="flex gap-2">
                            <Textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your response... (Press Enter to send, Shift+Enter for new line)"
                                className="resize-none"
                                rows={3}
                                disabled={isAIResponding}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!userInput.trim() || isAIResponding}
                                size="lg"
                                className="px-6"
                            >
                                {isAIResponding ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>

                        {/* Tips */}
                        <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded">
                            <strong>Tips:</strong> Stay in character as a real estate agent. Ask questions,
                            build rapport, and handle objections professionally. The AI will respond based
                            on the persona's personality and concerns.
                        </div>
                    </div>
                </StandardCard>
            )}
        </div>
    );
}
