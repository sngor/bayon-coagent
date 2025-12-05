/**
 * Role Badge Component
 * 
 * Displays a colored badge indicating a user's role.
 * Used in admin interfaces and user profile displays.
 */

import { UserRole } from '@/aws/dynamodb/admin-types';
import { getRoleLabel, getRoleColor } from '@/aws/auth/role-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/common';

export interface RoleBadgeProps {
    role: UserRole;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * RoleBadge component displays a colored badge for user roles
 * 
 * Color scheme:
 * - User: gray
 * - Admin: blue
 * - SuperAdmin: purple
 */
export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
    const colors = getRoleColor(role);
    const label = getRoleLabel(role);

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium',
                colors.bg,
                colors.text,
                colors.border,
                sizeClasses[size],
                className
            )}
        >
            {label}
        </Badge>
    );
}
