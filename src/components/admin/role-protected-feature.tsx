'use client';

/**
 * Role Protected Feature Component
 * 
 * Wraps features with role-based access control and provides
 * visual feedback for insufficient permissions.
 */

import React from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { UserRole } from '@/aws/dynamodb/admin-types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface RoleProtectedFeatureProps {
    /** The minimum role required to access this feature */
    requiredRole: UserRole;
    /** The content to render if the user has sufficient permissions */
    children: React.ReactNode;
    /** Optional fallback content to render if the user lacks permissions */
    fallback?: React.ReactNode;
    /** Whether to show a tooltip explaining the permission requirement */
    showTooltip?: boolean;
    /** Custom tooltip message */
    tooltipMessage?: string;
    /** Whether to render the children in a disabled state instead of hiding them */
    renderDisabled?: boolean;
    /** Custom class name for the wrapper */
    className?: string;
}

/**
 * Wraps content with role-based access control
 * 
 * @example
 * ```tsx
 * // Hide feature for non-SuperAdmins
 * <RoleProtectedFeature requiredRole="superadmin">
 *   <Button>Manage Roles</Button>
 * </RoleProtectedFeature>
 * 
 * // Show disabled state with tooltip
 * <RoleProtectedFeature 
 *   requiredRole="superadmin" 
 *   renderDisabled 
 *   showTooltip
 * >
 *   <Button>Manage Roles</Button>
 * </RoleProtectedFeature>
 * 
 * // Custom fallback
 * <RoleProtectedFeature 
 *   requiredRole="admin" 
 *   fallback={<p>Admin access required</p>}
 * >
 *   <AdminPanel />
 * </RoleProtectedFeature>
 * ```
 */
export function RoleProtectedFeature({
    requiredRole,
    children,
    fallback = null,
    showTooltip = true,
    tooltipMessage,
    renderDisabled = false,
    className,
}: RoleProtectedFeatureProps) {
    const { role, isLoading } = useUserRole();

    // Show loading state
    if (isLoading) {
        return null;
    }

    // Check if user has sufficient permissions
    const hasPermission = checkRolePermission(role, requiredRole);

    // User has permission - render normally
    if (hasPermission) {
        return <>{children}</>;
    }

    // User lacks permission
    if (renderDisabled) {
        // Render in disabled state with tooltip
        const message = tooltipMessage || getDefaultTooltipMessage(requiredRole);

        if (showTooltip) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn('opacity-50 cursor-not-allowed', className)}>
                                {React.Children.map(children, (child, index) => {
                                    if (React.isValidElement(child)) {
                                        return React.cloneElement(child as React.ReactElement<any>, {
                                            key: child.key || `disabled-child-${index}`,
                                            disabled: true,
                                            'aria-disabled': true,
                                        });
                                    }
                                    return child;
                                })}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                <span>{message}</span>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return (
            <div className={cn('opacity-50 cursor-not-allowed', className)}>
                {React.Children.map(children, (child, index) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, {
                            key: child.key || `disabled-child-${index}`,
                            disabled: true,
                            'aria-disabled': true,
                        });
                    }
                    return child;
                })}
            </div>
        );
    }

    // Hide feature completely
    return <>{fallback}</>;
}

/**
 * Checks if a user's role meets the required permission level
 */
function checkRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
        user: 0,
        admin: 1,
        superadmin: 2,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Gets the default tooltip message for a required role
 */
function getDefaultTooltipMessage(requiredRole: UserRole): string {
    switch (requiredRole) {
        case 'superadmin':
            return 'This feature requires SuperAdmin access';
        case 'admin':
            return 'This feature requires Admin access';
        case 'user':
            return 'This feature requires user access';
        default:
            return 'Insufficient permissions';
    }
}

/**
 * Hook-based alternative for conditional rendering
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canManageRoles = useHasRole('superadmin');
 *   
 *   return (
 *     <div>
 *       {canManageRoles && <RoleManagementPanel />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasRole(requiredRole: UserRole): boolean {
    const { role, isLoading } = useUserRole();

    if (isLoading) {
        return false;
    }

    return checkRolePermission(role, requiredRole);
}

/**
 * Component for displaying a permission denied message
 */
export function PermissionDenied({
    requiredRole,
    message,
}: {
    requiredRole: UserRole;
    message?: string;
}) {
    const defaultMessage = `You need ${requiredRole === 'superadmin' ? 'SuperAdmin' : 'Admin'} access to view this page.`;

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <Shield className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground max-w-md">
                {message || defaultMessage}
            </p>
        </div>
    );
}
