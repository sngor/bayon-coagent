import type { Announcement } from '@/hooks/use-announcements-data';

/**
 * Utility functions for announcement styling and formatting
 */

export function getStatusColor(status: Announcement['status']): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        case 'scheduled':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'sent':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'cancelled':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
}

export function getPriorityColor(priority: Announcement['priority']): string {
    switch (priority) {
        case 'low':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'high':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'urgent':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
}

export function formatAnnouncementDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
}

export function formatAnnouncementTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString();
}

export function getTargetAudienceLabel(audience: Announcement['targetAudience']): string {
    switch (audience) {
        case 'all': return 'All Users';
        case 'admins': return 'Admins Only';
        case 'users': return 'Users Only';
        case 'specific': return 'Specific Group';
        default: return audience;
    }
}