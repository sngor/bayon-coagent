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

interface Announcement {
    announcementId: string;
    title: string;
    content: string;
    richContent?: string;
    targetAudience: 'all' | 'role' | 'custom';
    targetValue?: string[];
    deliveryMethod: 'email' | 'in_app' | 'both';
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    scheduledFor?: string;
    createdAt: string;
    sentAt?: string;
    delivered?: number;
    opened?: number;
    clicked?: number;
}

export default function SuperAdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            // Mock data for now - replace with actual API call
            const mockAnnouncements: Announcement[] = [
                {
                    announcementId: '1',
                    title: 'New Feature Release: AI-Powered Market Analysis',
                    content: 'We are excited to announce the launch of our new AI-powered market analysis feature...',
                    targetAudience: 'all',
                    deliveryMethod: 'both',
                    status: 'sent',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    sentAt: new Date(Date.now() - 82800000).toISOString(),
                    delivered: 1247,
                    opened: 892,
                    clicked: 234
                },
                {
                    announcementId: '2',
                    title: 'Scheduled Maintenance Window',
                    content: 'We will be performing scheduled maintenance on Sunday, December 15th from 2:00 AM to 4:00 AM EST...',
                    targetAudience: 'all',
                    deliveryMethod: 'email',
                    status: 'scheduled',
                    scheduledFor: new Date(Date.now() + 432000000).toISOString(),
                    createdAt: new Date(Date.now() - 3600000).toISOString()
                }
            ];

            const filtered = statusFilter === 'all'
                ? mockAnnouncements
                : mockAnnouncements.filter(a => a.status === statusFilter);

            setAnnouncements(filtered);
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

            // Mock creation - replace with actual API call
            const newAnnouncement: Announcement = {
                announcementId: Date.now().toString(),
                title,
                content,
                richContent: richContent || undefined,
                targetAudience,
                targetValue: targetAudience === 'role' ? targetRoles :
                    targetAudience === 'custom' ? targetUserIds.split(',').map(id => id.trim()).filter(Boolean) :
                        undefined,
                deliveryMethod,
                status: isScheduled ? 'scheduled' : 'draft',
                scheduledFor: isScheduled && scheduledDate && scheduledTime ?
                    new Date(`${scheduledDate}T${scheduledTime}`).toISOString() :
                    undefined,
                createdAt: new Date().toISOString()
            };

            setAnnouncements(prev => [newAnnouncement, ...prev]);

            toast({
                title: "Success",
                description: isScheduled ? "Announcement scheduled successfully" : "Announcement created successfully",
            });
            resetForm();
            setIsCreateOpen(false);
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
            // Mock sending - replace with actual API call
            setAnnouncements(prev => prev.map(a =>
                a.announcementId === announcementId
                    ? { ...a, status: 'sent' as const, sentAt: new Date().toISOString(), delivered: 1247 }
                    : a
            ));

            toast({
                title: "Success",
                description: "Announcement sent to 1247 users",
            });
        } catch (error) {
            console.error('Failed to send announcement:', error);
            toast({
                title: "Error",
                description: "Failed to send announcement",
                variant: "destructive"
            });
        }
    }

    async function handleDelete(announcementId: string) {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            setAnnouncements(prev => prev.filter(a => a.announcementId !== announcementId));
            toast({
                title: "Success",
                description: "Announcement deleted",
            });
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            toast({
                title: "Error",
                description: "Failed to delete announcement",
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Announcements</h1>
                    <p className="text-muted-foreground">
                        Manage platform-wide announcements and notifications
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Announcement</DialogTitle>
                            <DialogDescription>
                                Send announcements to users via email and/or in-app notifications
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Announcement title"
                                />
                            </div>

                            <div>
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Announcement content"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <Label>Target Audience</Label>
                                <RadioGroup value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="all" />
                                        <Label htmlFor="all">All Users</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="role" id="role" />
                                        <Label htmlFor="role">Specific Roles</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <Label htmlFor="custom">Custom User List</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Delivery Method</Label>
                                <Select value={deliveryMethod} onValueChange={(value: any) => setDeliveryMethod(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email Only</SelectItem>
                                        <SelectItem value="in_app">In-App Only</SelectItem>
                                        <SelectItem value="both">Both Email & In-App</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="scheduled"
                                    checked={isScheduled}
                                    onCheckedChange={(checked) => setIsScheduled(!!checked)}
                                />
                                <Label htmlFor="scheduled">Schedule for later</Label>
                            </div>

                            {isScheduled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="time">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateAnnouncement} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : isScheduled ? 'Schedule' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Announcements</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                            <p className="text-muted-foreground">Create your first announcement to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    announcements.map((announcement) => (
                        <Card key={announcement.announcementId}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            Created {new Date(announcement.createdAt).toLocaleDateString()}
                                            {announcement.scheduledFor && (
                                                <>
                                                    <Clock className="h-4 w-4 ml-2" />
                                                    Scheduled for {new Date(announcement.scheduledFor).toLocaleString()}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(announcement.status)}
                                        <div className="flex items-center gap-1">
                                            {getDeliveryMethodIcon(announcement.deliveryMethod)}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {announcement.content.length > 200
                                        ? `${announcement.content.substring(0, 200)}...`
                                        : announcement.content}
                                </p>

                                {announcement.status === 'sent' && (
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{announcement.delivered || 0}</div>
                                            <div className="text-xs text-muted-foreground">Delivered</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{announcement.opened || 0}</div>
                                            <div className="text-xs text-muted-foreground">Opened</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{announcement.clicked || 0}</div>
                                            <div className="text-xs text-muted-foreground">Clicked</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        Target: {announcement.targetAudience === 'all' ? 'All Users' :
                                            announcement.targetAudience === 'role' ? 'Specific Roles' : 'Custom List'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {announcement.status === 'draft' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSendNow(announcement.announcementId)}
                                            >
                                                <Send className="h-4 w-4 mr-1" />
                                                Send Now
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(announcement.announcementId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    ); assName = "space-y-8" >
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Announcements</h2>
                <p className="text-muted-foreground">Create and manage platform-wide announcements</p>
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
                        <DialogTitle>Create Platform Announcement</DialogTitle>
                        <DialogDescription>
                            Compose and schedule announcements for all platform users
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
                                placeholder="Announcement content..."
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
                                            id="role-agent"
                                            checked={targetRoles.includes('agent')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setTargetRoles([...targetRoles, 'agent']);
                                                } else {
                                                    setTargetRoles(targetRoles.filter(r => r !== 'agent'));
                                                }
                                            }}
                                        />
                                        <Label htmlFor="role-agent" className="font-normal cursor-pointer">Agents</Label>
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
                                            checked={targetRoles.includes('super_admin')}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setTargetRoles([...targetRoles, 'super_admin']);
                                                } else {
                                                    setTargetRoles(targetRoles.filter(r => r !== 'super_admin'));
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

    {/* Status Filter */ }
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

    {/* Announcements List */ }
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
                        Create your first platform announcement to communicate with all users
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
                                    {announcement.status === 'sent' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                        >
                                            <BarChart3 className="h-4 w-4 mr-1" />
                                            Stats
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDelete(announcement.announcementId)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {announcement.content.length > 200
                                    ? `${announcement.content.substring(0, 200)}...`
                                    : announcement.content}
                            </p>
                            {announcement.status === 'sent' && announcement.delivered && (
                                <div className="flex gap-6 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                        <span>{announcement.delivered} delivered</span>
                                    </div>
                                    {announcement.opened && (
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-4 w-4 text-green-600" />
                                            <span>{announcement.opened} opened</span>
                                        </div>
                                    )}
                                    {announcement.clicked && (
                                        <div className="flex items-center gap-1">
                                            <MousePointerClick className="h-4 w-4 text-purple-600" />
                                            <span>{announcement.clicked} clicked</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
    );
}