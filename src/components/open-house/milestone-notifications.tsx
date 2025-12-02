'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Trophy,
    Users,
    Clock,
    TrendingUp,
    Star,
    X,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { OpenHouseSession, Visitor } from '@/lib/open-house/types';

/**
 * Milestone Notifications Component
 * 
 * Displays celebratory notifications when session reaches milestones
 * Validates Requirements: 11.5
 */

interface Milestone {
    id: string;
    type: 'visitor_count' | 'time_elapsed' | 'high_interest' | 'first_visitor';
    title: string;
    description: string;
    icon: React.ReactNode;
    achieved: boolean;
    timestamp?: Date;
}

interface MilestoneNotificationsProps {
    session: OpenHouseSession;
    visitors: Visitor[];
    className?: string;
}

export function MilestoneNotifications({
    session,
    visitors,
    className
}: MilestoneNotificationsProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [dismissedMilestones, setDismissedMilestones] = useState<Set<string>>(new Set());
    const [showNotification, setShowNotification] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

    // Calculate elapsed time in minutes
    const getElapsedMinutes = (): number => {
        if (!session.actualStartTime) return 0;
        const start = new Date(session.actualStartTime).getTime();
        const now = Date.now();
        return Math.floor((now - start) / 60000);
    };

    // Count high interest visitors
    const getHighInterestCount = (): number => {
        return visitors.filter(v => v.interestLevel === 'high').length;
    };

    // Check milestones
    useEffect(() => {
        if (session.status !== 'active') return;

        const visitorCount = visitors.length;
        const elapsedMinutes = getElapsedMinutes();
        const highInterestCount = getHighInterestCount();

        const newMilestones: Milestone[] = [
            // First visitor
            {
                id: 'first_visitor',
                type: 'first_visitor',
                title: 'First Visitor!',
                description: 'Your open house is officially underway',
                icon: <Star className="h-5 w-5" />,
                achieved: visitorCount >= 1,
            },
            // Visitor count milestones
            {
                id: 'visitors_5',
                type: 'visitor_count',
                title: '5 Visitors',
                description: 'Great start! Keep the momentum going',
                icon: <Users className="h-5 w-5" />,
                achieved: visitorCount >= 5,
            },
            {
                id: 'visitors_10',
                type: 'visitor_count',
                title: '10 Visitors!',
                description: 'Double digits! This is going well',
                icon: <Trophy className="h-5 w-5" />,
                achieved: visitorCount >= 10,
            },
            {
                id: 'visitors_20',
                type: 'visitor_count',
                title: '20 Visitors!',
                description: 'Excellent turnout! Your marketing is working',
                icon: <Sparkles className="h-5 w-5" />,
                achieved: visitorCount >= 20,
            },
            {
                id: 'visitors_50',
                type: 'visitor_count',
                title: '50 Visitors!',
                description: 'Incredible! This is a record-breaking open house',
                icon: <Trophy className="h-5 w-5" />,
                achieved: visitorCount >= 50,
            },
            // Time milestones
            {
                id: 'time_30',
                type: 'time_elapsed',
                title: '30 Minutes In',
                description: 'First half hour complete',
                icon: <Clock className="h-5 w-5" />,
                achieved: elapsedMinutes >= 30,
            },
            {
                id: 'time_60',
                type: 'time_elapsed',
                title: '1 Hour Mark',
                description: 'One hour down! Keep up the great work',
                icon: <Clock className="h-5 w-5" />,
                achieved: elapsedMinutes >= 60,
            },
            {
                id: 'time_120',
                type: 'time_elapsed',
                title: '2 Hours Strong',
                description: 'Two hours of successful hosting',
                icon: <Clock className="h-5 w-5" />,
                achieved: elapsedMinutes >= 120,
            },
            // High interest milestones
            {
                id: 'high_interest_3',
                type: 'high_interest',
                title: '3 High Interest Leads',
                description: 'You have some serious prospects!',
                icon: <TrendingUp className="h-5 w-5" />,
                achieved: highInterestCount >= 3,
            },
            {
                id: 'high_interest_5',
                type: 'high_interest',
                title: '5 High Interest Leads!',
                description: 'Exceptional engagement! Follow up soon',
                icon: <Star className="h-5 w-5" />,
                achieved: highInterestCount >= 5,
            },
            {
                id: 'high_interest_10',
                type: 'high_interest',
                title: '10 High Interest Leads!',
                description: 'Outstanding! This property is a hot commodity',
                icon: <Sparkles className="h-5 w-5" />,
                achieved: highInterestCount >= 10,
            },
        ];

        // Find newly achieved milestones
        const previousMilestones = milestones;
        const newlyAchieved = newMilestones.filter(m => {
            const wasAchieved = previousMilestones.find(pm => pm.id === m.id)?.achieved;
            return m.achieved && !wasAchieved && !dismissedMilestones.has(m.id);
        });

        // Show notification for the first newly achieved milestone
        if (newlyAchieved.length > 0 && !showNotification) {
            const milestone = newlyAchieved[0];
            milestone.timestamp = new Date();
            setCurrentMilestone(milestone);
            setShowNotification(true);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 5000);
        }

        setMilestones(newMilestones);
    }, [visitors.length, session.actualStartTime, session.status]);

    const dismissNotification = (milestoneId: string) => {
        setDismissedMilestones(prev => new Set([...prev, milestoneId]));
        setShowNotification(false);
    };

    // Get achieved milestones for display
    const achievedMilestones = milestones.filter(m => m.achieved);

    if (!showNotification && achievedMilestones.length === 0) {
        return null;
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Floating notification */}
            {showNotification && currentMilestone && (
                <Card className="border-2 border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 animate-in slide-in-from-top-5 duration-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-3 rounded-full bg-yellow-500/20 text-yellow-600">
                                {currentMilestone.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            {currentMilestone.title}
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                                New
                                            </Badge>
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {currentMilestone.description}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => dismissNotification(currentMilestone.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Milestone summary */}
            {achievedMilestones.length > 0 && !showNotification && (
                <Card className={className}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                Milestones Achieved
                            </h4>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                {achievedMilestones.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {achievedMilestones.map((milestone) => (
                                <div
                                    key={milestone.id}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border"
                                >
                                    <div className="flex-shrink-0 text-yellow-600">
                                        {milestone.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">
                                            {milestone.title}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
