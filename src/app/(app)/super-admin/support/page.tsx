'use client';

import { useState } from 'react';
import { useSupportTickets } from '@/hooks/use-support-tickets';
import { SupportTicketList } from '@/components/admin/support-ticket-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Calendar,
    Reply,
    Archive,
    Trash2,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Mail,
    Phone,
    ExternalLink,
    Tag
} from 'lucide-react';

interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
    userEmail: string;
    userName: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
    responses: TicketResponse[];
}

interface TicketResponse {
    id: string;
    message: string;
    isFromUser: boolean;
    authorName: string;
    createdAt: string;
}

export default function SuperAdminSupportPage() {
    const {
        filteredTickets,
        selectedTicket,
        filters,
        loading,
        error,
        ticketStats,
        setSelectedTicket,
        updateFilters,
        clearFilters,
        updateTicketStatus: handleUpdateStatus,
        assignTicket: handleAssignTicket,
        sendResponse,
        refreshTickets
    } = useSupportTickets();

    const [responseMessage, setResponseMessage] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadTickets();
    }, [statusFilter, priorityFilter, categoryFilter]);

    async function loadTickets() {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockTickets: SupportTicket[] = [
                {
                    id: '1',
                    subject: 'Unable to generate AI content',
                    description: 'When I try to use the AI content generation feature, I get an error message saying "Service temporarily unavailable". This has been happening for the past 2 hours.',
                    status: 'open',
                    priority: 'high',
                    category: 'technical',
                    userEmail: 'john.doe@example.com',
                    userName: 'John Doe',
                    userId: 'user-123',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    updatedAt: new Date(Date.now() - 7200000).toISOString(),
                    responses: []
                },
                {
                    id: '2',
                    subject: 'Billing question about subscription',
                    description: 'I was charged twice for my monthly subscription. Can you please help me understand why this happened and process a refund for the duplicate charge?',
                    status: 'in_progress',
                    priority: 'medium',
                    category: 'billing',
                    userEmail: 'sarah.smith@realty.com',
                    userName: 'Sarah Smith',
                    userId: 'user-456',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    updatedAt: new Date(Date.now() - 3600000).toISOString(),
                    assignedTo: 'Admin User',
                    responses: [
                        {
                            id: 'r1',
                            message: 'Hi Sarah, I\'m looking into your billing issue. I can see the duplicate charge and will process a refund within 24 hours.',
                            isFromUser: false,
                            authorName: 'Admin User',
                            createdAt: new Date(Date.now() - 3600000).toISOString()
                        }
                    ]
                },
                {
                    id: '3',
                    subject: 'Feature request: Export to PDF',
                    description: 'It would be great if we could export our generated content directly to PDF format. This would save us a lot of time in our workflow.',
                    status: 'resolved',
                    priority: 'low',
                    category: 'feature_request',
                    userEmail: 'mike.johnson@homes.com',
                    userName: 'Mike Johnson',
                    userId: 'user-789',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    updatedAt: new Date(Date.now() - 86400000).toISOString(),
                    assignedTo: 'Product Team',
                    responses: [
                        {
                            id: 'r2',
                            message: 'Thank you for the suggestion! We\'ve added this to our product roadmap and will consider it for a future release.',
                            isFromUser: false,
                            authorName: 'Product Team',
                            createdAt: new Date(Date.now() - 86400000).toISOString()
                        }
                    ]
                }
            ];

            let filtered = mockTickets;

            if (statusFilter !== 'all') {
                filtered = filtered.filter(t => t.status === statusFilter);
            }
            if (priorityFilter !== 'all') {
                filtered = filtered.filter(t => t.priority === priorityFilter);
            }
            if (categoryFilter !== 'all') {
                filtered = filtered.filter(t => t.category === categoryFilter);
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(t =>
                    t.subject.toLowerCase().includes(query) ||
                    t.description.toLowerCase().includes(query) ||
                    t.userEmail.toLowerCase().includes(query) ||
                    t.userName.toLowerCase().includes(query)
                );
            }

            setTickets(filtered);
        } catch (error) {
            console.error('Failed to load tickets:', error);
            toast({
                title: "Error",
                description: "Failed to load support tickets",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateStatus(ticketId: string, newStatus: SupportTicket['status']) {
        try {
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
                    : t
            ));

            toast({
                title: "Status Updated",
                description: `Ticket status changed to ${newStatus}`,
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            toast({
                title: "Error",
                description: "Failed to update ticket status",
                variant: "destructive"
            });
        }
    }

    async function handleAssignTicket(ticketId: string, assignee: string) {
        try {
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, assignedTo: assignee, updatedAt: new Date().toISOString() }
                    : t
            ));

            toast({
                title: "Ticket Assigned",
                description: `Ticket assigned to ${assignee}`,
            });
        } catch (error) {
            console.error('Failed to assign ticket:', error);
            toast({
                title: "Error",
                description: "Failed to assign ticket",
                variant: "destructive"
            });
        }
    }

    async function handleSendResponse() {
        if (!selectedTicket || !responseMessage.trim()) return;

        try {
            setIsResponding(true);

            const newResponse: TicketResponse = {
                id: Date.now().toString(),
                message: responseMessage,
                isFromUser: false,
                authorName: 'Super Admin',
                createdAt: new Date().toISOString()
            };

            setTickets(prev => prev.map(t =>
                t.id === selectedTicket.id
                    ? {
                        ...t,
                        responses: [...t.responses, newResponse],
                        status: 'in_progress' as const,
                        updatedAt: new Date().toISOString()
                    }
                    : t
            ));

            setSelectedTicket(prev => prev ? {
                ...prev,
                responses: [...prev.responses, newResponse],
                status: 'in_progress',
                updatedAt: new Date().toISOString()
            } : null);

            setResponseMessage('');

            toast({
                title: "Response Sent",
                description: "Your response has been sent to the user",
            });
        } catch (error) {
            console.error('Failed to send response:', error);
            toast({
                title: "Error",
                description: "Failed to send response",
                variant: "destructive"
            });
        } finally {
            setIsResponding(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="destructive">Open</Badge>;
            case 'in_progress':
                return <Badge variant="default">In Progress</Badge>;
            case 'resolved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
            case 'closed':
                return <Badge variant="secondary">Closed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge variant="destructive">Urgent</Badge>;
            case 'high':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
            case 'medium':
                return <Badge variant="default">Medium</Badge>;
            case 'low':
                return <Badge variant="secondary">Low</Badge>;
            default:
                return <Badge variant="secondary">{priority}</Badge>;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'technical':
                return <AlertTriangle className="h-4 w-4" />;
            case 'billing':
                return <TrendingUp className="h-4 w-4" />;
            case 'feature_request':
                return <BarChart3 className="h-4 w-4" />;
            case 'bug_report':
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Support Management</h2>
                    <p className="text-muted-foreground">Manage and respond to user support tickets</p>
                </div>
                <Button variant="outline" onClick={loadTickets}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ticketStats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{ticketStats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{ticketStats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{ticketStats.urgent}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="tickets" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="tickets">All Tickets</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="tickets" className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search tickets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Priorities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="feature_request">Feature Request</SelectItem>
                                        <SelectItem value="bug_report">Bug Report</SelectItem>
                                        <SelectItem value="general">General</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setPriorityFilter('all');
                                    setCategoryFilter('all');
                                }}>
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tickets List */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Tickets List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Support Tickets</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading...' : `${tickets.length} tickets found`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-8">Loading tickets...</div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No tickets found matching your criteria</p>
                                    </div>
                                ) : (
                                    tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedTicket?.id === ticket.id ? 'bg-muted border-primary' : ''
                                                }`}
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(ticket.category)}
                                                    <h4 className="font-medium text-sm">{ticket.subject}</h4>
                                                </div>
                                                <div className="flex gap-1">
                                                    {getStatusBadge(ticket.status)}
                                                    {getPriorityBadge(ticket.priority)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{ticket.userName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {ticket.assignedTo && (
                                                <div className="mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        Assigned to {ticket.assignedTo}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Ticket Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Details</CardTitle>
                                <CardDescription>
                                    {selectedTicket ? 'View and respond to ticket' : 'Select a ticket to view details'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedTicket ? (
                                    <div className="space-y-6">
                                        {/* Ticket Info */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                                                <div className="flex gap-2">
                                                    {getStatusBadge(selectedTicket.status)}
                                                    {getPriorityBadge(selectedTicket.priority)}
                                                </div>
                                            </div>

                                            <div className="grid gap-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">From:</span>
                                                    <span>{selectedTicket.userName} ({selectedTicket.userEmail})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Category:</span>
                                                    <span className="capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Created:</span>
                                                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Updated:</span>
                                                    <span>{new Date(selectedTicket.updatedAt).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-sm">{selectedTicket.description}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-wrap">
                                            <Select
                                                value={selectedTicket.status}
                                                onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value as SupportTicket['status'])}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                    <SelectItem value="closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAssignTicket(selectedTicket.id, 'Super Admin')}
                                            >
                                                Assign to Me
                                            </Button>
                                        </div>

                                        {/* Conversation */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Conversation</h4>
                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {selectedTicket.responses.map((response) => (
                                                    <div
                                                        key={response.id}
                                                        className={`p-3 rounded-lg ${response.isFromUser
                                                            ? 'bg-blue-50 ml-4'
                                                            : 'bg-green-50 mr-4'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-medium text-sm">{response.authorName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(response.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm">{response.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Response Form */}
                                        <div className="space-y-3">
                                            <Label htmlFor="response">Send Response</Label>
                                            <Textarea
                                                id="response"
                                                placeholder="Type your response..."
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <Button
                                                onClick={handleSendResponse}
                                                disabled={!responseMessage.trim() || isResponding}
                                                className="w-full"
                                            >
                                                <Reply className="mr-2 h-4 w-4" />
                                                {isResponding ? 'Sending...' : 'Send Response'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a ticket from the list to view details and respond</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Response Time Analytics</CardTitle>
                                <CardDescription>Average response times by priority</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Urgent</span>
                                        <span className="font-medium">2.3 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>High</span>
                                        <span className="font-medium">8.1 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Medium</span>
                                        <span className="font-medium">24.5 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Low</span>
                                        <span className="font-medium">72.2 hours</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Categories</CardTitle>
                                <CardDescription>Distribution by category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Technical Issues</span>
                                        <span className="font-medium">45%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Billing Questions</span>
                                        <span className="font-medium">25%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Feature Requests</span>
                                        <span className="font-medium">20%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Bug Reports</span>
                                        <span className="font-medium">10%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}