import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthToken } from '@/hooks/use-auth-token';
import type { Announcement } from './use-announcements-data';

interface UseAnnouncementOperationsProps {
    announcements: Announcement[];
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

/**
 * Custom hook for announcement CRUD operations
 * Handles create, update, delete operations with proper error handling
 */
export function useAnnouncementOperations({ announcements, setAnnouncements }: UseAnnouncementOperationsProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { getAuthToken } = useAuthToken();

    const createAnnouncement = async (announcementData: Partial<Announcement>): Promise<boolean> => {
        if (!announcementData.title?.trim()) {
            toast({ title: "Error", description: "Title is required", variant: "destructive" });
            return false;
        }
        if (!announcementData.content?.trim()) {
            toast({ title: "Error", description: "Content is required", variant: "destructive" });
            return false;
        }

        setIsSaving(true);
        try {
            const accessToken = getAuthToken();
            // TODO: Implement actual API call
            // const { createAnnouncementAction } = await import('@/app/admin-actions');
            // const result = await createAnnouncementAction(announcementData, accessToken);

            // Mock success for now
            const newAnnouncement: Announcement = {
                announcementId: Date.now().toString(),
                title: announcementData.title!,
                content: announcementData.content!,
                targetAudience: announcementData.targetAudience || 'all',
                scheduledFor: announcementData.scheduledFor || new Date().toISOString(),
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'current-user@example.com',
                priority: announcementData.priority || 'medium',
                channels: announcementData.channels || ['in_app'],
            };

            toast({ title: "Announcement created", description: `${announcementData.title} has been created` });
            setAnnouncements([...announcements, newAnnouncement]);
            return true;
        } catch (error) {
            console.error('Failed to create announcement:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create announcement",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const updateAnnouncement = async (announcementId: string, updates: Partial<Announcement>): Promise<boolean> => {
        setIsSaving(true);
        try {
            const accessToken = getAuthToken();
            // TODO: Implement actual API call
            // const { updateAnnouncementAction } = await import('@/app/admin-actions');
            // const result = await updateAnnouncementAction(announcementId, updates, accessToken);

            toast({ title: "Announcement updated", description: "Announcement has been updated" });
            setAnnouncements(announcements.map(a =>
                a.announcementId === announcementId
                    ? { ...a, ...updates, updatedAt: new Date().toISOString() }
                    : a
            ));
            return true;
        } catch (error) {
            console.error('Failed to update announcement:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update announcement",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const deleteAnnouncement = async (announcement: Announcement): Promise<boolean> => {
        if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) return false;

        try {
            const accessToken = getAuthToken();
            // TODO: Implement actual API call
            // const { deleteAnnouncementAction } = await import('@/app/admin-actions');
            // const result = await deleteAnnouncementAction(announcement.announcementId, accessToken);

            toast({ title: "Announcement deleted", description: `${announcement.title} has been deleted` });
            setAnnouncements(announcements.filter(a => a.announcementId !== announcement.announcementId));
            return true;
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
            return false;
        }
    };

    return {
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        isSaving
    };
}