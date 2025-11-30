'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
    Plus,
    MoreVertical,
    DoorOpen,
    Users,
    Calendar,
    TrendingUp,
    Clock,
    Eye,
    Download,
    Trash2,
    CheckCircle2,
    PlayCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { HubLayout } from '@/components/hub/hub-layout';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { OpenHouseCheckin } from '@/components/mobile';
import type { OpenHouseSession, OpenHouseSummary } from '@/components/mobile/open-house-checkin';

type SessionStatus = 'active' | 'completed' | 'scheduled';

interface SessionCard {
    session: OpenHouseSession;
    summary?: OpenHouseSummary;
    status: SessionStatus;
}

export default function OpenHousePage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [sessions, setSessions] = useState<SessionCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'scheduled'>('all');
    const [showNewSession, setShowNewSession] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Simulate loading sessions - Replace with actual API calls
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // Simulate loading sessions
        setTimeout(() => {
            setSessions([
                {
                    session: {
                        sessionId: 'session-1',
                        propertyId: 'MLS-123456',
                        propertyAddress: '1234 Maple Street, Seattle, WA 98101',
                        startTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
                        visitors: [],
                        status: 'active',
                        userId: user.id,
                    },
                    status: 'active',
                },
                {
                    session: {
                        sessionId: 'session-2',
                        propertyId: 'MLS-789012',
                        propertyAddress: '567 Oak Avenue, Bellevue, WA 98004',
                        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
                        visitors: [
                            {
                                id: 'v1',
                                name: 'John Doe',
                                email: 'john@example.com',
                                phone: '555-1234',
                                interestLevel: 'high',
                                notes: 'Very interested in the property',
                                timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
                            },
                            {
                                id: 'v2',
                                name: 'Jane Smith',
                                email: 'jane@example.com',
                                phone: '555-5678',
                                interestLevel: 'medium',
                                notes: '',
                                timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
                            },
                        ],
                        status: 'completed',
                        userId: user.id,
                    },
                    summary: {
                        sessionId: 'session-2',
                        propertyId: 'MLS-789012',
                        propertyAddress: '567 Oak Avenue, Bellevue, WA 98004',
                        visitors: [],
                        totalVisitors: 2,
                        highInterest: 1,
                        mediumInterest: 1,
                        lowInterest: 0,
                        averageInterestLevel: 2.5,
                        followUpGenerated: false,
                        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
                        endTime: Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
                        duration: 180,
                    },
                    status: 'completed',
                },
            ]);
            setIsLoading(false);
        }, 1000);
    }, [user]);

    // Filter sessions
    const filteredSessions = useMemo(() => {
        let filtered = sessions;

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.session.propertyAddress?.toLowerCase().includes(query) ||
                    item.session.propertyId.toLowerCase().includes(query)
            );
        }

        // Filter by status tab
        if (activeTab !== 'all') {
            filtered = filtered.filter((item) => item.status === activeTab);
        }

        return filtered;
    }, [sessions, searchQuery, activeTab]);

    const handleStartNewSession = () => {
        setShowNewSession(true);
        setActiveSessionId(null);
    };

    const handleSessionStart = (session: OpenHouseSession) => {
        // Add to sessions list
        setSessions((prev) => [
            {
                session,
                status: 'active',
            },
            ...prev,
        ]);
        setActiveSessionId(session.sessionId);
        setShowNewSession(false);
    };

    const handleSessionEnd = (summary: OpenHouseSummary) => {
        // Update session in list
        setSessions((prev) =>
            prev.map((item) =>
                item.session.sessionId === summary.sessionId
                    ? { ...item, summary, status: 'completed' as SessionStatus }
                    : item
            )
        );
        setActiveSessionId(null);
        toast({
            title: 'Session Ended',
            description: `Open house completed with ${summary.totalVisitors} visitors`,
        });
    };

    const handleViewSession = (sessionId: string) => {
        const sessionCard = sessions.find((s) => s.session.sessionId === sessionId);
        if (sessionCard?.status === 'active') {
            setActiveSessionId(sessionId);
            setShowNewSession(false);
        }
    };

    const getStatusColor = (status: SessionStatus) => {
        switch (status) {
            case 'active':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'scheduled':
                return 'bg-purple-100 text-purple-800 border-purple-200';
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (isUserLoading || isLoading) {
        return <StandardSkeleton variant="card" count={6} />;
    }

    if (!user) {
        return (
            <IntelligentEmptyState
                icon={DoorOpen}
                title="Authentication Required"
                description="Please log in to manage open houses"
                actions={[
                    {
                        label: 'Go to Login',
                        onClick: () => router.push('/login'),
                    },
                ]}
            />
        );
    }



    // If viewing a specific active session or creating new session
    const activeSession = activeSessionId
        ? sessions.find((s) => s.session.sessionId === activeSessionId)?.session
        : null;

    if (showNewSession || activeSession) {
        return (
            <HubLayout
                title="Open House"
                description="Manage your open house sessions and visitor check-ins"
                icon={DoorOpen}
                actions={
                    !showNewSession && !activeSession ? (
                        <Button onClick={handleStartNewSession} size="default">
                            <Plus className="h-4 w-4 mr-2" />
                            Start New Session
                        </Button>
                    ) : (
                        <Button
                            onClick={() => {
                                setShowNewSession(false);
                                setActiveSessionId(null);
                            }}
                            variant="outline"
                            size="default"
                        >
                            Back to Sessions
                        </Button>
                    )
                }
            >
                <div className="max-w-4xl">
                    <OpenHouseCheckin
                        userId={user.id}
                        onSessionStart={handleSessionStart}
                        onSessionEnd={handleSessionEnd}
                        onVisitorAdded={(visitor) => {
                            console.log('Visitor added:', visitor);
                        }}
                    />
                </div>
            </HubLayout>
        );
    }

    return (
        <HubLayout
            title="Open House"
            description="Manage your open house sessions and visitor check-ins"
            icon={DoorOpen}
            actions={
                <Button onClick={handleStartNewSession} size="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Session
                </Button>
            }
        >
            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All Sessions</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by property address or MLS number..."
                    />
                </div>
            </div>

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
                <IntelligentEmptyState
                    icon={DoorOpen}
                    title={searchQuery ? 'No Sessions Found' : 'No Open House Sessions Yet'}
                    description={
                        searchQuery
                            ? 'Try adjusting your search criteria'
                            : 'Start your first open house session to track visitors and gather insights'
                    }
                    actions={
                        !searchQuery
                            ? [
                                {
                                    label: 'Start New Session',
                                    onClick: handleStartNewSession,
                                },
                            ]
                            : []
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSessions.map((item) => {
                        const { session, summary, status } = item;
                        const visitorCount = summary?.totalVisitors || session.visitors.length;
                        const highInterestCount = summary?.highInterest || 0;

                        return (
                            <Card
                                key={session.sessionId}
                                className={`hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${status === 'active'
                                    ? 'bg-gradient-to-br from-blue-50/50 to-blue-100/50 border-blue-200'
                                    : status === 'completed'
                                        ? 'bg-gradient-to-br from-green-50/30 to-green-100/30 border-green-200'
                                        : 'bg-gradient-to-br from-purple-50/30 to-purple-100/30 border-purple-200'
                                    }`}
                                onClick={() => handleViewSession(session.sessionId)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate flex items-center gap-2">
                                                <DoorOpen className="h-4 w-4" />
                                                {session.propertyAddress || session.propertyId}
                                            </CardTitle>
                                            <CardDescription className="truncate">
                                                MLS: {session.propertyId}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export Visitors
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        <Badge variant="outline" className={`capitalize ${getStatusColor(status)}`}>
                                            {status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
                                            {status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                                            {status}
                                        </Badge>
                                    </div>

                                    {/* Visitor Count */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Visitors</span>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{visitorCount}</span>
                                        </div>
                                    </div>

                                    {/* High Interest Count */}
                                    {highInterestCount > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">High Interest</span>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-green-600">{highInterestCount}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Duration */}
                                    {summary && (
                                        <div className="pt-2 border-t">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Duration</span>
                                                <span className="font-medium">{formatDuration(summary.duration)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Start Time */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <Clock className="h-3 w-3" />
                                        {status === 'active'
                                            ? `Started ${formatDistanceToNow(session.startTime, { addSuffix: true })}`
                                            : summary
                                                ? `Ended ${formatDistanceToNow(summary.endTime, { addSuffix: true })}`
                                                : formatDistanceToNow(session.startTime, { addSuffix: true })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </HubLayout>
    );
}
