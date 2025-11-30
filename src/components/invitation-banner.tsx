'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserInvitationsAction, acceptInvitationAction, rejectInvitationAction } from '@/app/actions';
import { Invitation } from '@/lib/types/organization-types';

export function InvitationBanner() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadInvitations();
    }, []);

    async function loadInvitations() {
        try {
            const result = await getUserInvitationsAction();
            if (result.message === 'success' && result.data) {
                setInvitations(result.data);
            }
        } catch (error) {
            console.error('Failed to load invitations:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAccept(invitationId: string) {
        setProcessingId(invitationId);
        try {
            const result = await acceptInvitationAction(invitationId);
            if (result.message === 'success') {
                toast({
                    title: 'Invitation Accepted',
                    description: 'You have successfully joined the organization.',
                });
                // Remove from list
                setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
                // Ideally refresh the page or update session to reflect new org
                window.location.reload();
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to accept invitation',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setProcessingId(null);
        }
    }

    async function handleReject(invitationId: string) {
        setProcessingId(invitationId);
        try {
            const result = await rejectInvitationAction(invitationId);
            if (result.message === 'success') {
                toast({
                    title: 'Invitation Rejected',
                    description: 'You have rejected the invitation.',
                });
                setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to reject invitation',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading || invitations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 mb-6">
            {invitations.map((invitation) => (
                <Alert key={invitation.id} className="bg-primary/5 border-primary/20">
                    <Mail className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-semibold">Team Invitation</AlertTitle>
                    <AlertDescription className="flex items-center justify-between mt-2">
                        <span>
                            You have been invited to join an organization as a <strong>{invitation.role}</strong>.
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleReject(invitation.id)}
                                disabled={processingId === invitation.id}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleAccept(invitation.id)}
                                disabled={processingId === invitation.id}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}
