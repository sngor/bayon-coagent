'use client';

/**
 * Template Sharing Status Component
 * 
 * Displays comprehensive sharing status with activity history and usage metrics
 * for templates that are currently shared with team members.
 * 
 * Requirements:
 * - 10.2: Access shared templates with proper permissions
 * - 10.3: Display sharing status and activity
 * - 10.5: Manage template sharing permissions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
    Users,
    Eye,
    Edit,
    Share2,
    Trash2,
    Clock,
    Activity,
    MoreHorizontal,
    UserCheck,
    UserX,
    Settings,
    TrendingUp,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import {
    Template,
    TemplatePermissions,
    TemplatePermission
} from '@/lib/content-workflow-types';
import {
    getTemplateAnalyticsAction,
    unshareTemplateAction,
    getSharedTemplatesAction
} from '@/features/content-engine/actions/content-workflow-actions';

// ==================== Types ====================

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'agent' | 'broker' | 'admin' | 'assistant';
    avatar?: string;
    isActive: boolean;
    lastActive?: Date;
}

interface SharingMetrics {
    totalShares: number;
    activeUsers: number;
    totalUsage: number;
    lastUsed?: Date;
    popularityScore: number;
    usageByMember: Array<{
        memberId: string;
        memberName: string;
        usageCount: number;
        lastUsed: Date;
    }>;
}

interface TemplateSharingStatusProps {
    template: Template;
    brokerageId: string;
    currentUserId: string;
    onUpdateSharing?: (templateId: string) => void;
    onUnshare?: (templateId: string) => void;
    className?: string;
}

// ==================== Mock Data ====================

const MOCK_TEAM_MEMBERS: Record<string, TeamMember> = {
    'user_1': {
        id: 'user_1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@realty.com',
        role: 'agent',
        isActive: true,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    'user_2': {
        id: 'user_2',
        name: 'Michael Chen',
        email: 'michael.chen@realty.com',
        role: 'agent',
        isActive: true,
        lastActive: new Date(Date.now() - 30 * 60 * 1000)
    },
    'user_3': {
        id: 'user_3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@realty.com',
        role: 'broker',
        isActive: true,
        lastActive: new Date(Date.now() - 10 * 60 * 1000)
    },
    'user_4': {
        id: 'user_4',
        name: 'David Kim',
        email: 'david.kim@realty.com',
        role: 'assistant',
        isActive: false,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
};

// ==================== Component ====================

export function TemplateSharingStatus({
    template,
    brokerageId,
    currentUserId,
    onUpdateSharing,
    onUnshare,
    className
}: TemplateSharingStatusProps) {
    // ==================== State ====================

    const [metrics, setMetrics] = useState<SharingMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUnsharing, setIsUnsharing] = useState(false);

    // ==================== Effects ====================

    useEffect(() => {
        if (template.isShared) {
            loadSharingMetrics();
        } else {
            setIsLoading(false);
        }
    }, [template.id, template.isShared]);

    // ==================== Data Loading ====================

    const loadSharingMetrics = async () => {
        try {
            setIsLoading(true);

            const result = await getTemplateAnalyticsAction(template.id, brokerageId);

            if (result.success && result.data?.analytics) {
                const analytics = result.data.analytics;

                // Transform analytics data into sharing metrics
                const sharingMetrics: SharingMetrics = {
                    totalShares: analytics.sharingMetrics?.activeShares || 0,
                    activeUsers: analytics.uniqueUsers || 0,
                    totalUsage: analytics.totalUsage || 0,
                    lastUsed: template.lastUsed,
                    popularityScore: calculatePopularityScore(analytics),
                    usageByMember: analytics.topUsers?.map((user: any) => ({
                        memberId: user.userId,
                        memberName: MOCK_TEAM_MEMBERS[user.userId]?.name || 'Unknown User',
                        usageCount: user.usageCount,
                        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Mock data
                    })) || []
                };

                setMetrics(sharingMetrics);
            }
        } catch (error) {
            console.error('Failed to load sharing metrics:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Load Metrics',
                description: 'Could not load sharing metrics for this template.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== Event Handlers ====================

    const handleUnshare = async () => {
        if (!template.brokerageId) return;

        setIsUnsharing(true);

        try {
            const result = await unshareTemplateAction(template.id, template.brokerageId);

            if (result.success) {
                toast({
                    title: 'Template Unshared',
                    description: `Template "${template.name}" is no longer shared with your team.`
                });

                onUnshare?.(template.id);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Unshare Failed',
                    description: result.error || 'Failed to unshare template. Please try again.'
                });
            }
        } catch (error) {
            console.error('Unshare template error:', error);
            toast({
                variant: 'destructive',
                title: 'Unshare Failed',
                description: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsUnsharing(false);
        }
    };

    // ==================== Helper Functions ====================

    const calculatePopularityScore = (analytics: any): number => {
        // Simple popularity calculation based on usage and sharing
        const usage = analytics.totalUsage || 0;
        const shares = analytics.sharingMetrics?.activeShares || 0;
        const uniqueUsers = analytics.uniqueUsers || 0;

        return Math.min(100, (usage * 2 + shares * 10 + uniqueUsers * 5));
    };

    const getPermissionIcon = (permission: TemplatePermission) => {
        switch (permission) {
            case 'view': return <Eye className="w-3 h-3" />;
            case 'edit': return <Edit className="w-3 h-3" />;
            case 'share': return <Share2 className="w-3 h-3" />;
            case 'delete': return <Trash2 className="w-3 h-3" />;
        }
    };

    const getPermissionColor = (permission: TemplatePermission) => {
        switch (permission) {
            case 'view': return 'text-blue-600 bg-blue-50';
            case 'edit': return 'text-green-600 bg-green-50';
            case 'share': return 'text-purple-600 bg-purple-50';
            case 'delete': return 'text-red-600 bg-red-50';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'broker': return 'bg-purple-100 text-purple-800';
            case 'agent': return 'bg-blue-100 text-blue-800';
            case 'assistant': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getSharedMembers = () => {
        if (!template.permissions) return [];

        const allMemberIds = new Set([
            ...template.permissions.canView,
            ...template.permissions.canEdit,
            ...template.permissions.canShare,
            ...template.permissions.canDelete
        ]);

        return Array.from(allMemberIds).map(id => MOCK_TEAM_MEMBERS[id]).filter(Boolean);
    };

    const getMemberPermissions = (memberId: string): TemplatePermission[] => {
        if (!template.permissions) return [];

        const permissions: TemplatePermission[] = [];

        if (template.permissions.canView.includes(memberId)) permissions.push(TemplatePermission.VIEW);
        if (template.permissions.canEdit.includes(memberId)) permissions.push(TemplatePermission.EDIT);
        if (template.permissions.canShare.includes(memberId)) permissions.push(TemplatePermission.SHARE);
        if (template.permissions.canDelete.includes(memberId)) permissions.push(TemplatePermission.DELETE);

        return permissions;
    };

    // ==================== Render ====================

    if (!template.isShared) {
        return (
            <Card className={cn("border-dashed", className)}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-muted-foreground">Template Not Shared</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        This template is private and only visible to you.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading sharing status...
                    </div>
                </CardContent>
            </Card>
        );
    }

    const sharedMembers = getSharedMembers();

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Share2 className="w-5 h-5 text-green-600" />
                        Sharing Status
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                        </Badge>
                    </CardTitle>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sharing Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onUpdateSharing?.(template.id)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Update Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleUnshare}
                                disabled={isUnsharing}
                                className="text-red-600"
                            >
                                <UserX className="w-4 h-4 mr-2" />
                                {isUnsharing ? 'Unsharing...' : 'Unshare Template'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Metrics Overview */}
                {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{sharedMembers.length}</div>
                            <div className="text-sm text-muted-foreground">Team Members</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{metrics.totalUsage}</div>
                            <div className="text-sm text-muted-foreground">Total Uses</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{metrics.activeUsers}</div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{metrics.popularityScore}</div>
                            <div className="text-sm text-muted-foreground">Popularity</div>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Shared Members */}
                <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Shared with {sharedMembers.length} team member{sharedMembers.length !== 1 ? 's' : ''}
                    </h4>

                    <ScrollArea className="max-h-[200px]">
                        <div className="space-y-3">
                            {sharedMembers.map(member => {
                                const memberPermissions = getMemberPermissions(member.id);

                                return (
                                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{member.name}</span>
                                                    <Badge variant="outline" className={cn("text-xs", getRoleColor(member.role))}>
                                                        {member.role}
                                                    </Badge>
                                                    {member.isActive ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Active - Last seen {member.lastActive ? formatDate(member.lastActive) : 'recently'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <XCircle className="w-3 h-3 text-gray-400" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Inactive</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            {memberPermissions.map(permission => (
                                                <TooltipProvider key={permission}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className={cn(
                                                                "p-1 rounded",
                                                                getPermissionColor(permission)
                                                            )}>
                                                                {getPermissionIcon(permission)}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Can {permission}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Usage Activity */}
                {metrics && metrics.usageByMember.length > 0 && (
                    <>
                        <Separator />

                        <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Recent Usage Activity
                            </h4>

                            <div className="space-y-2">
                                {metrics.usageByMember.slice(0, 3).map(usage => (
                                    <div key={usage.memberId} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                {usage.memberName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span>{usage.memberName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>{usage.usageCount} use{usage.usageCount !== 1 ? 's' : ''}</span>
                                            <span>•</span>
                                            <span>{formatDate(usage.lastUsed)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Sharing Info */}
                <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Template Sharing Active</p>
                            <p className="text-muted-foreground mt-1">
                                This template is shared with your brokerage team.
                                {template.lastUsed && (
                                    <span> Last used {formatDate(template.lastUsed)}.</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}