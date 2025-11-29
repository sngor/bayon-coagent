import { redirect } from 'next/navigation';
import { ClientDashboardView } from '@/components/client-dashboard/client-dashboard-view';
import { getRepository } from '@/aws/dynamodb/repository';
import { getClientDashboardKeys } from '@/aws/dynamodb/keys';
import { ClientDashboard } from '@/features/client-dashboards/actions/client-dashboard-actions';

export const dynamic = 'force-dynamic';


/**
 * Authenticated Client Dashboard Page
 * 
 * This page displays the client dashboard for authenticated users.
 * Unlike the token-based access (/d/[token]), this requires authentication.
 * 
 * Requirements: 1.1, 2.3
 */
export default async function AuthenticatedDashboardPage() {
    // Get the current client session
    const { getClientAuthClient } = await import('@/aws/auth/client-auth');
    const clientAuth = getClientAuthClient();

    let session;
    try {
        session = await clientAuth.getSession();
    } catch (error) {
        // Not authenticated, redirect to login
        redirect('/portal/login?redirect=/portal/dashboard');
    }

    if (!session) {
        redirect('/portal/login?redirect=/portal/dashboard');
    }

    // Get the dashboard for this client
    const repository = getRepository();
    const dashboardKeys = getClientDashboardKeys(session.agentId, session.clientId);

    const dashboard = await repository.get<ClientDashboard>(
        dashboardKeys.PK,
        dashboardKeys.SK
    );

    if (!dashboard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Dashboard Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your dashboard could not be found. Please contact your agent.
                    </p>
                </div>
            </div>
        );
    }

    // Create a mock secured link for compatibility with ClientDashboardView
    // In authenticated mode, we don't use secured links
    const mockLink = {
        token: 'authenticated',
        dashboardId: dashboard.id,
        agentId: dashboard.agentId,
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
        accessCount: 0,
        lastAccessedAt: Date.now(),
        revoked: false,
        createdAt: Date.now(),
    };

    return (
        <ClientDashboardView
            dashboard={dashboard}
            link={mockLink}
            token="authenticated"
        />
    );
}

export const metadata = {
    title: 'Your Dashboard - Client Portal',
    description: 'Access your personalized client portal dashboard',
    robots: 'noindex, nofollow',
};
