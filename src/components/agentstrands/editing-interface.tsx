"use client";

import { useState, useEffect } from "react";
import { Send, RotateCcw, Save, History, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ContentVersion {
    version: number;
    content: string;
    metadata: {
        editType?: string;
        userRequest?: string;
        timestamp: string;
    };
}

interface EditingSession {
    sessionId: string;
    contentId: string;
    versions: ContentVersion[];
    currentVersion: number;
    status: "active" | "completed" | "abandoned";
    startedAt: string;
    updatedAt: string;
}

interface EditingInterfaceProps {
    contentId: string;
    initialContent: string;
    onSave?: (content: string) => void;
    onClose?: () => void;
    className?: string;
}

export function EditingInterface({
    contentId,
    initialContent,
    onSave,
    onClose,
    className,
}: EditingInterfaceProps) {
    const [session, setSession] = useState<EditingSession | null>(null);
    const [currentContent, setCurrentContent] = useState(initialContent);
    const [editRequest, setEditRequest] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        initializeSession();
    }, [contentId]);

    const initializeSession = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/agentstrands/editing/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentId,
                    initialContent,
                }),
            });

            if (!response.ok) throw new Error("Failed to create session");

            const data = await response.json();
            setSession(data.session);
            setCurrentContent(data.session.versions[0].content);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to initialize editing session",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRequest = async () => {
        if (!editRequest.trim() || !session) return;

        setIsProcessing(true);
        try {
            // In a real implementation, this would call an AI service to process the edit
            // For now, we'll just add a new version with the same content
            const response = await fetch("/api/agentstrands/editing/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: "add-version",
                    content: currentContent, // In reality, this would be the AI-edited content
                    metadata: {
                        editType: "conversational",
                        userRequest: editRequest,
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to process edit");

            const data = await response.json();
            setSession(data.session);
            setCurrentContent(data.session.versions[data.session.currentVersion].content);
            setEditRequest("");

            toast({
                title: "Edit applied",
                description: "Your changes have been processed",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process edit request",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRollback = async (version: number) => {
        if (!session) return;

        try {
            const response = await fetch("/api/agentstrands/editing/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: "rollback",
                    version,
                }),
            });

            if (!response.ok) throw new Error("Failed to rollback");

            const data = await response.json();
            setSession(data.session);
            setCurrentContent(data.session.versions[data.session.currentVersion].content);

            toast({
                title: "Rolled back",
                description: `Restored to version ${version}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to rollback to previous version",
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        if (!session) return;

        try {
            // Update session status to completed
            await fetch("/api/agentstrands/editing/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: "update-status",
                    status: "completed",
                }),
            });

            onSave?.(currentContent);
            toast({
                title: "Saved",
                description: "Your changes have been saved",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save changes",
                variant: "destructive",
            });
        }
    };

    const handleClose = async () => {
        if (!session) return;

        try {
            await fetch("/api/agentstrands/editing/session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: "update-status",
                    status: "abandoned",
                }),
            });

            onClose?.();
        } catch (error) {
            // Silent fail on close
            onClose?.();
        }
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Collaborative Editing</CardTitle>
                            <CardDescription>
                                Refine your content through conversation with AI
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                Version {session?.currentVersion || 0} of {session?.versions.length || 0}
                            </Badge>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <History className="h-4 w-4 mr-2" />
                                        History
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Version History</DialogTitle>
                                        <DialogDescription>
                                            View and restore previous versions
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-4">
                                            {session?.versions.map((version, index) => (
                                                <Card
                                                    key={version.version}
                                                    className={cn(
                                                        "cursor-pointer transition-colors hover:bg-accent",
                                                        version.version === session.currentVersion &&
                                                        "border-primary"
                                                    )}
                                                    onClick={() => handleRollback(version.version)}
                                                >
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">
                                                                    Version {version.version}
                                                                </Badge>
                                                                {version.version === session.currentVersion && (
                                                                    <Badge>Current</Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(version.metadata.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {version.metadata.userRequest && (
                                                            <p className="text-sm text-muted-foreground">
                                                                "{version.metadata.userRequest}"
                                                            </p>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm line-clamp-3">{version.content}</p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Content Editor */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Current Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={currentContent}
                        onChange={(e) => setCurrentContent(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="Your content will appear here..."
                    />
                </CardContent>
            </Card>

            {/* Edit Request */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Request Changes</CardTitle>
                    <CardDescription>
                        Describe what you'd like to change, and AI will help refine the content
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={editRequest}
                        onChange={(e) => setEditRequest(e.target.value)}
                        rows={3}
                        placeholder="E.g., 'Make it more professional' or 'Add more details about pricing'"
                        disabled={isProcessing}
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleEditRequest}
                            disabled={!editRequest.trim() || isProcessing}
                            className="flex-1"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Apply Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRequest("Make it more concise")}
                                disabled={isProcessing}
                            >
                                Make Concise
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRequest("Make it more detailed")}
                                disabled={isProcessing}
                            >
                                Add Details
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRequest("Make it more professional")}
                                disabled={isProcessing}
                            >
                                More Professional
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRequest("Make it more casual")}
                                disabled={isProcessing}
                            >
                                More Casual
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRequest("Fix grammar and spelling")}
                                disabled={isProcessing}
                            >
                                Fix Grammar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
                <Button variant="outline" onClick={handleClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                </Button>
                <div className="flex gap-2">
                    {session && session.currentVersion > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => handleRollback(session.currentVersion - 1)}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Undo
                        </Button>
                    )}
                    <Button onClick={handleSave}>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
