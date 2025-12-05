'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import {
    createAnnouncementAction,
    getAnnouncementsAction,
    sendAnnouncementAction,
    cancelAnnouncementAction,
    deleteAnnouncementAction,
    getAnnouncementStatsAction,
} from '@/features/admin/actions/admin-actions';
import {
    Megaphone,
    Plus,
    Calendar,
    User,
    Mail,
    Bell,
    Send,
    Clock,
    Trash2,
    BarChart3,
    Eye,
    MousePointerClick,
    XCircle,
    CheckCircle,
} from 'lucide-react';
import { Announcement, AnnouncementStats } from '@/services/admin/announcement-service';

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [announcementStats, setAnnouncementStats] = useState<AnnouncementStats | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent' | 'failed'>('all');
    const { toast } = useToast();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [richContent, setRichContent] = useState('');
    const [targetAudience, setTargetAudience] = useState<'all' | 'role' | 'custom'>('all');
    const [targetRoles, setTargetRoles] = useState<string[]>([]);
    const [targetUserIds, setTargetUserIds] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'in_app' | 'both'>('both');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    useEffect(() => {
        loadAnnouncements();
    }, [statusFilter]);

    async function loadAnnouncements() {
        try {
            setLoading(true);
            const result = await getAnnouncementsAction({
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: 50,
            });

            if (result.success && result.data) {
                setAnnouncements(result.data.announcements);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to load announcements",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load announcements:', error);
            toast({
                title: "Error",
                description: "Failed to load announcements",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAnnouncement() {
        if (!title.trim() || !content.trim()) {
            toast({
                title: "Error",
                description: "Title and content are required",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare target value
            let targetValue: string[] | undefined;
            if (targetAudience === 'role') {
                targetValue = targetRoles;
            } else if (targetAudience === 'custom') {
                targetValue = targetUserIds.split(',').map(id => id.trim()).filter(Boolean);
            }

            // Prepare scheduled time
            let scheduledFor: string | undefined;
            if (isScheduled && scheduledDate && scheduledTime) {
                scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
            }

            const result = await createAnnouncementAction(
                title,
                content,
                richContent || undefined,
                targetAudience,
                targetValue,
                deliveryMethod,
                scheduledFor
            );

            if (result.success) {
                toast({
                    title: "Success",
                    description: isScheduled ? "Announcement scheduled successfully" : "Announcement created successfully",
                });
                resetForm();
                setIsCreateOpen(false);
                loadAnnouncements();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create announcement",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to create announcement:', error);
            toast({
                title: "Error",
                description: "Failed to create announcement",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSendNow(announcementId: string) {
        try {
            const result = await sendAnnouncementAction(announcementId);

            if (result.success && result.data) {
                toast({
                    title: "Success",
                    description: `Announcement sent to ${result.data.delivered} users`,
                });
                loadAnnouncements();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to send announcement",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to send announcement:', error);
            toast({
                title: "Error",
                description: "Failed to send announcement",
                variant: "destructive"
            });
        }
    }

    async function handleCancelScheduled(announcementId: string) {
        try {
            const result = await cancelAnnouncementAction(announcementId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Scheduled announcement cancelled",
                });
                loadAnnouncements();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to cancel announcement",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to cancel announcement:', error);
            toast({
                title: "Error",
                description: "Failed to cancel announcement",
                variant: "destructive"
            });
        }
    }

    async function handleDelete(announcementId: string) {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            const result = await deleteAnnouncementAction(announcementId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Announcement deleted",
                });
                loadAnnouncements();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete announcement",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            toast({
                title: "Error",
                description: "Failed to delete announcement",
                variant: "destructive"
            });
        }
    }

    async function handleViewStats(announcementId: string) {
        try {
            const result = await getAnnouncementStatsAction(announcementId);

            if (result.success && result.data) {
                setAnnouncementStats(result.data);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to load stats",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            toast({
                title: "Error",
                description: "Failed to load stats",
                variant: "destructive"
            });
        }
    }

    function resetForm() {
        setTitle('');
        setContent('');
        setRichContent('');
        setTargetAudience('all');
        setTargetRoles([]);
        setTargetUserIds('');
        setDeliveryMethod('both');
        setIsScheduled(false);
        setScheduledDate('');
        setScheduledTime('');
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'scheduled':
                return <Badge variant="default">Scheduled</Badge>;
            case 'sent':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getDeliveryMethodIcon = (method: string) => {
        switch (method) {
            case 'email':
                return <Mail className="h-4 w-4" />;
            case 'in_app':
                return <Bell className="h-4 w-4" />;
            case 'both':
                return (
                    <>
                        <Mail className="h-4 w-4" />
                        <Bell className="h-4 w-4" />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
                    <p className="text-muted-foreground">Create and manage platform announcements</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                            <DialogDescription>
                                Compose and schedule announcements for your users
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., New Feature Release"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Content */}
                            <div className="grid gap-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Plain text content..."
                                    className="h-24"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>

                            {/* Rich Content */}
                            <div className="grid gap-2">
                                <Label htmlFor="richContent">Rich Content (HTML)</Label>
                                <Textarea
                                    id="richContent"
                                    placeholder="<p>HTML formatted content...</p>"
                                    className="h-24 font-mono text-sm"
                                    value={richContent}
                                    onChange={(e) => setRichContent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional: Add HTML formatting for email delivery
                                </p>
                            </div>

                            {/* Target Audience */}
                            <div className="grid gap-3">
                                <Label>Target Audience *</Label>
                                <RadioGroup value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="all" />
                                        <Label htmlFor="all" className="font-normal cursor-pointer">All Users</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="role" id="role" />
                                        <Label htmlFor="role" className="font-normal cursor-pointer">Specific Roles</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <Label htmlFor="custom" className="font-normal cursor-pointer">Custom User List</Label>
                                    </div>
                                </RadioGroup>

                                {targetAudience === 'role' && (
                                    <div className="ml-6 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="role-user"
                                                checked={targetRoles.includes('user')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setTargetRoles([...targetRoles, 'user']);
                                                    } else {
                                                        setTargetRoles(targetRoles.filter(r => r !== 'user'));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="role-user" className="font-normal cursor-pointer">Users</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="role-admin"
                                                checked={targetRoles.includes('admin')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setTargetRoles([...targetRoles, 'admin']);
                                                    } else {
                                                        setTargetRoles(targetRoles.filter(r => r !== 'admin'));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="role-admin" className="font-normal cursor-pointer">Admins</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="role-superadmin"
                                                checked={targetRoles.includes('superadmin')}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setTargetRoles([...targetRoles, 'superadmin']);
                                                    } else {
                                                        setTargetRoles(targetRoles.filter(r => r !== 'superadmin'));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="role-superadmin" className="font-normal cursor-pointer">Super Admins</Label>
                                        </div>
                                    </div>
                                )}

                                {targetAudience === 'custom' && (
                                    <div className="ml-6">
                                        <Input
                                            placeholder="user-id-1, user-id-2, user-id-3"
                                            value={targetUserIds}
                                            onChange={(e) => setTargetUserIds(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Enter comma-separated user IDs
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Method */}
                            <div className="grid gap-2">
                                <Label htmlFor="deliveryMethod">Delivery Method *</Label>
                                <Select value={deliveryMethod} onValueChange={(v: any) => setDeliveryMethod(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email Only</SelectItem>
                                        <SelectItem value="in_app">In-App Only</SelectItem>
                                        <SelectItem value="both">Both Email and In-App</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Scheduling */}
                            <div className="grid gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="schedule"
                                        checked={isScheduled}
                                        onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                                    />
                                    <Label htmlFor="schedule" className="font-normal cursor-pointer">
                                        Schedule for later
                                    </Label>
                                </div>

                                {isScheduled && (
                                    <div className="ml-6 grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="scheduledDate">Date</Label>
                                            <Input
                                                id="scheduledDate"
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="scheduledTime">Time</Label>
                                            <Input
                                                id="scheduledTime"
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                resetForm();
                                setIsCreateOpen(false);
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateAnnouncement} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : isScheduled ? 'Schedule Announcement' : 'Create Announcement'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={statusFilter === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('draft')}
                >
                    Drafts
                </Button>
                <Button
                    variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('scheduled')}
                >
                    Scheduled
                </Button>
                <Button
                    variant={statusFilter === 'sent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('sent')}
                >
                    Sent
                </Button>
                <Button
                    variant={statusFilter === 'failed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('failed')}
                >
                    Failed
                </Button>
            </div>

            {/* Announcements List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <Megaphone className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                            <p className="text-muted-foreground text-center max-w-sm mb-6">
                                Create your first announcement to communicate with your users
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Announcement
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <Card key={announcement.announcementId}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="text-xl">{announcement.title}</CardTitle>
                                                {getStatusBadge(announcement.status)}
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    {getDeliveryMethodIcon(announcement.deliveryMethod)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>
                                                        {announcement.targetAudience === 'all' ? 'All Users' :
                                                            announcement.targetAudience === 'role' ? `Roles: ${announcement.targetValue?.join(', ')}` :
                                                                `${announcement.targetValue?.length || 0} users`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {announcement.scheduledFor
                                                            ? `Scheduled: ${new Date(announcement.scheduledFor).toLocaleString()}`
                                                            : `Created: ${new Date(announcement.createdAt).toLocaleString()}`}
                                                    </span>
                                                </div>
                                                {announcement.sentAt && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Sent: {new Date(announcement.sentAt).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {announcement.status === 'draft' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSendNow(announcement.announcementId)}
                                                >
                                                    <Send className="h-4 w-4 mr-1" />
                                                    Send Now
                                                </Button>
                                            )}
                                            {announcement.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCancelScheduled(announcement.announcementId)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            )}
                                            {announcement.status === 'sent' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewStats(announcement.announcementId)}
                                                >
                                                    <BarChart3 className="h-4 w-4 mr-1" />
                                                    Stats
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(announcement.announcementId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>

                                    {announcement.status === 'sent' && (
                                        <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Sent</div>
                                                <div className="text-lg font-semibold">{announcement.tracking.sent}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Delivered</div>
                                                <div className="text-lg font-semibold">{announcement.tracking.delivered}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    Opened
                                                </div>
                                                <div className="text-lg font-semibold">{announcement.tracking.opened}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground flex items-center gap-1">
                                                    <MousePointerClick className="h-3 w-3" />
                                                    Clicked
                                                </div>
                                                <div className="text-lg font-semibold">{announcement.tracking.clicked}</div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Dialog */}
            {announcementStats && (
                <Dialog open={!!announcementStats} onOpenChange={() => setAnnouncementStats(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Announcement Statistics</DialogTitle>
                            <DialogDescription>
                                Detailed metrics for this announcement
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Sent</CardDescription>
                                        <CardTitle className="text-3xl">{announcementStats.sent}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Delivered</CardDescription>
                                        <CardTitle className="text-3xl">{announcementStats.delivered}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Opened</CardDescription>
                                        <CardTitle className="text-3xl">{announcementStats.opened}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {announcementStats.openRate.toFixed(1)}% open rate
                                        </p>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Clicked</CardDescription>
                                        <CardTitle className="text-3xl">{announcementStats.clicked}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {announcementStats.clickRate.toFixed(1)}% click rate
                                        </p>
                                    </CardHeader>
                                </Card>
                            </div>
                            {announcementStats.failed > 0 && (
                                <Card className="border-destructive">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-destructive">Failed Deliveries</CardDescription>
                                        <CardTitle className="text-3xl text-destructive">{announcementStats.failed}</CardTitle>
                                    </CardHeader>
                                </Card>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
