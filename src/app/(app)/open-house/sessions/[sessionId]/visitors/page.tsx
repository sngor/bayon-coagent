import { notFound } from 'next/navigation';
import { getOpenHouseSession, getSessionVisitors } from '@/app/(app)/open-house/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Download, UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { FollowUpGenerator } from '@/components/open-house/follow-up-generator';
import { FollowUpHistory } from '@/components/open-house/follow-up-history';

interface VisitorsPageProps {
    params: {
        sessionId: string;
    };
}

export default async function VisitorsPage({ params }: VisitorsPageProps) {
    const { session, error } = await getOpenHouseSession(params.sessionId);

    if (error || !session) {
        notFound();
    }

    // Fetch visitors for the session
    const { visitors } = await getSessionVisitors(params.sessionId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Visitors</h1>
                    <p className="text-muted-foreground">
                        {session.propertyAddress}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {session.status === 'active' && (
                        <Button asChild>
                            <Link href={`/open-house/sessions/${session.sessionId}/check-in`}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Check In Visitor
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Visitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="text-3xl font-bold">
                                {session.visitorCount || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>High Interest</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-green-500" />
                            <span className="text-3xl font-bold">
                                {session.interestLevelDistribution?.high || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Medium Interest</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-yellow-500" />
                            <span className="text-3xl font-bold">
                                {session.interestLevelDistribution?.medium || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Low Interest</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-gray-500" />
                            <span className="text-3xl font-bold">
                                {session.interestLevelDistribution?.low || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visitors List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Visitor List</CardTitle>
                            <CardDescription>
                                All visitors who checked in to this session
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search visitors..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                All
                            </Button>
                            <Button variant="outline" size="sm">
                                <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                                High
                            </Button>
                            <Button variant="outline" size="sm">
                                <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2" />
                                Medium
                            </Button>
                            <Button variant="outline" size="sm">
                                <div className="h-3 w-3 rounded-full bg-gray-500 mr-2" />
                                Low
                            </Button>
                        </div>
                    </div>

                    {/* Visitor List */}
                    {session.visitorCount === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No visitors yet</p>
                            <p className="text-sm mb-4">
                                Visitors will appear here once they check in
                            </p>
                            {session.status === 'active' && (
                                <Button asChild>
                                    <Link
                                        href={`/open-house/sessions/${session.sessionId}/check-in`}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Check In First Visitor
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Visitor management interface coming soon</p>
                            <p className="text-sm mt-2">
                                This will display detailed visitor information with edit and
                                delete capabilities
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Follow-up Components */}
            {visitors.length > 0 && (
                <>
                    <FollowUpGenerator
                        sessionId={params.sessionId}
                        visitors={visitors}
                    />

                    <FollowUpHistory
                        sessionId={params.sessionId}
                        visitors={visitors}
                    />
                </>
            )}
        </div>
    );
}
