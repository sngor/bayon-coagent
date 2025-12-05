'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
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
    Gift,
    Calendar,
    Users,
    Package,
    Heart,
    CheckCircle2,
    Clock,
    Home,
    Key,
    Truck,
    Utensils,
    Mail,
    Settings,
    Trash2,
    Eye,
    Copy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';
import { HubLayout } from '@/components/hub/hub-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Gift Package Types
type GiftPackageTier = 'gold' | 'platinum' | 'diamond' | 'titanium';
type TransactionType = 'buyer' | 'seller' | 'investor';
type GiftStatus = 'pending' | 'sent' | 'delivered' | 'scheduled';

interface GiftTouchpoint {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    timing: string; // e.g., "Day 1-4", "Day 30-45"
    tier: GiftPackageTier[];
}

interface ClientGiftPackage {
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    tier: GiftPackageTier;
    transactionType: TransactionType;
    status: GiftStatus;
    touchpoints: GiftTouchpoint[];
    nextScheduled?: Date;
    createdAt: number;
    updatedAt: number;
}

// Pre-defined gift touchpoints based on ClientGiant
const GIFT_TOUCHPOINTS: Record<string, GiftTouchpoint> = {
    personalConcierge: {
        id: 'personal-concierge',
        name: 'Personal Concierge',
        description: 'Direct line for assistance with movers, reservations, and services',
        icon: Users,
        timing: 'Ongoing during entire package',
        tier: ['titanium'],
    },
    underContractGift: {
        id: 'under-contract-gift',
        name: 'Under Contract Gift',
        description: 'Stress Relief Kit with calming tea, scalp massager, and custom notepad',
        icon: Gift,
        timing: 'Day 1-4',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
    },
    movingSupplies: {
        id: 'moving-supplies',
        name: 'Moving Supplies',
        description: 'Various size boxes, tape, dispenser, and wrapping paper',
        icon: Package,
        timing: 'Day 6-10',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
    },
    addressUtilities: {
        id: 'address-utilities',
        name: 'Address & Utilities Transfer',
        description: 'Portal link to facilitate mail forwarding and utility transfers',
        icon: Settings,
        timing: 'Day 21-25',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
    },
    midwaySurprise: {
        id: 'midway-surprise',
        name: 'Midway Milestone Surprise',
        description: 'Deluxe gift box with gourmet snacks and congratulatory message',
        icon: Heart,
        timing: 'Day 17-21',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
    },
    thankYouCard: {
        id: 'thank-you-card',
        name: 'Handwritten Thank You',
        description: 'Personalized handwritten card expressing sincere gratitude',
        icon: Mail,
        timing: 'Day 30-45',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
    },
    celebratoryDinner: {
        id: 'celebratory-dinner',
        name: 'Celebratory Dinner for 2',
        description: 'Choice restaurant with round-trip transportation included',
        icon: Utensils,
        timing: 'Day 60-75',
        tier: ['diamond', 'titanium'],
    },
};

// Package tier details
const PACKAGE_TIERS = {
    gold: {
        name: 'Gold',
        color: 'from-yellow-400/20 to-yellow-600/20',
        borderColor: 'border-yellow-500/30',
        description: 'Essential touchpoints for a great client experience',
        price: '$299',
        touchpoints: 5,
    },
    platinum: {
        name: 'Platinum',
        color: 'from-gray-400/20 to-gray-600/20',
        borderColor: 'border-gray-500/30',
        description: 'Enhanced experience with premium touches',
        price: '$499',
        touchpoints: 6,
    },
    diamond: {
        name: 'Diamond',
        color: 'from-blue-400/20 to-blue-600/20',
        borderColor: 'border-blue-500/30',
        description: 'Luxury experience with celebratory extras',
        price: '$799',
        touchpoints: 7,
    },
    titanium: {
        name: 'Titanium',
        color: 'from-purple-400/20 to-purple-600/20',
        borderColor: 'border-purple-500/30',
        description: 'Ultimate VIP experience with personal concierge',
        price: '$1,299',
        touchpoints: 8,
    },
};

