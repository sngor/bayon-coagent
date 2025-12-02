import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOpenHouseSessions } from '../actions';
import { SessionList } from '@/components/open-house/session-list';
import { SessionFilters } from '@/components/open-house/session-filters';
import { SessionsContent } from './sessions-content';

interface SessionsPageProps {
    searchParams: {
        status?: 'all' | 'scheduled' | 'active' | 'completed' | 'cancelled';
    };
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
    const status = searchParams.status || 'all';
    const { sessions, error } = await getOpenHouseSessions(status);

    return (
        <div className="space-y-6">
            <SessionsContent status={status} />

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            <SessionFilters currentStatus={status} />

            <Card>
                <CardHeader>
                    <CardTitle>Your Sessions</CardTitle>
                    <CardDescription>
                        {status === 'all'
                            ? 'View and manage all your open house sessions'
                            : `Showing ${status} sessions`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>
                                {status === 'all'
                                    ? 'No sessions yet. Create your first open house session to get started.'
                                    : `No ${status} sessions found.`}
                            </p>
                        </div>
                    ) : (
                        <SessionList sessions={sessions} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
