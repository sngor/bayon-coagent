import { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

/**
 * Layout for Client Dashboard Pages
 * 
 * Provides a minimal layout without the main app navigation,
 * as this is a client-facing portal accessed via secured links.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
}

// Metadata for the dashboard route
export const metadata = {
    title: 'Client Dashboard',
    description: 'Your personalized real estate dashboard',
    robots: 'noindex, nofollow', // Don't index client dashboards
};