export default function ClientGiftsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [giftPackages, setGiftPackages] = useState<ClientGiftPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');

    // Mock data for demonstration - Replace with actual API calls
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // Simulate loading gift packages
        setTimeout(() => {
            setGiftPackages([
                {
                    id: '1',
                    clientId: 'client-1',
                    clientName: 'Sarah Johnson',
                    clientEmail: 'sarah.j@example.com',
                    tier: 'diamond',
                    transactionType: 'buyer',
                    status: 'sent',
                    touchpoints: Object.values(GIFT_TOUCHPOINTS).filter(t =>
                        t.tier.includes('diamond')
                    ),
                    nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
                    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                },
                {
                    id: '2',
                    clientId: 'client-2',
                    clientName: 'Michael Chen',
                    clientEmail: 'michael.chen@example.com',
                    tier: 'platinum',
                    transactionType: 'seller',
                    status: 'scheduled',
                    touchpoints: Object.values(GIFT_TOUCHPOINTS).filter(t =>
                        t.tier.includes('platinum')
                    ),
                    nextScheduled: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
                    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
                },
            ]);
            setIsLoading(false);
        }, 1000);
    }, [user]);

    // Filter packages
    const filteredPackages = useMemo(() => {
        let filtered = giftPackages;

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                pkg =>
                    pkg.clientName.toLowerCase().includes(query) ||
                    pkg.clientEmail.toLowerCase().includes(query) ||
                    pkg.tier.toLowerCase().includes(query)
            );
        }

        // Filter by status tab
        if (activeTab !== 'all') {
            if (activeTab === 'active') {
                filtered = filtered.filter(pkg => pkg.status === 'sent' || pkg.status === 'delivered');
            } else if (activeTab === 'scheduled') {
                filtered = filtered.filter(pkg => pkg.status === 'scheduled' || pkg.status === 'pending');
            } else if (activeTab === 'completed') {
                filtered = filtered.filter(pkg => pkg.status === 'delivered');
            }
        }

        return filtered;
    }, [giftPackages, searchQuery, activeTab]);

    const handleCreatePackage = () => {
        router.push('/client-gifts/new');
    };

    if (isUserLoading || isLoading) {
        return <StandardSkeleton variant="card" count={6} />;
    }

    if (!user) {
        return (
            <IntelligentEmptyState
                icon={Gift}
                title="Authentication Required"
                description="Please log in to manage client gifts"
                actions={[
                    {
                        label: 'Go to Login',
                        onClick: () => router.push('/login'),
                    },
                ]}
            />
        );
    }

    const hubTabs = [
        { label: 'Gift Packages', href: '/client-gifts', icon: Gift },
        { label: 'Templates', href: '/client-gifts/templates', icon: Package },
        { label: 'Calendar', href: '/client-gifts/calendar', icon: Calendar },
        { label: 'Analytics', href: '/client-gifts/analytics', icon: CheckCircle2 },
    ];

    return (
        <HubLayout
            title="Client Gifts"
            description="Create memorable client experiences with thoughtful, automated gift touchpoints"
            icon={Gift}
            tabs={hubTabs}
            actions={
                <Button onClick={handleCreatePackage} size="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Gift Package
                </Button>
            }
        >
            {/* Package Tiers Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {Object.entries(PACKAGE_TIERS).map(([key, tier]) => (
                    <Card key={key} className={`bg-gradient-to-br ${tier.color} border ${tier.borderColor}`}>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">{tier.name}</h3>
                                <p className="text-2xl font-bold">{tier.price}</p>
                                <p className="text-sm text-muted-foreground">{tier.touchpoints} touchpoints</p>
                                <p className="text-xs text-muted-foreground">{tier.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All Packages</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by client name, email, or tier..."
                    />
                </div>
            </div>

            {/* Gift Packages List */}
            {filteredPackages.length === 0 ? (
                <IntelligentEmptyState
                    icon={Gift}
                    title={searchQuery ? 'No Packages Found' : 'No Gift Packages Yet'}
                    description={
                        searchQuery
                            ? 'Try adjusting your search criteria'
                            : 'Create your first gift package to start delighting your clients with memorable touchpoints'
                    }
                    actions={
                        !searchQuery
                            ? [
                                {
                                    label: 'Create Gift Package',
                                    onClick: handleCreatePackage,
                                },
                            ]
                            : []
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPackages.map((pkg) => {
                        const tierInfo = PACKAGE_TIERS[pkg.tier];

                        return (
                            <Card
                                key={pkg.id}
                                className={`hover:shadow-md transition-shadow cursor-pointer overflow-hidden bg-gradient-to-br ${tierInfo.color} border ${tierInfo.borderColor}`}
                                onClick={() => router.push(`/client-gifts/${pkg.id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate flex items-center gap-2">
                                                <Gift className="h-4 w-4" />
                                                {pkg.clientName}
                                            </CardTitle>
                                            <CardDescription className="truncate">
                                                {pkg.clientEmail}
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
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate Package
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Package Info */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Package Tier</span>
                                        <Badge variant="outline" className="capitalize">
                                            {tierInfo.name}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Transaction Type</span>
                                        <Badge variant="secondary" className="capitalize">
                                            <Home className="h-3 w-3 mr-1" />
                                            {pkg.transactionType}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        <Badge
                                            variant={
                                                pkg.status === 'delivered' ? 'default' :
                                                    pkg.status === 'sent' ? 'default' :
                                                        pkg.status === 'scheduled' ? 'secondary' : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {pkg.status}
                                        </Badge>
                                    </div>

                                    {/* Touchpoints Count */}
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Touchpoints</span>
                                            <span className="font-medium">{pkg.touchpoints.length}</span>
                                        </div>
                                    </div>

                                    {/* Next Scheduled */}
                                    {pkg.nextScheduled && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                            <Clock className="h-3 w-3" />
                                            Next: {formatDistanceToNow(pkg.nextScheduled, { addSuffix: true })}
                                        </div>
                                    )}

                                    {/* Last Updated */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        Updated {formatDistanceToNow(pkg.updatedAt, { addSuffix: true })}
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
