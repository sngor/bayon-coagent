'use client';

import { AdminQuickActionCard } from './admin-quick-action-card';
import { RoleProtectedFeature } from './role-protected-feature';
import { ADMIN_QUICK_ACTIONS } from '@/lib/admin/admin-config';

export function AdminDashboardQuickActions() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ADMIN_QUICK_ACTIONS).map(([key, config]) => {
                const ActionCard = (
                    <AdminQuickActionCard
                        key={key}
                        title={config.title}
                        description={config.description}
                        icon={config.icon}
                        iconColor={config.iconColor}
                        iconBgColor={config.iconBgColor}
                        actions={config.actions}
                    />
                );

                return config.superAdminOnly ? (
                    <RoleProtectedFeature key={key} requiredRole="superadmin">
                        {ActionCard}
                    </RoleProtectedFeature>
                ) : (
                    ActionCard
                );
            })}
        </div>
    );
}