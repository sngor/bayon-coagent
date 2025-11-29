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
import { Loader2, Send, StopCircle, User, Bot, Sparkles, Mic, MessageSquare, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    startRolePlayAction,
    sendRolePlayMessageAction,
    endRolePlayAction,
} from '@/app/actions';
import { rolePlayScenarios, type RolePlayScenario } from '@/lib/constants/training-data';
import type { RolePlayMessage } from '@/aws/bedrock/flows/role-play-flow';
import { VoiceRolePlay } from '@/components/voice-role-play';
import { CoachingMode } from '@/components/coaching-mode';

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
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isCoachingMode, setIsCoachingMode] = useState(false);
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
                <div className="w-full max-w-full space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column: Configuration */}
                        <StandardCard
                            title={
                                <span className="text-2xl font-bold font-headline bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    AI Role-Play Studio
                                </span>
                            }
                            description="Master your scripts and objection handling with realistic AI personas"
                            className="h-full"
                        >
                            <div className="space-y-6">
                                {/* Mode Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        1. Choose Practice Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setIsVoiceMode(false)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${!isVoiceMode
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                }`}
                                        >
                                            <MessageSquare className={`h-6 w-6 mb-2 ${!isVoiceMode ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className="font-semibold text-sm">Text Chat</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Type and read at your own pace
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setIsVoiceMode(true)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${isVoiceMode
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                }`}
                                        >
                                            <Mic className={`h-6 w-6 mb-2 ${isVoiceMode ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className="font-semibold text-sm">Voice Mode</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Real-time speech practice
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Coaching Toggle (Voice Only) */}
                                <div className={`transition-all duration-300 ${isVoiceMode ? 'opacity-100 max-h-32' : 'opacity-50 max-h-0 overflow-hidden'}`}>
                                    <div
                                        onClick={() => isVoiceMode && setIsCoachingMode(!isCoachingMode)}
                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isCoachingMode
                                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                                            : 'border-muted hover:border-amber-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full ${isCoachingMode ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                                <Lightbulb className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`font-semibold text-sm ${isCoachingMode ? 'text-amber-900 dark:text-amber-100' : ''}`}>
                                                        Coaching Mode
                                                    </span>
                                                    {isCoachingMode && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">ENABLED</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Get real-time feedback on your tone, pace, and objection handling techniques.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scenario Selector */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        2. Select Scenario
                                    </label>
                                    <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Choose a scenario..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableScenarios.map((scenario) => (
                                                <SelectItem key={scenario.id} value={scenario.id}>
                                                    <span className="font-medium">{scenario.title}</span>
                                                    <span className="ml-2 text-muted-foreground text-xs">
                                                        ({scenario.difficulty})
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={isVoiceMode ? () => setSessionId('voice-mode') : handleStartSession}
                                    disabled={!selectedScenarioId}
                                    className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
                                    size="lg"
                                >
                                    {isVoiceMode ? (
                                        <>
                                            <Mic className="mr-2 h-5 w-5" />
                                            Start Voice Session
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Start Text Session
                                        </>
                                    )}
                                </Button>
                            </div>
                        </StandardCard>

                        {/* Right Column: Scenario Preview */}
                        <div className="space-y-6">
                            {selectedScenario ? (
                                <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="relative flex-1 overflow-hidden rounded-xl border bg-gradient-to-br from-secondary/50 to-background p-6 shadow-sm">
                                        {/* Persona Header */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                                <User className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold font-headline">{selectedScenario.persona.name}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {selectedScenario.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-lg bg-background/50 border backdrop-blur-sm">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Background</h4>
                                                <p className="text-sm leading-relaxed">
                                                    "{selectedScenario.persona.background}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-background/50 border">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Personality</h4>
                                                    <p className="text-sm font-medium">{selectedScenario.persona.personality}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-background/50 border">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Style</h4>
                                                    <p className="text-sm font-medium">{selectedScenario.persona.communicationStyle}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Learning Objectives</h4>
                                                <ul className="space-y-2">
                                                    {selectedScenario.learningObjectives.map((obj, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                            <span className="text-muted-foreground">{obj}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Sparkles className="h-8 w-8 opacity-50" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">No Scenario Selected</h3>
                                    <p className="text-sm max-w-xs">
                                        Choose a scenario from the list to view the persona details and learning objectives.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : isVoiceMode && selectedScenario ? (
                // Voice Mode or Coaching Mode
                isCoachingMode ? (
                    <CoachingMode
                        scenario={selectedScenario}
                        onEnd={() => {
                            setSessionId(null);
                            setMessages([]);
                            setFeedback(null);
                            setSessionStartTime(null);
                        }}
                    />
                ) : (
                    <VoiceRolePlay
                        scenario={selectedScenario}
                        onEnd={() => {
                            setSessionId(null);
                            setMessages([]);
                            setFeedback(null);
                            setSessionStartTime(null);
                        }}
                    />
                )
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
                                <h3 className="font-headline font-semibold text-lg">Your Feedback</h3>
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
                <div className="w-full max-w-full h-[800px] flex flex-col">
                    <StandardCard
                        className="flex-1 flex flex-col overflow-hidden"
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                                    </div>
                                    <div>
                                        <h2 className="font-headline text-lg font-bold">
                                            {selectedScenario?.persona.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedScenario?.title} • Text Practice
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleEndSession}
                                    disabled={isAIResponding || messages.length < 2}
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                                >
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    End Session
                                </Button>
                            </div>
                        }
                    >
                        <div className="flex flex-col h-full">
                            {/* Messages Area */}
                            <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
                                <div className="space-y-6 py-4 px-2">
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                        >
                                            {msg.role === 'ai' && (
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                                    <span className="text-xs font-bold text-white">AI</span>
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-secondary/50 border border-secondary rounded-tl-sm'
                                                    }`}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>

                                            {msg.role === 'user' && (
                                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                                    <User className="h-4 w-4 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {isAIResponding && (
                                        <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-xs font-bold text-white">AI</span>
                                            </div>
                                            <div className="bg-secondary/50 border border-secondary rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                                                <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="mt-4 pt-4 border-t bg-background">
                                <div className="flex gap-3 items-end">
                                    <div className="relative flex-1">
                                        <Textarea
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type your response..."
                                            className="min-h-[60px] max-h-[120px] resize-none pr-12 py-3 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
                                            rows={1}
                                            disabled={isAIResponding}
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                                            ↵ to send
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!userInput.trim() || isAIResponding}
                                        size="icon"
                                        className="h-[60px] w-[60px] rounded-xl shadow-md shrink-0 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isAIResponding ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <Send className="h-6 w-6 ml-0.5" />
                                        )}
                                    </Button>
                                </div>

                                {/* Context/Tips */}
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-secondary/20">
                                    <Lightbulb className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                    <span className="truncate">
                                        Tip: Stay in character. Address {selectedScenario?.persona.name}'s concerns about "{selectedScenario?.persona.concerns[0]}".
                                    </span>
                                </div>
                            </div>
                        </div>
                    </StandardCard>
                </div>
            )}
        </div>
    );
}
