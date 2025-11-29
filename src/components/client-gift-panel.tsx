'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Gift,
    Package,
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    ChevronRight,
    Users,
    Mail,
    Heart,
    Settings,
    Utensils,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

type GiftPackageTier = 'gold' | 'platinum' | 'diamond' | 'titanium';
type GiftStatus = 'pending' | 'sent' | 'delivered' | 'scheduled';

interface GiftTouchpoint {
    id: string;
    name: string;
    scheduledDate: Date;
    status: GiftStatus;
    icon: React.ComponentType<{ className?: string }>;
}

interface ClientGiftSummary {
    tier: GiftPackageTier;
    transactionType: 'buyer' | 'seller' | 'investor';
    totalTouchpoints: number;
    completedTouchpoints: number;
    nextScheduled?: Date;
    touchpoints: GiftTouchpoint[];
    createdAt: number;
}

const TIER_COLORS = {
    gold: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-700' },
    platinum: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-700' },
    diamond: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700' },
    titanium: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700' },
};

interface ClientGiftPanelProps {
    clientId: string;
    clientName: string;
    giftPackage?: ClientGiftSummary | null;
    onCreatePackage?: () => void;
}

export function ClientGiftPanel({ clientId, clientName, giftPackage, onCreatePackage }: ClientGiftPanelProps) {
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Mock data if no package exists - replace with actual API call
    const mockGiftPackage: ClientGiftSummary = {
        tier: 'diamond',
        transactionType: 'buyer',
        totalTouchpoints: 7,
        completedTouchpoints: 3,
        nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        touchpoints: [
            {
                id: '1',
                name: 'Under Contract Gift',
                scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                status: 'delivered',
                icon: Gift,
            },
            {
                id: '2',
                name: 'Moving Supplies',
                scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'delivered',
                icon: Package,
            },
            {
                id: '3',
                name: 'Midway Milestone',
                scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'delivered',
                icon: Heart,
            },
            {
                id: '4',
                name: 'Address & Utilities Transfer',
                scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                status: 'scheduled',
                icon: Settings,
            },
            {
                id: '5',
                name: 'Thank You Card',
                scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                status: 'pending',
                icon: Mail,
            },
            {
                id: '6',
                name: 'Celebratory Dinner',
                scheduledDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
                status: 'pending',
                icon: Utensils,
            },
        ],
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    };

    // Use mock data for demo - replace with actual giftPackage prop
    const activePackage = giftPackage || mockGiftPackage;
    const hasPackage = !!activePackage;

    if (!hasPackage) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Gift className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Gift Package</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                        Create a gift package to wow {clientName} with thoughtful touchpoints throughout
                        their transaction journey
                    </p>
                    <Button onClick={onCreatePackage}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Gift Package
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const tierInfo = TIER_COLORS[activePackage.tier];
    const progress = (activePackage.completedTouchpoints / activePackage.totalTouchpoints) * 100;

    return (
        <>
            <Card className={`${tierInfo.border} ${tierInfo.bg} border-2`}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="h-5 w-5" />
                                Client Gift Package
                            </CardTitle>
                            <CardDescription>
                                Automated touchpoints to create a memorable experience
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className={`capitalize ${tierInfo.text}`}>
                            {activePackage.tier} Tier
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Touchpoints Progress</span>
                            <span className="text-muted-foreground">
                                {activePackage.completedTouchpoints} of {activePackage.totalTouchpoints} completed
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Next Scheduled */}
                    {activePackage.nextScheduled && (
                        <div className="p-3 bg-background/50 rounded-lg border">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Next Gift Scheduled</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(activePackage.nextScheduled, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Touchpoints */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Recent Activity</p>
                        <div className="space-y-2">
                            {activePackage.touchpoints
                                .filter(t => t.status === 'delivered')
                                .slice(0, 3)
                                .map((touchpoint) => {
                                    const Icon = touchpoint.icon;
                                    return (
                                        <div
                                            key={touchpoint.id}
                                            className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-background/50 transition-colors"
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="flex-1 truncate">{touchpoint.name}</span>
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowDetailsDialog(true)}
                        >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Calendar className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Gift Package Details
                        </DialogTitle>
                        <DialogDescription>
                            Complete touchpoint timeline for {clientName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {/* Package Info */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className={`p-4 rounded-lg ${tierInfo.bg} border ${tierInfo.border}`}>
                                <p className="text-sm text-muted-foreground">Package Tier</p>
                                <p className={`text-lg font-semibold capitalize ${tierInfo.text}`}>
                                    {activePackage.tier}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Transaction Type</p>
                                <p className="text-lg font-semibold capitalize">
                                    {activePackage.transactionType}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="text-lg font-semibold">
                                    {formatDistanceToNow(activePackage.createdAt, { addSuffix: true })}
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h4 className="font-semibold mb-4">Touchpoint Timeline</h4>
                            <div className="space-y-4">
                                {activePackage.touchpoints
                                    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
                                    .map((touchpoint, index) => {
                                        const Icon = touchpoint.icon;
                                        const isLast = index === activePackage.touchpoints.length - 1;
                                        const isCompleted = touchpoint.status === 'delivered';
                                        const isScheduled = touchpoint.status === 'scheduled';

                                        return (
                                            <div key={touchpoint.id} className="relative">
                                                {/* Timeline Line */}
                                                {!isLast && (
                                                    <div
                                                        className={`absolute left-5 top-12 w-0.5 h-full ${isCompleted ? 'bg-green-500/30' : 'bg-border'
                                                            }`}
                                                    />
                                                )}

                                                <div className="flex gap-4 items-start">
                                                    {/* Timeline Dot */}
                                                    <div className="relative z-10 flex-shrink-0">
                                                        <div
                                                            className={`h-10 w-10 rounded-full flex items-center justify-center border-4 border-background ${isCompleted
                                                                    ? 'bg-green-500/10 border-green-500/30'
                                                                    : isScheduled
                                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                                        : 'bg-muted border-border'
                                                                }`}
                                                        >
                                                            <Icon
                                                                className={`h-4 w-4 ${isCompleted
                                                                        ? 'text-green-600'
                                                                        : isScheduled
                                                                            ? 'text-blue-600'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pb-6">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <h5 className="font-medium">{touchpoint.name}</h5>
                                                            <Badge
                                                                variant={
                                                                    isCompleted ? 'default' :
                                                                        isScheduled ? 'secondary' : 'outline'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {touchpoint.status === 'delivered' && (
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                )}
                                                                {touchpoint.status === 'scheduled' && (
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                )}
                                                                {touchpoint.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {touchpoint.scheduledDate > new Date()
                                                                ? `Scheduled for ${formatDistanceToNow(touchpoint.scheduledDate, { addSuffix: true })}`
                                                                : `Sent ${formatDistanceToNow(touchpoint.scheduledDate, { addSuffix: true })}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
