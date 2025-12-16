'use client';

/**
 * Collaboration Panel Component
 * Shows real-time collaboration features for content creation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    MessageCircle,
    Eye,
    Edit3,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useRealtime } from './realtime-provider';
import { LiveStatusIndicator } from './live-status-indicator';
import { cn } from '@/lib/utils';

interface CollaborationPanelProps {
    contentId?: string;
    contentType?: string;
    className?: string;
}

interface Collaborator {
    userId: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    role: 'owner' | 'editor' | 'viewer';
    lastSeen?: number;
    currentActivity?: {
        type: 'viewing' | 'editing' | 'commenting';
        section?: string;
        timestamp: number;
    };
}

export function CollaborationPanel({
    contentId,
    contentType = 'content',
    className
}: CollaborationPanelProps) {
    const { chat, liveUpdates, isConnected } = useRealtime();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [showChat, setShowChat] = useState(false);

    // Mock collaborators data - in real app, this would come from API
    useEffect(() => {
        if (contentId) {
            // Simulate loading collaborators
            setCollaborators([
                {
                    userId: 'user-1',
                    name: 'Sarah Johnson',
                    status: 'online',
                    role: 'owner',
                    currentActivity: {
                        type: 'editing',
                        section: 'Introduction',
                        timestamp: Date.now() - 30000
                    }
                },
                {
                    userId: 'user-2',
                    name: 'Mike Chen',
                    status: 'online',
                    role: 'editor',
                    currentActivity: {
                        type: 'viewing',
                        timestamp: Date.now() - 120000
                    }
                },
                {
                    userId: 'user-3',
                    name: 'Lisa Rodriguez',
                    status: 'away',
                    role: 'viewer',
                    lastSeen: Date.now() - 300000
                }
            ]);
        }
    }, [contentId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <div className="w-2 h-2 bg-green-500 rounded-full" />;
            case 'away':
                return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
            case 'offline':
                return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
            default:
                return null;
        }
    };

    const getActivityIcon = (activity?: Collaborator['currentActivity']) => {
        if (!activity) return <Eye className="h-3 w-3 text-gray-400" />;

        switch (activity.type) {
            case 'editing':
                return <Edit3 className="h-3 w-3 text-blue-500" />;
            case 'commenting':
                return <MessageCircle className="h-3 w-3 text-green-500" />;
            case 'viewing':
            default:
                return <Eye className="h-3 w-3 text-gray-400" />;
        }
    };

    const formatLastActivity = (activity?: Collaborator['currentActivity'], lastSeen?: number) => {
        if (activity) {
            const minutes = Math.floor((Date.now() - activity.timestamp) / 60000);
            if (minutes < 1) return 'Active now';
            if (minutes < 60) return `${minutes}m ago`;
            return `${Math.floor(minutes / 60)}h ago`;
        }

        if (lastSeen) {
            const minutes = Math.floor((Date.now() - lastSeen) / 60000);
            if (minutes < 60) return `${minutes}m ago`;
            if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
            return `${Math.floor(minutes / 1440)}d ago`;
        }

        return 'Unknown';
    };

    const joinCollaboration = () => {
        if (contentId) {
            chat.joinRoom(`content-${contentId}`, 'collaboration');
        }
    };

    if (!contentId) {
        return (
            <Card className={cn("w-80", className)}>
                <CardContent className="p-6 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content selected for collaboration</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-80", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Collaboration
                    {!isConnected && (
                        <Badge variant="outline" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Offline
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Live Status */}
                <LiveStatusIndicator
                    contentId={contentId}
                    showProgress={true}
                    className="mb-4"
                />

                {/* Collaborators */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Team Members</h4>
                        <Badge variant="secondary" className="text-xs">
                            {collaborators.filter(c => c.status === 'online').length} online
                        </Badge>
                    </div>

                    <ScrollArea className="h-48">
                        <div className="space-y-2">
                            {collaborators.map((collaborator) => (
                                <div key={collaborator.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={collaborator.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {collaborator.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1">
                                            {getStatusIcon(collaborator.status)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">
                                                {collaborator.name}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {collaborator.role}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            {getActivityIcon(collaborator.currentActivity)}
                                            <span>
                                                {collaborator.currentActivity?.section && (
                                                    <span className="font-medium">
                                                        {collaborator.currentActivity.section} •
                                                    </span>
                                                )}
                                                {formatLastActivity(collaborator.currentActivity, collaborator.lastSeen)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={joinCollaboration}
                        disabled={!isConnected}
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {chat.currentRoom === `content-${contentId}` ? 'In Chat Room' : 'Join Chat'}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        disabled={!isConnected}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        View History
                    </Button>
                </div>

                {/* Connection Status */}
                {!isConnected && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting to collaboration services...
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}