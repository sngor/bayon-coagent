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
import { useToast } from "@/hooks/use-toast";
import { createAnnouncementAction, getAnnouncementsAction } from '@/features/admin/actions/admin-actions';
import { Megaphone, Plus, Calendar, User, AlertCircle } from 'lucide-react';

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    useEffect(() => {
        loadAnnouncements();
    }, []);

    async function loadAnnouncements() {
        try {
            setLoading(true);
            const result = await getAnnouncementsAction();
            if (result.message === 'success') {
                setAnnouncements(result.data || []);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load announcements",
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
        if (!title.trim() || !message.trim()) {
            toast({
                title: "Error",
                description: "Title and message are required",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await createAnnouncementAction(title, message, priority);

            if (result.message === 'success') {
                toast({
                    title: "Success",
                    description: "Announcement created successfully",
                });
                setIsCreateOpen(false);
                setTitle('');
                setMessage('');
                setPriority('medium');
                loadAnnouncements();
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to create announcement",
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default'; // blue-ish usually
            case 'low': return 'secondary';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Announcements</h2>
                    <p className="text-muted-foreground">Broadcast messages to your team members</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                            <DialogDescription>
                                Send a message to all members of your team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="title" className="text-sm font-medium">Title</label>
                                <Input
                                    id="title"
                                    placeholder="e.g., System Maintenance"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - Informational</SelectItem>
                                        <SelectItem value="medium">Medium - Important</SelectItem>
                                        <SelectItem value="high">High - Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="message" className="text-sm font-medium">Message</label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your announcement here..."
                                    className="h-32"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateAnnouncement} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Announcement'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

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
                                Create your first announcement to broadcast updates, news, or alerts to your team.
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
                            <Card key={announcement.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-xl">{announcement.title}</CardTitle>
                                                <Badge variant={getPriorityColor(announcement.priority) as any}>
                                                    {announcement.priority}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{announcement.senderName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(announcement.createdAt).toLocaleDateString()} at {new Date(announcement.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{announcement.message}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
