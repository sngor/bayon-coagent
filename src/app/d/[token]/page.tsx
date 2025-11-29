import { notFound } from 'next/navigation';
import { validateDashboardLink } from '@/features/client-dashboards/actions/client-dashboard-actions';
import { ClientDashboardView } from '@/components/client-dashboard/client-dashboard-view';

interface ClientDashboardPageProps {
    params: {
        token: string;
    };
}

/**
 * Client Dashboard Page
 * 
 * This page displays a personalized client dashboard accessed via a secured link.
 * The short URL format (/d/[token]) makes it easy to share with clients.
 * 
 * Requirements: 4.1, 8.1, 8.2
 */
export default async function ClientDashboardPage({ params }: ClientDashboardPageProps) {
    const { token } = params;

    // Validate the secured link and get dashboard data
    const result = await validateDashboardLink(token);

    // Handle invalid, expired, or revoked links
    if (result.message !== 'success' || !result.data) {
        notFound();
    }

    const { dashboard, link } = result.data;

    return (
        <ClientDashboardView
            dashboard={dashboard}
            link={link}
            token={token}
        />
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ClientDashboardPageProps) {
    const { token } = params;
    const result = await validateDashboardLink(token);

    if (result.message !== 'success' || !result.data) {
        return {
            title: 'Dashboard Not Found',
        };
    }

    const { dashboard } = result.data;

    return {
        title: `${dashboard.clientInfo.name}'s Dashboard`,
        description: dashboard.branding.welcomeMessage,
        robots: 'noindex, nofollow', // Don't index client dashboards
    };
}
