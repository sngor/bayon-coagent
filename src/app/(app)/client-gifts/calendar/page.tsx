'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HubLayout } from '@/components/hub/hub-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Gift,
    Package,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Users,
    Mail,
    Heart,
    Settings,
    Utensils,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

interface ScheduledGift {
    id: string;
    clientName: string;
    giftName: string;
    scheduledDate: Date;
    status: 'pending' | 'sent' | 'delivered';
    icon: React.ComponentType<{ className?: string }>;
}

// Mock scheduled gifts data
const SCHEDULED_GIFTS: ScheduledGift[] = [
    {
        id: '1',
        clientName: 'Sarah Johnson',
        giftName: 'Moving Supplies Package',
        scheduledDate: new Date(2025, 11, 2),
        status: 'pending',
        icon: Package,
    },
    {
        id: '2',
        clientName: 'Michael Chen',
        giftName: 'Under Contract Gift',
        scheduledDate: new Date(2025, 11, 5),
        status: 'pending',
        icon: Gift,
    },
    {
        id: '3',
        clientName: 'Emily Rodriguez',
        giftName: 'Midway Milestone Surprise',
        scheduledDate: new Date(2025, 11, 10),
        status: 'pending',
        icon: Heart,
    },
    {
        id: '4',
        clientName: 'James Wilson',
        giftName: 'Handwritten Thank You',
        scheduledDate: new Date(2025, 11, 15),
        status: 'pending',
        icon: Mail,
    },
    {
        id: '5',
        clientName: 'Sarah Johnson',
        giftName: 'Address & Utilities Transfer',
        scheduledDate: new Date(2025, 11, 18),
        status: 'sent',
        icon: Settings,
    },
    {
        id: '6',
        clientName: 'Amanda Parker',
        giftName: 'Celebratory Dinner',
        scheduledDate: new Date(2025, 11, 22),
        status: 'pending',
        icon: Utensils,
    },
    {
        id: '7',
        clientName: 'David Lee',
        giftName: 'Under Contract Gift',
        scheduledDate: new Date(2025, 11, 28),
        status: 'pending',
        icon: Gift,
    },
];

export default function ClientGiftsCalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get gifts for a specific date
    const getGiftsForDate = (date: Date) => {
        return SCHEDULED_GIFTS.filter(gift => isSameDay(gift.scheduledDate, date));
    };

    // Get upcoming gifts sorted by date
    const upcomingGifts = useMemo(() => {
        return [...SCHEDULED_GIFTS]
            .filter(gift => gift.scheduledDate >= new Date())
            .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    }, []);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    };

    const hubTabs = [
        { label: 'Gift Packages', href: '/client-gifts', icon: Gift },
        { label: 'Templates', href: '/client-gifts/templates', icon: Package },
        { label: 'Calendar', href: '/client-gifts/calendar', icon: CalendarIcon },
        { label: 'Analytics', href: '/client-gifts/analytics', icon: CheckCircle2 },
    ];

    return (
        <HubLayout
            title="Gift Calendar"
            description="View and manage your scheduled gift touchpoints"
            icon={CalendarIcon}
            tabs={hubTabs}
        >
            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
                <TabsList>
                    <TabsTrigger value="month">Month View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>
            </Tabs>

            {viewMode === 'month' ? (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Calendar */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </CardTitle>
                                    <CardDescription>
                                        {SCHEDULED_GIFTS.filter(g =>
                                            isSameMonth(g.scheduledDate, currentMonth)
                                        ).length} gifts scheduled this month
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {/* Day Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Empty cells for days before month starts */}
                                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2" />
                                ))}

                                {/* Calendar Days */}
                                {daysInMonth.map((day) => {
                                    const dayGifts = getGiftsForDate(day);
                                    const hasGifts = dayGifts.length > 0;
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrentDay = isToday(day);

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            onClick={() => handleDateClick(day)}
                                            className={`
                                                relative p-2 min-h-[80px] rounded-lg border transition-all
                                                ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                                                ${isCurrentDay ? 'ring-2 ring-primary/20' : ''}
                                                ${!hasGifts ? 'opacity-50' : ''}
                                            `}
                                        >
                                            {/* Day Number */}
                                            <div className="text-sm font-medium mb-1">
                                                {format(day, 'd')}
                                            </div>

                                            {/* Gift Indicators */}
                                            {hasGifts && (
                                                <div className="space-y-1">
                                                    {dayGifts.slice(0, 2).map((gift) => {
                                                        const Icon = gift.icon;
                                                        return (
                                                            <div
                                                                key={gift.id}
                                                                className={`
                                                                    text-xs p-1 rounded flex items-center gap-1 truncate
                                                                    ${gift.status === 'sent'
                                                                        ? 'bg-green-500/10 text-green-700'
                                                                        : 'bg-blue-500/10 text-blue-700'
                                                                    }
                                                                `}
                                                            >
                                                                <Icon className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">{gift.giftName}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayGifts.length > 2 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +{dayGifts.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Date Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a Date'}
                            </CardTitle>
                            <CardDescription>
                                {selectedDate
                                    ? `${getGiftsForDate(selectedDate).length} gift(s) scheduled`
                                    : 'Click on a date to view details'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedDate ? (
                                <div className="space-y-3">
                                    {getGiftsForDate(selectedDate).map((gift) => {
                                        const Icon = gift.icon;
                                        return (
                                            <div key={gift.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{gift.giftName}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {gift.clientName}
                                                        </p>
                                                        <Badge
                                                            variant={gift.status === 'sent' ? 'default' : 'secondary'}
                                                            className="mt-2 text-xs"
                                                        >
                                                            {gift.status === 'sent' ? (
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <Clock className="h-3 w-3 mr-1" />
                                                            )}
                                                            {gift.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No date selected</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* List View */
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Gifts</CardTitle>
                            <CardDescription>
                                All scheduled gifts in chronological order
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingGifts.map((gift, index) => {
                                    const Icon = gift.icon;
                                    const isLast = index === upcomingGifts.length - 1;

                                    return (
                                        <div key={gift.id} className="relative">
                                            {/* Timeline Line */}
                                            {!isLast && (
                                                <div className="absolute left-5 top-12 w-0.5 h-full bg-border" />
                                            )}

                                            <div className="flex gap-4 items-start">
                                                {/* Date Badge */}
                                                <div className="flex-shrink-0 w-24 text-right">
                                                    <div className="text-sm font-medium">
                                                        {format(gift.scheduledDate, 'MMM d')}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(gift.scheduledDate, 'yyyy')}
                                                    </div>
                                                </div>

                                                {/* Timeline Dot */}
                                                <div className="relative z-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                    </div>
                                                </div>

                                                {/* Gift Card */}
                                                <Card className="flex-1 hover:shadow-md transition-shadow">
                                                    <CardContent className="pt-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1 flex-1">
                                                                <h4 className="font-semibold">{gift.giftName}</h4>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <Users className="h-3 w-3" />
                                                                    {gift.clientName}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant={gift.status === 'sent' ? 'default' : 'secondary'}
                                                            >
                                                                {gift.status === 'sent' ? (
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                ) : (
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                )}
                                                                {gift.status}
                                                            </Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3 mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold">
                                {SCHEDULED_GIFTS.filter(g => g.status === 'pending').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Pending Gifts</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold">
                                {SCHEDULED_GIFTS.filter(g => g.status === 'sent').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Sent This Month</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                                <CalendarIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold">
                                {upcomingGifts.slice(0, 7).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Next 7 Days</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HubLayout>
    );
}
