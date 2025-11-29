'use client';

/**
 * Share Template Modal Component
 * 
 * Provides an intuitive interface for sharing templates with team members
 * within a brokerage organization with role-based access control.
 * 
 * Requirements:
 * - 10.2: Enable template sharing within brokerage organization
 * - 10.3: Access shared templates with proper permissions
 * - 10.5: Manage template sharing permissions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
    Users,
    Search,
    Shield,
    Eye,
    Edit,
    Share2,
    Trash2,
    Clock,
    Activity,
    AlertCircle,
    CheckCircle,
    X,
    Plus,
    Filter,
    UserCheck,
    UserX,
    Settings,
    Bell,
    History
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import {
    Template,
    TemplatePermissions,
    TemplatePermission
} from '@/lib/content-workflow-types';
import { shareTemplateAction, getTemplateAnalyticsAction } from '@/features/content-engine/actions/content-workflow-actions';

// ==================== Types ====================

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'agent' | 'broker' | 'admin' | 'assistant';
    department?: string;
    avatar?: string;
    isActive: boolean;
    lastActive?: Date;
    joinedAt: Date;
}

interface SharingActivity {
    id: string;
    userId: string;
    userName: string;
    action: 'shared' | 'unshared' | 'permission_changed' | 'accessed' | 'copied';
    timestamp: Date;
    details?: string;
}

interface ShareTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template;
    brokerageId: string;
    currentUserId: string;
    onShareSuccess?: (templateId: string, permissions: TemplatePermissions) => void;
}

// ==================== Mock Data (In production, this would come from API) ====================

const MOCK_TEAM_MEMBERS: TeamMember[] = [
    {
        id: 'user_1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@realty.com',
        role: 'agent',
        department: 'Residential Sales',
        isActive: true,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        joinedAt: new Date('2023-01-15')
    },
    {
        id: 'user_2',
        name: 'Michael Chen',
        email: 'michael.chen@realty.com',
        role: 'agent',
        department: 'Commercial',
        isActive: true,
        lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        joinedAt: new Date('2023-03-20')
    },
    {
        id: 'user_3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@realty.com',
        role: 'broker',
        department: 'Management',
        isActive: true,
        lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        joinedAt: new Date('2022-08-10')
    },
    {
        id: 'user_4',
        name: 'David Kim',
        email: 'david.kim@realty.com',
        role: 'assistant',
        department: 'Marketing',
        isActive: false,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        joinedAt: new Date('2023-06-01')
    },
    {
        id: 'user_5',
        name: 'Lisa Thompson',
        email: 'lisa.thompson@realty.com',
        role: 'admin',
        department: 'IT',
        isActive: true,
        lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        joinedAt: new Date('2022-11-30')
    }
];

const MOCK_SHARING_ACTIVITY: SharingActivity[] = [
    {
        id: 'activity_1',
        userId: 'user_2',
        userName: 'Michael Chen',
        action: 'accessed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: 'Used template for listing description'
    },
    {
        id: 'activity_2',
        userId: 'user_3',
        userName: 'Emily Rodriguez',
        action: 'shared',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        details: 'Shared with 3 team members'
    },
    {
        id: 'activity_3',
        userId: 'user_1',
        userName: 'Sarah Johnson',
        action: 'copied',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        details: 'Created personal copy with modifications'
    }
];

// ==================== Component ====================

export function ShareTemplateModal({
    isOpen,
    onClose,
    template,
    brokerageId,
    currentUserId,
    onShareSuccess
}: ShareTemplateModalProps) {
    // ==================== State ====================

    const [activeTab, setActiveTab] = useState<'permissions' | 'activity' | 'settings'>('permissions');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [isSharing, setIsSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState('');
    const [requireApproval, setRequireApproval] = useState(false);
    const [notifyMembers, setNotifyMembers] = useState(true);
    const [expirationDate, setExpirationDate] = useState<string>('');
    const [analytics, setAnalytics] = useState<any>(null);

    // Permission state
    const [permissions, setPermissions] = useState<TemplatePermissions>({
        canView: template.permissions?.canView || [],
        canEdit: template.permissions?.canEdit || [],
        canShare: template.permissions?.canShare || [],
        canDelete: template.permissions?.canDelete || []
    });

    // ==================== Effects ====================

    useEffect(() => {
        if (isOpen && template.id) {
            loadTemplateAnalytics();
        }
    }, [isOpen, template.id]);

    // ==================== Data Processing ====================

    const filteredMembers = useMemo(() => {
        return MOCK_TEAM_MEMBERS.filter(member => {
            // Exclude current user
            if (member.id === currentUserId) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!member.name.toLowerCase().includes(query) &&
                    !member.email.toLowerCase().includes(query) &&
                    !member.department?.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Role filter
            if (roleFilter !== 'all' && member.role !== roleFilter) {
                return false;
            }

            // Department filter
            if (departmentFilter !== 'all' && member.department !== departmentFilter) {
                return false;
            }

            return true;
        });
    }, [searchQuery, roleFilter, departmentFilter, currentUserId]);

    const departments = useMemo(() => {
        const depts = new Set(MOCK_TEAM_MEMBERS.map(m => m.department).filter(Boolean));
        return Array.from(depts);
    }, []);

    const selectedMembersCount = useMemo(() => {
        const allSelected = new Set([
            ...permissions.canView,
            ...permissions.canEdit,
            ...permissions.canShare,
            ...permissions.canDelete
        ]);
        return allSelected.size;
    }, [permissions]);

    // ==================== Event Handlers ====================

    const loadTemplateAnalytics = async () => {
        try {
            const result = await getTemplateAnalyticsAction(template.id, brokerageId);
            if (result.success && result.data) {
                setAnalytics(result.data.analytics);
            }
        } catch (error) {
            console.error('Failed to load template analytics:', error);
        }
    };

    const handlePermissionChange = (memberId: string, permission: TemplatePermission, granted: boolean) => {
        setPermissions(prev => {
            const key = `can${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof TemplatePermissions;
            const currentList = prev[key] as string[] || [];

            if (granted) {
                // Add permission if not already present
                if (!currentList.includes(memberId)) {
                    return {
                        ...prev,
                        [key]: [...currentList, memberId]
                    };
                }
            } else {
                // Remove permission
                return {
                    ...prev,
                    [key]: currentList.filter(id => id !== memberId)
                };
            }

            return prev;
        });
    };

    const handleBulkPermissionChange = (memberIds: string[], permission: TemplatePermission, granted: boolean) => {
        memberIds.forEach(memberId => {
            handlePermissionChange(memberId, permission, granted);
        });
    };

    const handleSelectAll = (permission: TemplatePermission) => {
        const memberIds = filteredMembers.map(m => m.id);
        handleBulkPermissionChange(memberIds, permission, true);
    };

    const handleDeselectAll = (permission: TemplatePermission) => {
        const memberIds = filteredMembers.map(m => m.id);
        handleBulkPermissionChange(memberIds, permission, false);
    };

    const handleShare = async () => {
        if (selectedMembersCount === 0) {
            toast({
                variant: 'destructive',
                title: 'No Members Selected',
                description: 'Please select at least one team member to share with.'
            });
            return;
        }

        setIsSharing(true);

        try {
            const result = await shareTemplateAction(
                template.id,
                brokerageId,
                permissions
            );

            if (result.success) {
                toast({
                    title: 'Template Shared Successfully',
                    description: `Template "${template.name}" has been shared with ${selectedMembersCount} team member${selectedMembersCount > 1 ? 's' : ''}.`
                });

                onShareSuccess?.(template.id, permissions);
                onClose();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Sharing Failed',
                    description: result.error || 'Failed to share template. Please try again.'
                });
            }
        } catch (error) {
            console.error('Share template error:', error);
            toast({
                variant: 'destructive',
                title: 'Sharing Failed',
                description: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsSharing(false);
        }
    };

    const resetForm = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setDepartmentFilter('all');
        setShareMessage('');
        setRequireApproval(false);
        setNotifyMembers(true);
        setExpirationDate('');
        setPermissions({
            canView: template.permissions?.canView || [],
            canEdit: template.permissions?.canEdit || [],
            canShare: template.permissions?.canShare || [],
            canDelete: template.permissions?.canDelete || []
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // ==================== Helper Functions ====================

    const getMemberPermissions = (memberId: string): TemplatePermission[] => {
        const memberPermissions: TemplatePermission[] = [];

        if (permissions.canView.includes(memberId)) memberPermissions.push('view');
        if (permissions.canEdit.includes(memberId)) memberPermissions.push('edit');
        if (permissions.canShare.includes(memberId)) memberPermissions.push('share');
        if (permissions.canDelete.includes(memberId)) memberPermissions.push('delete');

        return memberPermissions;
    };

    const getPermissionIcon = (permission: TemplatePermission) => {
        switch (permission) {
            case 'view': return <Eye className="w-4 h-4" />;
            case 'edit': return <Edit className="w-4 h-4" />;
            case 'share': return <Share2 className="w-4 h-4" />;
            case 'delete': return <Trash2 className="w-4 h-4" />;
        }
    };

    const getPermissionDescription = (permission: TemplatePermission) => {
        switch (permission) {
            case 'view': return 'Can view and use the template';
            case 'edit': return 'Can modify template content and settings';
            case 'share': return 'Can share template with other team members';
            case 'delete': return 'Can delete the template (use with caution)';
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

    const formatLastActive = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // ==================== Render ====================

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Share Template: {template.name}
                    </DialogTitle>
                    <DialogDescription>
                        Share this template with your team members and set appropriate permissions.
                        {template.isShared && (
                            <Badge variant="secondary" className="ml-2">
                                Currently Shared
                            </Badge>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="permissions" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Permissions
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Activity
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Permissions Tab */}
                    <TabsContent value="permissions" className="space-y-4 mt-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search team members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="agent">Agents</SelectItem>
                                    <SelectItem value="broker">Brokers</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="assistant">Assistants</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Permission Summary */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Permission Summary</h4>
                                <Badge variant="outline">
                                    {selectedMembersCount} member{selectedMembersCount !== 1 ? 's' : ''} selected
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    <span>View: {permissions.canView.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-green-500" />
                                    <span>Edit: {permissions.canEdit.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-purple-500" />
                                    <span>Share: {permissions.canShare.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                    <span>Delete: {permissions.canDelete.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Team Members List */}
                        <ScrollArea className="h-[300px] border rounded-lg">
                            <div className="p-4 space-y-3">
                                {filteredMembers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No team members found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                ) : (
                                    filteredMembers.map(member => {
                                        const memberPermissions = getMemberPermissions(member.id);

                                        return (
                                            <div key={member.id} className="border rounded-lg p-4 space-y-3">
                                                {/* Member Info */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                                            {member.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{member.name}</span>
                                                                <Badge variant="outline" className={cn("text-xs", getRoleColor(member.role))}>
                                                                    {member.role}
                                                                </Badge>
                                                                {!member.isActive && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Inactive
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {member.email} • {member.department}
                                                                {member.isActive && member.lastActive && (
                                                                    <span className="ml-2">• Active {formatLastActive(member.lastActive)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Permission Checkboxes */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {(['view', 'edit', 'share', 'delete'] as TemplatePermission[]).map(permission => (
                                                        <div key={permission} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${member.id}-${permission}`}
                                                                checked={memberPermissions.includes(permission)}
                                                                onCheckedChange={(checked) =>
                                                                    handlePermissionChange(member.id, permission, !!checked)
                                                                }
                                                                disabled={!member.isActive && permission !== 'view'}
                                                            />
                                                            <Label
                                                                htmlFor={`${member.id}-${permission}`}
                                                                className="flex items-center gap-1 text-sm cursor-pointer"
                                                            >
                                                                {getPermissionIcon(permission)}
                                                                {permission}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {/* Bulk Actions */}
                        {filteredMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-muted-foreground self-center">Bulk actions:</span>
                                {(['view', 'edit', 'share'] as TemplatePermission[]).map(permission => (
                                    <div key={permission} className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSelectAll(permission)}
                                            className="text-xs"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            All {permission}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeselectAll(permission)}
                                            className="text-xs"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            None {permission}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Sharing Activity</h4>
                            {analytics && (
                                <Badge variant="outline">
                                    {analytics.totalUsage} total uses
                                </Badge>
                            )}
                        </div>

                        <ScrollArea className="h-[400px] border rounded-lg">
                            <div className="p-4 space-y-4">
                                {MOCK_SHARING_ACTIVITY.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No activity yet</p>
                                        <p className="text-sm">Activity will appear here once the template is shared</p>
                                    </div>
                                ) : (
                                    MOCK_SHARING_ACTIVITY.map(activity => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                {activity.action === 'shared' && <Share2 className="w-4 h-4" />}
                                                {activity.action === 'accessed' && <Eye className="w-4 h-4" />}
                                                {activity.action === 'copied' && <Edit className="w-4 h-4" />}
                                                {activity.action === 'unshared' && <X className="w-4 h-4" />}
                                                {activity.action === 'permission_changed' && <Shield className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{activity.userName}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {activity.action.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {activity.details}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatLastActive(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6 mt-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="share-message">Share Message (Optional)</Label>
                                <Textarea
                                    id="share-message"
                                    placeholder="Add a message to explain why you're sharing this template..."
                                    value={shareMessage}
                                    onChange={(e) => setShareMessage(e.target.value)}
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-medium">Sharing Options</h4>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label>Notify team members</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Send email notifications when template is shared
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifyMembers}
                                        onCheckedChange={setNotifyMembers}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label>Require approval</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Require broker approval before sharing sensitive templates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={requireApproval}
                                        onCheckedChange={setRequireApproval}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                                    <Input
                                        id="expiration"
                                        type="date"
                                        value={expirationDate}
                                        onChange={(e) => setExpirationDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Template access will be automatically revoked after this date
                                    </p>
                                </div>
                            </div>

                            {requireApproval && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        This template will be submitted for broker approval before being shared with team members.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {selectedMembersCount > 0 && (
                            <span>
                                Ready to share with {selectedMembersCount} team member{selectedMembersCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleShare}
                            disabled={isSharing || selectedMembersCount === 0}
                            className="min-w-[100px]"
                        >
                            {isSharing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Sharing...
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Template
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}