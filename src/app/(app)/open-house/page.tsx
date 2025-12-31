'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SearchInput } from '@/components/ui/search-input';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
    Plus,
    Calendar,
    MapPin,
    Users,
    Clock,
    Home,
    BarChart3,
    FileText,
    Share2,
    Download,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    QrCode,
    MessageSquare,
    TrendingUp,
    Star,
    Phone,
    Mail,
    Copy,
    ExternalLink
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils/common';

interface OpenHouseEvent {
    id: string;
    title: string;
    description: string;
    propertyAddress: string;
    propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial';
    price: number;
    startDate: string;
    endDate: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    attendeeCount: number;
    leadCount: number;
    registrations: number;
    materials: {
        flyers: boolean;
        signage: boolean;
        brochures: boolean;
        feedback_forms: boolean;
    };
    marketing: {
        social_media: boolean;
        email_campaign: boolean;
        website_listing: boolean;
        mls_promotion: boolean;
    };
    analytics: {
        views: number;
        inquiries: number;
        follow_ups: number;
        conversion_rate: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface EventFormData {
    title: string;
    description: string;
    propertyAddress: string;
    propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial';
    price: number;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

const PROPERTY_TYPES = [
    { value: 'single-family', label: 'Single Family Home' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'multi-family', label: 'Multi-Family' },
    { value: 'commercial', label: 'Commercial' }
];

const EVENT_TEMPLATES = [
    {
        id: 'luxury',
        name: 'Luxury Home Showcase',
        description: 'Premium open house experience for high-end properties',
        features: ['Professional photography', 'Catered refreshments', 'Private tours', 'Valet parking']
    },
    {
        id: 'first-time-buyer',
        name: 'First-Time Buyer Event',
        description: 'Educational open house for new homebuyers',
        features: ['Mortgage calculator', 'Buying process guide', 'Q&A session', 'Local area information']
    },
    {
        id: 'investor',
        name: 'Investment Property Tour',
        description: 'Focused on rental potential and ROI analysis',
        features: ['ROI calculations', 'Rental market analysis', 'Property management info', 'Tax benefits overview']
    },
    {
        id: 'standard',
        name: 'Standard Open House',
        description: 'Traditional open house format',
        features: ['Property tour', 'Information packets', 'Guest registration', 'Follow-up scheduling']
    }
];

export default function OpenHousePage() {
    const { user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'events' | 'templates' | 'analytics' | 'materials'>('events');
    const [events, setEvents] = useState<OpenHouseEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'active' | 'completed' | 'cancelled'>('all');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<OpenHouseEvent | null>(null);

    // Form state
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        propertyAddress: '',
        propertyType: 'single-family',
        price: 0,
        startDate: '',
        endDate: '',
        startTime: '10:00',
        endTime: '14:00'
    });

    useEffect(() => {
        if (user) {
            loadEvents();
        }
    }, [user]);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            // Mock data - replace with actual API call
            const mockEvents: OpenHouseEvent[] = [
                {
                    id: '1',
                    title: 'Beautiful Family Home Open House',
                    description: 'Stunning 4-bedroom home in desirable neighborhood with modern updates throughout.',
                    propertyAddress: '123 Maple Street, Springfield, IL 62701',
                    propertyType: 'single-family',
                    price: 425000,
                    startDate: '2024-01-15',
                    endDate: '2024-01-15',
                    status: 'scheduled',
                    attendeeCount: 0,
                    leadCount: 0,
                    registrations: 12,
                    materials: {
                        flyers: true,
                        signage: true,
                        brochures: true,
                        feedback_forms: false
                    },
                    marketing: {
                        social_media: true,
                        email_campaign: true,
                        website_listing: true,
                        mls_promotion: false
                    },
                    analytics: {
                        views: 245,
                        inquiries: 8,
                        follow_ups: 3,
                        conversion_rate: 0
                    },
                    createdAt: '2024-01-01T10:00:00Z',
                    updatedAt: '2024-01-01T10:00:00Z'
                },
                {
                    id: '2',
                    title: 'Luxury Condo Showcase',
                    description: 'Premium downtown condo with city views and high-end finishes.',
                    propertyAddress: '456 Downtown Plaza, Unit 2501, Springfield, IL 62702',
                    propertyType: 'condo',
                    price: 650000,
                    startDate: '2024-01-08',
                    endDate: '2024-01-08',
                    status: 'completed',
                    attendeeCount: 28,
                    leadCount: 6,
                    registrations: 35,
                    materials: {
                        flyers: true,
                        signage: true,
                        brochures: true,
                        feedback_forms: true
                    },
                    marketing: {
                        social_media: true,
                        email_campaign: true,
                        website_listing: true,
                        mls_promotion: true
                    },
                    analytics: {
                        views: 412,
                        inquiries: 15,
                        follow_ups: 8,
                        conversion_rate: 21.4
                    },
                    createdAt: '2023-12-20T10:00:00Z',
                    updatedAt: '2024-01-08T16:00:00Z'
                }
            ];
            setEvents(mockEvents);
        } catch (error) {
            console.error('Failed to load events:', error);
            toast({
                title: "Failed to load events",
                description: "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!formData.title || !formData.propertyAddress || !formData.startDate) {
            toast({
                title: "Missing required fields",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        try {
            const newEvent: OpenHouseEvent = {
                id: Date.now().toString(),
                title: formData.title,
                description: formData.description,
                propertyAddress: formData.propertyAddress,
                propertyType: formData.propertyType,
                price: formData.price,
                startDate: formData.startDate,
                endDate: formData.endDate || formData.startDate,
                status: 'scheduled',
                attendeeCount: 0,
                leadCount: 0,
                registrations: 0,
                materials: {
                    flyers: false,
                    signage: false,
                    brochures: false,
                    feedback_forms: false
                },
                marketing: {
                    social_media: false,
                    email_campaign: false,
                    website_listing: false,
                    mls_promotion: false
                },
                analytics: {
                    views: 0,
                    inquiries: 0,
                    follow_ups: 0,
                    conversion_rate: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setEvents(prev => [newEvent, ...prev]);
            setShowCreateDialog(false);
            resetForm();
            toast({
                title: "Event created",
                description: "Your open house event has been created successfully.",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to create event",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;

        try {
            setEvents(prev => prev.filter(e => e.id !== eventToDelete));
            setShowDeleteDialog(false);
            setEventToDelete(null);
            toast({
                title: "Event deleted",
                description: "Open house event has been removed.",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to delete event",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            propertyAddress: '',
            propertyType: 'single-family',
            price: 0,
            startDate: '',
            endDate: '',
            startTime: '10:00',
            endTime: '14:00'
        });
    };

    const getStatusIcon = (status: OpenHouseEvent['status']) => {
        switch (status) {
            case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
            case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: OpenHouseEvent['status']) => {
        switch (status) {
            case 'scheduled': return 'default';
            case 'active': return 'default';
            case 'completed': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const filteredEvents = useMemo(() => {
        let filtered = events;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [events, statusFilter, searchQuery]);

    const eventStats = useMemo(() => {
        const total = events.length;
        const scheduled = events.filter(e => e.status === 'scheduled').length;
        const completed = events.filter(e => e.status === 'completed').length;
        const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0);
        const totalLeads = events.reduce((sum, e) => sum + e.leadCount, 0);
        const avgConversion = completed > 0 ? 
            events.filter(e => e.status === 'completed')
                  .reduce((sum, e) => sum + e.analytics.conversion_rate, 0) / completed : 0;

        return { total, scheduled, completed, totalAttendees, totalLeads, avgConversion };
    }, [events]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Open House Events</h1>
                    <p className="text-muted-foreground">
                        Plan, manage, and track your open house events with comprehensive analytics
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{eventStats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Events</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{eventStats.scheduled}</div>
                        <div className="text-sm text-muted-foreground">Scheduled</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{eventStats.completed}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{eventStats.totalAttendees}</div>
                        <div className="text-sm text-muted-foreground">Total Attendees</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{eventStats.totalLeads}</div>
                        <div className="text-sm text-muted-foreground">Total Leads</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-teal-600">{eventStats.avgConversion.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Avg Conversion</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'events' | 'templates' | 'materials' | 'analytics')}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="events">
                        <Calendar className="mr-2 h-4 w-4" />
                        Events ({events.length})
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="mr-2 h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="materials">
                        <Share2 className="mr-2 h-4 w-4" />
                        Materials
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <SearchInput
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    className="max-w-md"
                                />
                                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Events</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Events List */}
                    {isLoading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="pt-6">
                                        <div className="h-32 bg-muted rounded" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No open house events</h3>
                                <p className="text-muted-foreground text-center mb-6">
                                    Create your first open house event to start managing your property showings
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Event
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredEvents.map((event) => (
                                <Card key={event.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                                    <Badge variant={getStatusColor(event.status) as any} className="flex items-center gap-1">
                                                        {getStatusIcon(event.status)}
                                                        {event.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {event.description}
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{event.propertyAddress}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Home className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {PROPERTY_TYPES.find(t => t.value === event.propertyType)?.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {formatDate(event.startDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Price</div>
                                                        <div className="font-medium">${event.price.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Registrations</div>
                                                        <div className="font-medium">{event.registrations}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Attendees</div>
                                                        <div className="font-medium">{event.attendeeCount}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Leads</div>
                                                        <div className="font-medium">{event.leadCount}</div>
                                                    </div>
                                                </div>
                                                {event.status === 'completed' && (
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                                            {event.analytics.conversion_rate}% conversion
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-4 w-4 text-blue-500" />
                                                            {event.analytics.views} views
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-4 w-4 text-purple-500" />
                                                            {event.analytics.inquiries} inquiries
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Event
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Duplicate Event
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Export Data
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setEventToDelete(event.id);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Event
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Templates</CardTitle>
                            <CardDescription>
                                Pre-configured templates for different types of open house events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {EVENT_TEMPLATES.map((template) => (
                                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <h3 className="font-semibold mb-2">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {template.description}
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                {template.features.map((feature, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        <span className="text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button size="sm" className="w-full">
                                                Use Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Performance Analytics</CardTitle>
                            <CardDescription>
                                Track the success of your open house events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {events.filter(e => e.status === 'completed').length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
                                    <p className="text-muted-foreground">
                                        Complete some open house events to see performance analytics here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {events.filter(e => e.status === 'completed').map(event => (
                                        <div key={event.id} className="border rounded-lg p-4">
                                            <h4 className="font-semibold mb-4">{event.title}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {event.analytics.views}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Views</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {event.attendeeCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Attendees</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {event.leadCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Leads Generated</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {event.analytics.conversion_rate}%
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="materials" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketing Materials</CardTitle>
                            <CardDescription>
                                Create and manage materials for your open house events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="pt-6 text-center">
                                        <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">Flyers</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Create professional property flyers
                                        </p>
                                        <Button size="sm" className="w-full">Create Flyer</Button>
                                    </CardContent>
                                </Card>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="pt-6 text-center">
                                        <Home className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">Signage</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Design directional and yard signs
                                        </p>
                                        <Button size="sm" className="w-full">Create Signs</Button>
                                    </CardContent>
                                </Card>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="pt-6 text-center">
                                        <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">Registration</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Visitor registration forms
                                        </p>
                                        <Button size="sm" className="w-full">Create Forms</Button>
                                    </CardContent>
                                </Card>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="pt-6 text-center">
                                        <Share2 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">Social Media</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Social media promotion posts
                                        </p>
                                        <Button size="sm" className="w-full">Create Posts</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Event Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Open House Event</DialogTitle>
                        <DialogDescription>
                            Set up a new open house event with all the details and marketing materials.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Event Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., Beautiful Family Home Open House"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the property and event..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="propertyAddress">Property Address *</Label>
                            <Input
                                id="propertyAddress"
                                value={formData.propertyAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                                placeholder="123 Main Street, City, State ZIP"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="propertyType">Property Type</Label>
                                <Select 
                                    value={formData.propertyType} 
                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, propertyType: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                    placeholder="425000"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Event Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date (if multi-day)</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEvent}>
                            Create Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this open house event? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteEvent}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}