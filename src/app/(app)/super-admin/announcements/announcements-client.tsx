'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Megaphone,
    Plus,
    Calendar,
    User,
    Clock,
    Trash2,
    BarChart3,
    Eye,
    MoreHorizontal,
    Pencil
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnnouncementsData, type Announcement } from '@/hooks/use-announcements-data';
import { useAnnouncementOperations } from '@/hooks/use-announcement-operations';
import {
    getStatusColor,
    getPriorityColor,
    formatAnnouncementDate,
    formatAnnouncementTime,
    getTargetAudienceLabel
} from '@/lib/announcement-utils';

export function AnnouncementsClient() {
    const { announcements, loading, setAnnouncements } = useAnnouncementsData();
    const { deleteAnnouncement } = useAnnouncementOperations({ announcements, setAnnouncements });

    const handleCreate = () => {
        // TODO: Open create announcement dialog
        console.log('Create announcement');
    };

    const handleEdit = (announcement: Announcement) => {
        // TODO: Open edit announcement dialog
        console.log('Edit announcement:', announcement.announcementId);
    };

    const handlePreview = (announcement: Announcement) => {
        // TODO: Open preview modal
        console.log('Preview announcement:', announcement.announcementId);
    };

    const handleViewMetrics = (announcement: Announcement) => {
        // TODO: Open metrics modal
        console.log('View metrics for:', announcement.announcementId);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-blue-600" />
                                Announcement Management
                            </CardTitle>
                            <CardDescription>Create and manage platform-wide announcements</CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Announcement
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <EmptyState onCreateAnnouncement={handleCreate} />
                    ) : (
                        <AnnouncementsList
                            announcements={announcements}
                            onEdit={handleEdit}
                            onDelete={deleteAnnouncement}
                            onPreview={handlePreview}
                            onViewMetrics={handleViewMetrics}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Extracted Empty State Component
interface EmptyStateProps {
    onCreateAnnouncement: () => void;
}

function EmptyState({ onCreateAnnouncement }: EmptyStateProps) {
    return (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                <Megaphone className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
            <p className="text-muted-foreground mb-4">Create your first announcement to get started</p>
            <Button onClick={onCreateAnnouncement}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
            </Button>
        </div>
    );
}

// Extracted Announcements List Component
interface AnnouncementsListProps {
    announcements: Announcement[];
    onEdit: (announcement: Announcement) => void;
    onDelete: (announcement: Announcement) => Promise<boolean>;
    onPreview: (announcement: Announcement) => void;
    onViewMetrics: (announcement: Announcement) => void;
}

function AnnouncementsList({
    announcements,
    onEdit,
    onDelete,
    onPreview,
    onViewMetrics
}: AnnouncementsListProps) {
    return (
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <AnnouncementCard
                    key={announcement.announcementId}
                    announcement={announcement}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPreview={onPreview}
                    onViewMetrics={onViewMetrics}
                />
            ))}
        </div>
    );
}

// Extracted Announcement Card Component
interface AnnouncementCardProps {
    announcement: Announcement;
    onEdit: (announcement: Announcement) => void;
    onDelete: (announcement: Announcement) => Promise<boolean>;
    onPreview: (announcement: Announcement) => void;
    onViewMetrics: (announcement: Announcement) => void;
}

function AnnouncementCard({
    announcement,
    onEdit,
    onDelete,
    onPreview,
    onViewMetrics
}: AnnouncementCardProps) {
    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                            <Badge className={getStatusColor(announcement.status)}>
                                {announcement.status}
                            </Badge>
                            <Badge className={getPriorityColor(announcement.priority)}>
                                {announcement.priority}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">
                            {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{getTargetAudienceLabel(announcement.targetAudience)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatAnnouncementDate(announcement.scheduledFor)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatAnnouncementTime(announcement.scheduledFor)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPreview(announcement)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onViewMetrics(announcement)}>
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Metrics
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onEdit(announcement)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Announcement
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(announcement)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Announcement
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            {announcement.metrics && (
                <AnnouncementMetrics metrics={announcement.metrics} />
            )}
        </Card>
    );
}

// Extracted Metrics Component
interface AnnouncementMetricsProps {
    metrics: NonNullable<Announcement['metrics']>;
}

function AnnouncementMetrics({ metrics }: AnnouncementMetricsProps) {
    return (
        <CardContent className="pt-0">
            <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.sent}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{metrics.delivered}</div>
                    <div className="text-xs text-muted-foreground">Delivered</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{metrics.opened}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{metrics.clicked}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                </div>
            </div>
        </CardContent>
    );
}