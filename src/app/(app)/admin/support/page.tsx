'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Calendar,
    Filter,
    Send,
    XCircle,
} from 'lucide-react';
import {
    getSupportTickets,
    getSupportTicket,
    respondToTicket,
    updateTicketStatus,
} from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { SupportTicket } from '@/services/admin/support-ticket-service';

const STATUS_COLORS = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    waiting_user: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
};

const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const CATEGORY_LABELS = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    help: 'Help',
    billing: 'Billing',
    other: 'Other',
};

export default function SupportDashboardPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const { toast } = useToast();

    useEffect(() => {
        loadTickets();
    }, [statusFilter, priorityFilter]);

    async function loadTickets() {
        setIsLoading(true);
        try {
            const options: any = {};
            if (statusFilter !== 'all') {
                options.status = statusFilter;
            }
            if (priorityFilter !== 'all') {
                options.priority = priorityFilter;
            }

            const result = await getSupportTickets(options);

            if (result.success && result.data) {
                setTickets(result.data.tickets);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load support tickets',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load support tickets:', error);
            toast({
                title: 'Error',
                description: 'Failed to load support tickets',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleTicketClick(ticketId: string) {
        try {
            const result = await getSupportTicket(ticketId);

            if (result.success && result.data) {
                setSelectedTicket(result.data);
                setIsDialogOpen(true);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load ticket details',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load ticket details:', error);
            toast({
                title: 'Error',
                description: 'Failed to load ticket details',
                variant: 'destructive',
            });
        }
    }

    async function handleSendResponse() {
        if (!selectedTicket || !responseMessage.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await respondToTicket(selectedTicket.ticketId, responseMessage);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Response sent successfully',
                });

                // Reload ticket details
                const updatedTicket = await getSupportTicket(selectedTicket.ticketId);
                if (updatedTicket.success && updatedTicket.data) {
                    setSelectedTicket(updatedTicket.data);
                }

                setResponseMessage('');
                loadTickets(); // Refresh the list
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to send response',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to send response:', error);
            toast({
                title: 'Error',
                description: 'Failed to send response',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!selectedTicket) {
            return;
        }

        try {
            const result = await updateTicketStatus(
                selectedTicket.ticketId,
                newStatus as any,
                newStatus === 'closed' ? 'Ticket closed by admin' : undefined
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Ticket status updated successfully',
                });

                // Reload ticket details
                const updatedTicket = await getSupportTicket(selectedTicket.ticketId);
                if (updatedTicket.success && updatedTicket.data) {
                    setSelectedTicket(updatedTicket.data);
                }

                loadTickets(); // Refresh the list
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update ticket status',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to update ticket status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update ticket status',
                variant: 'destructive',
            });
        }
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Calculate ticket counts by status
    const ticketCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Support Dashboard</h2>
                    <p className="text-muted-foreground">
                        Manage user support tickets and provide assistance
                    </p>
                </div>
                <Button onClick={loadTickets} variant="outline" disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {/* Ticket Count Cards */}
            <div className="grid gap-6 md:grid-cols-5">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Open</CardTitle>
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{ticketCounts.open || 0}</div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{ticketCounts.in_progress || 0}</div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Waiting User</CardTitle>
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{ticketCounts.waiting_user || 0}</div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{ticketCounts.resolved || 0}</div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Closed</CardTitle>
                            <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{ticketCounts.closed || 0}</div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Filters */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle>Filters</CardTitle>
                                <CardDescription>Filter tickets by status and priority</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting_user">Waiting User</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label>Priority</Label>
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Tickets List */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle>Support Tickets</CardTitle>
                                <CardDescription>
                                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading tickets...
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No tickets found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.ticketId}
                                        className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                                        onClick={() => handleTicketClick(ticket.ticketId)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{ticket.subject}</h3>
                                                    <Badge className={STATUS_COLORS[ticket.status]}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge className={PRIORITY_COLORS[ticket.priority]}>
                                                        {ticket.priority}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {CATEGORY_LABELS[ticket.category]}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {ticket.userName}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(ticket.createdAt)}
                                                    </div>
                                                    {ticket.messages.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {ticket.messages.length} message
                                                            {ticket.messages.length !== 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Ticket Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selectedTicket.subject}
                                    <Badge className={STATUS_COLORS[selectedTicket.status]}>
                                        {selectedTicket.status.replace('_', ' ')}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span>From: {selectedTicket.userName} ({selectedTicket.userEmail})</span>
                                        <span>•</span>
                                        <span>{formatDate(selectedTicket.createdAt)}</span>
                                        <span>•</span>
                                        <Badge className={PRIORITY_COLORS[selectedTicket.priority]}>
                                            {selectedTicket.priority}
                                        </Badge>
                                        <Badge variant="outline">
                                            {CATEGORY_LABELS[selectedTicket.category]}
                                        </Badge>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Original Message */}
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Original Message:</p>
                                    <p className="text-sm">{selectedTicket.description}</p>
                                </div>

                                {/* Conversation */}
                                {selectedTicket.messages.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">Conversation:</p>
                                        {selectedTicket.messages.map((message) => (
                                            <div
                                                key={message.messageId}
                                                className={`p-3 rounded-lg ${message.authorRole === 'admin'
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                                                        : 'bg-muted mr-8'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium">
                                                        {message.authorName}
                                                        {message.authorRole === 'admin' && (
                                                            <Badge variant="outline" className="ml-2">
                                                                Admin
                                                            </Badge>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(message.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{message.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Response Form */}
                                {selectedTicket.status !== 'closed' && (
                                    <div className="space-y-3">
                                        <Label htmlFor="response">Your Response</Label>
                                        <Textarea
                                            id="response"
                                            placeholder="Type your response here..."
                                            value={responseMessage}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                )}

                                {/* Status Actions */}
                                <div className="flex items-center gap-2">
                                    <Label>Change Status:</Label>
                                    <Select
                                        value={selectedTicket.status}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="waiting_user">Waiting User</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Close
                                </Button>
                                {selectedTicket.status !== 'closed' && (
                                    <Button
                                        onClick={handleSendResponse}
                                        disabled={!responseMessage.trim() || isSubmitting}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? 'Sending...' : 'Send Response'}
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
