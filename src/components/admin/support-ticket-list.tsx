/**
 * Support Ticket List Component
 * Extracted from support page for better performance and maintainability
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    User,
    Calendar,
    AlertTriangle,
    TrendingUp,
    BarChart3
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
    responses: any[];
}

interface SupportTicketListProps {
    tickets: SupportTicket[];
    loading: boolean;
    selectedTicket: SupportTicket | null;
    onTicketSelect: (ticket: SupportTicket) => void;
}

// Memoized badge components for better performance
const StatusBadge = memo(({ status }: { status: string }) => {
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
});

const PriorityBadge = memo(({ priority }: { priority: string }) => {
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
});

const CategoryIcon = memo(({ category }: { category: string }) => {
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
});

// Memoized ticket item for performance
const TicketItem = memo(({
    ticket,
    isSelected,
    onSelect
}: {
    ticket: SupportTicket;
    isSelected: boolean;
    onSelect: (ticket: SupportTicket) => void;
}) => (
    <div
        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted border-primary' : ''
            }`}
        onClick={() => onSelect(ticket)}
    >
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
                <CategoryIcon category={ticket.category} />
                <h4 className="font-medium text-sm">{ticket.subject}</h4>
            </div>
            <div className="flex gap-1">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
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
));

export const SupportTicketList = memo(function SupportTicketList({
    tickets,
    loading,
    selectedTicket,
    onTicketSelect
}: SupportTicketListProps) {
    return (
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
                        <TicketItem
                            key={ticket.id}
                            ticket={ticket}
                            isSelected={selectedTicket?.id === ticket.id}
                            onSelect={onTicketSelect}
                        />
                    ))
                )}
            </CardContent>
        </Card>
    );
});