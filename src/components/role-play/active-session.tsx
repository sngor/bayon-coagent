import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RolePlayScenario, ConversationMessage } from '@/hooks/use-role-play-session';

interface ActiveSessionProps {
    scenario: RolePlayScenario;
    sessionTime: number;
    isPaused: boolean;
    currentMessage: string;
    conversation: ConversationMessage[];
    formatTime: (seconds: number) => string;
    onTogglePause: () => void;
    onEndSession: () => void;
    onMessageChange: (message: string) => void;
    onSendMessage: () => void;
}

export function ActiveSession({
    scenario,
    sessionTime,
    isPaused,
    currentMessage,
    conversation,
    formatTime,
    onTogglePause,
    onEndSession,
    onMessageChange,
    onSendMessage,
}: ActiveSessionProps) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <div className="space-y-6">
            {/* Session Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Play className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{scenario.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Role-playing with {scenario.aiPersona.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-2xl font-bold">{formatTime(sessionTime)}</div>
                                <div className="text-sm text-muted-foreground">Session Time</div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onTogglePause}
                                >
                                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={onEndSession}
                                >
                                    End Session
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Conversation */}
            <Card className="flex-1">
                <CardContent className="p-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                        {conversation.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-3",
                                    message.speaker === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] p-3 rounded-lg",
                                        message.speaker === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}
                                >
                                    <p className="text-sm">{message.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Type your response..."
                            value={currentMessage}
                            onChange={(e) => onMessageChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isPaused}
                        />
                        <Button
                            onClick={onSendMessage}
                            disabled={!currentMessage.trim() || isPaused}
                        >
                            Send
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}