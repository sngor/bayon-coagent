'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, TrendingUp, CheckCircle, AlertCircle, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    startOpenHouseSessionAction,
    endOpenHouseSessionAction,
    addVisitorToSessionAction,
    getOpenHouseSessionAction,
    type Visitor,
    type OpenHouseSession,
    type OpenHouseSummary
} from '@/app/mobile-actions';
import { offlineSyncManager } from '@/lib/offline-sync-manager';

export interface OpenHouseCheckinProps {
    userId: string;
    onSessionStart?: (session: OpenHouseSession) => void;
    onSessionEnd?: (summary: OpenHouseSummary) => void;
    onVisitorAdded?: (visitor: Visitor) => void;
    className?: string;
}

interface VisitorFormData {
    name: string;
    email: string;
    phone: string;
    interestLevel: 'low' | 'medium' | 'high';
    notes: string;
}

const initialVisitorForm: VisitorFormData = {
    name: '',
    email: '',
    phone: '',
    interestLevel: 'medium',
    notes: ''
};

export default function OpenHouseCheckin({
    userId,
    onSessionStart,
    onSessionEnd,
    onVisitorAdded,
    className
}: OpenHouseCheckinProps) {
    const [session, setSession] = useState<OpenHouseSession | null>(null);
    const [visitorForm, setVisitorForm] = useState<VisitorFormData>(initialVisitorForm);
    const [sessionForm, setSessionForm] = useState({
        propertyId: '',
        propertyAddress: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [summary, setSummary] = useState<OpenHouseSummary | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingOperations, setPendingOperations] = useState(0);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Monitor connectivity and sync queue status
    useEffect(() => {
        // Set up connectivity monitoring
        const unsubscribeConnectivity = offlineSyncManager.onConnectivityChange((online) => {
            setIsOnline(online);
            if (online) {
                setSuccess('Connection restored - syncing data...');
                updateQueueStatus();
            } else {
                setError('Connection lost - working offline');
            }
        });

        // Update queue status periodically
        const updateQueueStatus = async () => {
            try {
                const status = await offlineSyncManager.getQueueStatus();
                setPendingOperations(status.pending + status.failed);
            } catch (error) {
                console.error('Failed to get queue status:', error);
            }
        };

        // Initial status update
        updateQueueStatus();

        // Update queue status every 10 seconds
        const statusInterval = setInterval(updateQueueStatus, 10000);

        return () => {
            unsubscribeConnectivity();
            clearInterval(statusInterval);
        };
    }, []);

    const handleStartSession = async () => {
        if (!sessionForm.propertyId.trim()) {
            setError('Property ID is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            if (isOnline) {
                // Online: Execute immediately
                const result = await startOpenHouseSessionAction({
                    sessionId,
                    propertyId: sessionForm.propertyId.trim(),
                    propertyAddress: sessionForm.propertyAddress.trim() || undefined,
                    userId
                });

                if (result.success && result.session) {
                    setSession(result.session);
                    setSuccess('Open house session started successfully!');
                    onSessionStart?.(result.session);

                    // Clear session form
                    setSessionForm({ propertyId: '', propertyAddress: '' });
                } else {
                    setError(result.error || 'Failed to start session');
                }
            } else {
                // Offline: Queue operation and create local session
                await offlineSyncManager.queueOperation({
                    type: 'checkin',
                    data: {
                        operationType: 'start-session',
                        sessionId,
                        propertyId: sessionForm.propertyId.trim(),
                        propertyAddress: sessionForm.propertyAddress.trim() || undefined,
                        userId
                    },
                    timestamp: Date.now()
                });

                // Create local session for immediate UI feedback
                const localSession: OpenHouseSession = {
                    sessionId,
                    propertyId: sessionForm.propertyId.trim(),
                    propertyAddress: sessionForm.propertyAddress.trim() || undefined,
                    startTime: Date.now(),
                    visitors: [],
                    status: 'active',
                    userId
                };

                setSession(localSession);
                setSuccess('Open house session started (will sync when online)');
                onSessionStart?.(localSession);

                // Clear session form
                setSessionForm({ propertyId: '', propertyAddress: '' });
            }
        } catch (err) {
            setError('Failed to start session');
            console.error('Start session error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!session) return;

        setIsLoading(true);
        setError(null);

        try {
            if (isOnline) {
                // Online: Execute immediately
                const result = await endOpenHouseSessionAction({
                    sessionId: session.sessionId,
                    userId
                });

                if (result.success && result.summary) {
                    setSummary(result.summary);
                    setSession(null);
                    setSuccess('Open house session ended successfully!');
                    onSessionEnd?.(result.summary);
                } else {
                    setError(result.error || 'Failed to end session');
                }
            } else {
                // Offline: Queue operation and create local summary
                await offlineSyncManager.queueOperation({
                    type: 'checkin',
                    data: {
                        operationType: 'end-session',
                        sessionId: session.sessionId,
                        userId
                    },
                    timestamp: Date.now()
                });

                // Generate local summary
                const endTime = Date.now();
                const visitors = session.visitors;
                const totalVisitors = visitors.length;
                const highInterest = visitors.filter(v => v.interestLevel === 'high').length;
                const mediumInterest = visitors.filter(v => v.interestLevel === 'medium').length;
                const lowInterest = visitors.filter(v => v.interestLevel === 'low').length;

                // Calculate average interest level (high=3, medium=2, low=1)
                const interestSum = visitors.reduce((sum, visitor) => {
                    const interestValue = visitor.interestLevel === 'high' ? 3 :
                        visitor.interestLevel === 'medium' ? 2 : 1;
                    return sum + interestValue;
                }, 0);
                const averageInterestLevel = totalVisitors > 0 ? interestSum / totalVisitors : 0;

                // Calculate duration in minutes
                const duration = Math.round((endTime - session.startTime) / (1000 * 60));

                const localSummary: OpenHouseSummary = {
                    sessionId: session.sessionId,
                    propertyId: session.propertyId,
                    propertyAddress: session.propertyAddress,
                    visitors,
                    totalVisitors,
                    highInterest,
                    mediumInterest,
                    lowInterest,
                    averageInterestLevel,
                    followUpGenerated: false,
                    startTime: session.startTime,
                    endTime,
                    duration
                };

                setSummary(localSummary);
                setSession(null);
                setSuccess('Open house session ended (will sync when online)');
                onSessionEnd?.(localSummary);
            }
        } catch (err) {
            setError('Failed to end session');
            console.error('End session error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVisitor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            setError('No active session');
            return;
        }

        if (!visitorForm.name.trim() || !visitorForm.email.trim()) {
            setError('Name and email are required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isOnline) {
                // Online: Execute immediately
                const result = await addVisitorToSessionAction({
                    sessionId: session.sessionId,
                    visitor: {
                        name: visitorForm.name,
                        email: visitorForm.email,
                        phone: visitorForm.phone,
                        interestLevel: visitorForm.interestLevel,
                        notes: visitorForm.notes
                    },
                    userId
                });

                if (result.success && result.visitor && result.session) {
                    setSession(result.session);
                    setVisitorForm(initialVisitorForm);
                    setSuccess(`${result.visitor.name} checked in successfully!`);
                    onVisitorAdded?.(result.visitor);
                } else {
                    setError(result.error || 'Failed to add visitor');
                }
            } else {
                // Offline: Queue operation and update local session
                const visitor: Visitor = {
                    id: `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: visitorForm.name.trim(),
                    email: visitorForm.email.trim().toLowerCase(),
                    phone: visitorForm.phone?.trim() || '',
                    interestLevel: visitorForm.interestLevel,
                    notes: visitorForm.notes?.trim() || '',
                    timestamp: Date.now()
                };

                // Check for duplicate email in local session
                const existingVisitor = session.visitors.find(v => v.email === visitor.email);
                if (existingVisitor) {
                    setError('A visitor with this email has already checked in');
                    return;
                }

                // Queue the operation
                await offlineSyncManager.queueOperation({
                    type: 'checkin',
                    data: {
                        operationType: 'add-visitor',
                        sessionId: session.sessionId,
                        visitor: {
                            name: visitor.name,
                            email: visitor.email,
                            phone: visitor.phone,
                            interestLevel: visitor.interestLevel,
                            notes: visitor.notes
                        },
                        userId
                    },
                    timestamp: Date.now()
                });

                // Update local session
                const updatedSession: OpenHouseSession = {
                    ...session,
                    visitors: [...session.visitors, visitor]
                };

                setSession(updatedSession);
                setVisitorForm(initialVisitorForm);
                setSuccess(`${visitor.name} checked in (will sync when online)`);
                onVisitorAdded?.(visitor);
            }
        } catch (err) {
            setError('Failed to add visitor');
            console.error('Add visitor error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getInterestLevelColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Error/Success Messages */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {/* Offline Status Indicator */}
            {!isOnline && (
                <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        Working offline - {pendingOperations > 0 ? `${pendingOperations} operations pending sync` : 'data will sync when online'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Pending Operations Indicator (when online but have pending operations) */}
            {isOnline && pendingOperations > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Syncing {pendingOperations} pending operations...
                    </AlertDescription>
                </Alert>
            )}

            {/* Session Summary (shown after session ends) */}
            {summary && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            Open House Complete
                        </CardTitle>
                        <CardDescription className="text-green-700">
                            Session ended at {formatTime(summary.endTime)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-800">{summary.totalVisitors}</div>
                                <div className="text-sm text-green-600">Total Visitors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-800">{summary.highInterest}</div>
                                <div className="text-sm text-green-600">High Interest</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-800">{summary.averageInterestLevel.toFixed(1)}</div>
                                <div className="text-sm text-green-600">Avg Interest</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-800">{formatDuration(summary.duration)}</div>
                                <div className="text-sm text-green-600">Duration</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setSummary(null)}
                            variant="outline"
                            className="w-full"
                        >
                            Start New Session
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Start Session Form */}
            {!session && !summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Start Open House Session
                        </CardTitle>
                        <CardDescription>
                            Begin tracking visitors for your open house
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="propertyId">Property ID *</Label>
                            <Input
                                id="propertyId"
                                value={sessionForm.propertyId}
                                onChange={(e) => setSessionForm(prev => ({ ...prev, propertyId: e.target.value }))}
                                placeholder="Enter property ID or MLS number"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyAddress">Property Address</Label>
                            <Input
                                id="propertyAddress"
                                value={sessionForm.propertyAddress}
                                onChange={(e) => setSessionForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                                placeholder="123 Main St, Seattle, WA"
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            onClick={handleStartSession}
                            disabled={isLoading || !sessionForm.propertyId.trim()}
                            className="w-full"
                        >
                            {isLoading ? 'Starting...' : 'Start Session'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Active Session */}
            {session && (
                <>
                    {/* Session Info */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <Clock className="h-5 w-5" />
                                    Active Session
                                </div>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {session.visitors.length} visitors
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-blue-700">
                                {session.propertyAddress || session.propertyId} • Started at {formatTime(session.startTime)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleEndSession}
                                disabled={isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                <Square className="h-4 w-4 mr-2" />
                                {isLoading ? 'Ending...' : 'End Session'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Visitor Check-in Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Visitor Check-in
                            </CardTitle>
                            <CardDescription>
                                Add a new visitor to the open house
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddVisitor} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="visitorName">Name *</Label>
                                        <Input
                                            id="visitorName"
                                            value={visitorForm.name}
                                            onChange={(e) => setVisitorForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Visitor's full name"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="visitorEmail">Email *</Label>
                                        <Input
                                            id="visitorEmail"
                                            type="email"
                                            value={visitorForm.email}
                                            onChange={(e) => setVisitorForm(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="visitor@example.com"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="visitorPhone">Phone</Label>
                                        <Input
                                            id="visitorPhone"
                                            type="tel"
                                            value={visitorForm.phone}
                                            onChange={(e) => setVisitorForm(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="(555) 123-4567"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="interestLevel">Interest Level</Label>
                                        <Select
                                            value={visitorForm.interestLevel}
                                            onValueChange={(value: 'low' | 'medium' | 'high') =>
                                                setVisitorForm(prev => ({ ...prev, interestLevel: value }))
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low Interest</SelectItem>
                                                <SelectItem value="medium">Medium Interest</SelectItem>
                                                <SelectItem value="high">High Interest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visitorNotes">Notes</Label>
                                    <Textarea
                                        id="visitorNotes"
                                        value={visitorForm.notes}
                                        onChange={(e) => setVisitorForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Additional notes about the visitor..."
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !visitorForm.name.trim() || !visitorForm.email.trim()}
                                    className="w-full"
                                >
                                    {isLoading ? 'Adding...' : 'Check In Visitor'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Visitor List */}
                    {session.visitors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Visitors ({session.visitors.length})
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-600">
                                            {session.visitors.filter(v => v.interestLevel === 'high').length} high interest
                                        </span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {session.visitors.map((visitor, index) => (
                                        <div key={visitor.id}>
                                            <div className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">{visitor.name}</span>
                                                        <Badge
                                                            variant="outline"
                                                            className={getInterestLevelColor(visitor.interestLevel)}
                                                        >
                                                            {visitor.interestLevel}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <div>{visitor.email}</div>
                                                        {visitor.phone && <div>{visitor.phone}</div>}
                                                        {visitor.notes && (
                                                            <div className="text-gray-500 italic">{visitor.notes}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 ml-4">
                                                    {formatTime(visitor.timestamp)}
                                                </div>
                                            </div>
                                            {index < session.visitors.length - 1 && <Separator className="my-2" />}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

export type { Visitor, OpenHouseSession, OpenHouseSummary };