/**
 * Support Tickets Hook
 * Manages support ticket state and operations
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SupportTicket, TicketResponse, TicketFilters } from '@/lib/types/admin';
import { useToast } from '@/hooks/use-toast';

interface UseSupportTicketsReturn {
    tickets: SupportTicket[];
    filteredTickets: SupportTicket[];
    selectedTicket: SupportTicket | null;
    filters: TicketFilters;
    loading: boolean;
    error: string | null;
    // Actions
    setSelectedTicket: (ticket: SupportTicket | null) => void;
    updateFilters: (filters: Partial<TicketFilters>) => void;
    clearFilters: () => void;
    updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
    assignTicket: (ticketId: string, assignee: string) => Promise<void>;
    sendResponse: (ticketId: string, message: string) => Promise<void>;
    refreshTickets: () => Promise<void>;
    // Stats
    ticketStats: {
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        urgent: number;
    };
}

const initialFilters: TicketFilters = {
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
};

export function useSupportTickets(): UseSupportTicketsReturn {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filters, setFilters] = useState<TicketFilters>(initialFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Filter tickets based on current filters
    const filteredTickets = useMemo(() => {
        let filtered = tickets;

        if (filters.status !== 'all') {
            filtered = filtered.filter(t => t.status === filters.status);
        }
        if (filters.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }
        if (filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === filters.category);
        }
        if (filters.search) {
            const query = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.subject.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.userEmail.toLowerCase().includes(query) ||
                t.userName.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tickets, filters]);

    // Calculate ticket statistics
    const ticketStats = useMemo(() => ({
        total: filteredTickets.length,
        open: filteredTickets.filter(t => t.status === 'open').length,
        inProgress: filteredTickets.filter(t => t.status === 'in_progress').length,
        resolved: filteredTickets.filter(t => t.status === 'resolved').length,
        urgent: filteredTickets.filter(t => t.priority === 'urgent').length
    }), [filteredTickets]);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

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
                // Add more mock tickets as needed
            ];

            setTickets(mockTickets);
        } catch (err) {
            console.error('Failed to load tickets:', err);
            setError('Failed to load support tickets');
            toast({
                title: "Error",
                description: "Failed to load support tickets",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateFilters = useCallback((newFilters: Partial<TicketFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    const updateTicketStatus = useCallback(async (ticketId: string, newStatus: SupportTicket['status']) => {
        try {
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
                    : t
            ));

            // Update selected ticket if it's the one being updated
            setSelectedTicket(prev => prev?.id === ticketId
                ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() }
                : prev
            );

            toast({
                title: "Status Updated",
                description: `Ticket status changed to ${newStatus}`,
            });
        } catch (err) {
            console.error('Failed to update status:', err);
            toast({
                title: "Error",
                description: "Failed to update ticket status",
                variant: "destructive"
            });
        }
    }, [toast]);

    const assignTicket = useCallback(async (ticketId: string, assignee: string) => {
        try {
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, assignedTo: assignee, updatedAt: new Date().toISOString() }
                    : t
            ));

            setSelectedTicket(prev => prev?.id === ticketId
                ? { ...prev, assignedTo: assignee, updatedAt: new Date().toISOString() }
                : prev
            );

            toast({
                title: "Ticket Assigned",
                description: `Ticket assigned to ${assignee}`,
            });
        } catch (err) {
            console.error('Failed to assign ticket:', err);
            toast({
                title: "Error",
                description: "Failed to assign ticket",
                variant: "destructive"
            });
        }
    }, [toast]);

    const sendResponse = useCallback(async (ticketId: string, message: string) => {
        if (!message.trim()) return;

        try {
            const newResponse: TicketResponse = {
                id: Date.now().toString(),
                message: message.trim(),
                isFromUser: false,
                authorName: 'Super Admin',
                createdAt: new Date().toISOString()
            };

            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? {
                        ...t,
                        responses: [...t.responses, newResponse],
                        status: 'in_progress' as const,
                        updatedAt: new Date().toISOString()
                    }
                    : t
            ));

            setSelectedTicket(prev => prev?.id === ticketId ? {
                ...prev,
                responses: [...prev.responses, newResponse],
                status: 'in_progress',
                updatedAt: new Date().toISOString()
            } : prev);

            toast({
                title: "Response Sent",
                description: "Your response has been sent to the user",
            });
        } catch (err) {
            console.error('Failed to send response:', err);
            toast({
                title: "Error",
                description: "Failed to send response",
                variant: "destructive"
            });
        }
    }, [toast]);

    const refreshTickets = useCallback(async () => {
        await loadTickets();
    }, [loadTickets]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    return {
        tickets,
        filteredTickets,
        selectedTicket,
        filters,
        loading,
        error,
        setSelectedTicket,
        updateFilters,
        clearFilters,
        updateTicketStatus,
        assignTicket,
        sendResponse,
        refreshTickets,
        ticketStats
    };
}