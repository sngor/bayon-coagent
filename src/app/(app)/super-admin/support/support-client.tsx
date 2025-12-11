'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare,
    Search,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Calendar,
    Reply,
    RefreshCw,
    TrendingUp,
    BarChart3,
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

export default function SuperAdminSupportClient() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [responseMessage, setResponseMessage] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const { toast } = useToast();

    const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
    };

    useEffect(() => {
        loadTickets();
    }, [statusFilter, priorityFilter, categoryFilter]);

    async function loadTickets() {
        try {
            setLoading(true);
            // Mock data
            const mockTickets: SupportTicket[] = [
                {
                    id: '1',
                    subject: 'Unable to generate AI content',
                    description: 'When I try to use the AI content generation feature, I get an error message.',
                    status: 'open',
                    priority: 'high',
                    category: 'technical',
                    userEmail: 'john.doe@example.com',
                    userName: 'John Doe',
                    userId: 'user-123',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    updatedAt: new Date(Date.now() - 7200000).toISOString(),
                    responses: []
                }
            ];

            setTickets(mockTickets);
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

    return (
        <div className="space-y-8">
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
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Support Tickets</CardTitle>
                    <CardDescription>
                        {loading ? 'Loading...' : `${tickets.length} tickets found`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tickets found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="p-4 border rounded-lg">
                                    <h4 className="font-medium">{ticket.subject}</h4>
                                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline">{ticket.status}</Badge>
                                        <Badge variant="outline">{ticket.priority}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}