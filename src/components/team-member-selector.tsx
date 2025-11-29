'use client';

/**
 * Team Member Selector Component
 * 
 * Reusable component for selecting team members with search, filtering,
 * and role-based access control. Used in template sharing and other
 * collaborative features.
 * 
 * Requirements:
 * - 10.2: Team member selection with search and filtering capabilities
 * - 10.3: Role-based access control
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Search,
    Users,
    Filter,
    CheckCircle,
    XCircle,
    UserCheck,
    UserX,
    Plus,
    Minus
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

// ==================== Types ====================

export interface TeamMember {
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

export interface TeamMemberSelectorProps {
    members: TeamMember[];
    selectedMemberIds: string[];
    onSelectionChange: (memberIds: string[]) => void;
    excludeMembers?: string[];
    allowMultiple?: boolean;
    showFilters?: boolean;
    showBulkActions?: boolean;
    placeholder?: string;
    emptyMessage?: string;
    className?: string;
}

// ==================== Component ====================

export function TeamMemberSelector({
    members,
    selectedMemberIds,
    onSelectionChange,
    excludeMembers = [],
    allowMultiple = true,
    showFilters = true,
    showBulkActions = true,
    placeholder = "Search team members...",
    emptyMessage = "No team members found",
    className
}: TeamMemberSelectorProps) {
    // ==================== State ====================

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // ==================== Data Processing ====================

    const availableMembers = useMemo(() => {
        return members.filter(member => !excludeMembers.includes(member.id));
    }, [members, excludeMembers]);

    const filteredMembers = useMemo(() => {
        return availableMembers.filter(member => {
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

            // Status filter
            if (statusFilter === 'active' && !member.isActive) {
                return false;
            }
            if (statusFilter === 'inactive' && member.isActive) {
                return false;
            }

            return true;
        });
    }, [availableMembers, searchQuery, roleFilter, departmentFilter, statusFilter]);

    const departments = useMemo(() => {
        const depts = new Set(availableMembers.map(m => m.department).filter(Boolean));
        return Array.from(depts);
    }, [availableMembers]);

    // ==================== Event Handlers ====================

    const handleMemberToggle = (memberId: string) => {
        if (allowMultiple) {
            const newSelection = selectedMemberIds.includes(memberId)
                ? selectedMemberIds.filter(id => id !== memberId)
                : [...selectedMemberIds, memberId];
            onSelectionChange(newSelection);
        } else {
            onSelectionChange(selectedMemberIds.includes(memberId) ? [] : [memberId]);
        }
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredMembers.map(m => m.id);
        const newSelection = [...new Set([...selectedMemberIds, ...allFilteredIds])];
        onSelectionChange(newSelection);
    };

    const handleDeselectAll = () => {
        const filteredIds = new Set(filteredMembers.map(m => m.id));
        const newSelection = selectedMemberIds.filter(id => !filteredIds.has(id));
        onSelectionChange(newSelection);
    };

    const handleClearAll = () => {
        onSelectionChange([]);
    };

    // ==================== Helper Functions ====================

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

    const getSelectedCount = () => {
        return selectedMemberIds.length;
    };

    const getFilteredSelectedCount = () => {
        const filteredIds = new Set(filteredMembers.map(m => m.id));
        return selectedMemberIds.filter(id => filteredIds.has(id)).length;
    };

    // ==================== Render ====================

    return (
        <div className={cn("space-y-4", className)}>
            {/* Search and Filters */}
            {showFilters && (
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[140px]">
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

                        {departments.length > 0 && (
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept || ''}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Selection Summary */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {getSelectedCount()} of {availableMembers.length} selected
                    </span>
                    {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' ? (
                        <Badge variant="outline" className="text-xs">
                            {getFilteredSelectedCount()} in current filter
                        </Badge>
                    ) : null}
                </div>

                {/* Bulk Actions */}
                {showBulkActions && allowMultiple && filteredMembers.length > 0 && (
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className="text-xs"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Select All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            className="text-xs"
                        >
                            <Minus className="w-3 h-3 mr-1" />
                            Deselect All
                        </Button>
                        {getSelectedCount() > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAll}
                                className="text-xs text-red-600 hover:text-red-700"
                            >
                                <UserX className="w-3 h-3 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Members List */}
            <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-3">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{emptyMessage}</p>
                            {(searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
                                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                            )}
                        </div>
                    ) : (
                        filteredMembers.map(member => {
                            const isSelected = selectedMemberIds.includes(member.id);

                            return (
                                <div
                                    key={member.id}
                                    className={cn(
                                        "border rounded-lg p-3 cursor-pointer transition-colors",
                                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                                    )}
                                    onClick={() => handleMemberToggle(member.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {allowMultiple ? (
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by parent click
                                                    className="pointer-events-none"
                                                />
                                            ) : (
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                                                )}>
                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                            )}

                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{member.name}</span>
                                                    <Badge variant="outline" className={cn("text-xs", getRoleColor(member.role))}>
                                                        {member.role}
                                                    </Badge>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                {member.isActive ? (
                                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="w-3 h-3 text-gray-400" />
                                                                )}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    {member.isActive
                                                                        ? `Active - Last seen ${member.lastActive ? formatLastActive(member.lastActive) : 'recently'}`
                                                                        : 'Inactive'
                                                                    }
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {member.email}
                                                    {member.department && (
                                                        <span className="ml-2">• {member.department}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <UserCheck className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}