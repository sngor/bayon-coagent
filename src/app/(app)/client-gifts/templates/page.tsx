'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HubLayout } from '@/components/hub/hub-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Gift,
    Package,
    Calendar,
    CheckCircle2,
    Users,
    Settings,
    Heart,
    Mail,
    Utensils,
    Truck,
    KeyRound,
    Home,
    Sparkles,
    Plus,
} from 'lucide-react';

type GiftPackageTier = 'gold' | 'platinum' | 'diamond' | 'titanium';

interface GiftTemplate {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    icon: React.ComponentType<{ className?: string }>;
    timing: string;
    tier: GiftPackageTier[];
    category: 'essential' | 'milestone' | 'premium' | 'luxury';
    estimatedCost: string;
}

const GIFT_TEMPLATES: GiftTemplate[] = [
    {
        id: 'personal-concierge',
        name: 'Personal Concierge Service',
        description: 'Dedicated support throughout the entire journey',
        longDescription: 'Direct line to a Personal Concierge for assistance with information and/or coordination of services in your area (i.e. scheduling of movers, restaurant reservations, etc.)',
        icon: Users,
        timing: 'Ongoing during entire package',
        tier: ['titanium'],
        category: 'luxury',
        estimatedCost: '$200-300',
    },
    {
        id: 'under-contract-gift',
        name: 'Under Contract Gift',
        description: 'Celebrate the milestone with a stress-relief kit',
        longDescription: 'Stress Relief Kit: Includes Calming Tea, Head Scalp Massager, Advil, & Custom Pen with Notepad that reads: "Things for someone else to Worry About"',
        icon: Gift,
        timing: 'Day 1-4',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
        category: 'essential',
        estimatedCost: '$50-75',
    },
    {
        id: 'moving-supplies',
        name: 'Moving Supplies Package',
        description: 'Everything needed for a smooth move',
        longDescription: '14 Various Size Boxes, 4 Rolls of SmartMove Tape, Tape Dispenser, Wrapping Paper - all essentials for an organized move',
        icon: Package,
        timing: 'Day 6-10',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
        category: 'essential',
        estimatedCost: '$75-100',
    },
    {
        id: 'address-utilities',
        name: 'Address & Utilities Transfer Assistance',
        description: 'Simplify the transition to the new home',
        longDescription: 'Email Link to Central Portal that Facilitates Setup and Transfer of US Mail, Utilities, and Cable - making the move-in process seamless',
        icon: Settings,
        timing: 'Day 21-25',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
        category: 'essential',
        estimatedCost: '$25-40',
    },
    {
        id: 'midway-surprise',
        name: 'Midway Milestone Surprise',
        description: 'Celebrate progress toward the finish line',
        longDescription: 'Deluxe Gift Box filled with Gourmet Snacks and Congratulatory Message - a morale boost when they need it most',
        icon: Heart,
        timing: 'Day 17-21',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
        category: 'milestone',
        estimatedCost: '$60-90',
    },
    {
        id: 'thank-you-card',
        name: 'Handwritten Thank You Card',
        description: 'Express sincere gratitude at closing',
        longDescription: 'Handwritten Thank You Card at Closing, Expressing Sincere Gratitude in Working Together - a personal touch that leaves a lasting impression',
        icon: Mail,
        timing: 'Day 30-45',
        tier: ['gold', 'platinum', 'diamond', 'titanium'],
        category: 'milestone',
        estimatedCost: '$15-25',
    },
    {
        id: 'home-essentials',
        name: 'New Home Essentials Kit',
        description: 'First-night essentials for the new home',
        longDescription: 'Curated box with cleaning supplies, light bulbs, batteries, basic tools, and a welcome doormat',
        icon: Home,
        timing: 'Day 28-32',
        tier: ['platinum', 'diamond', 'titanium'],
        category: 'premium',
        estimatedCost: '$80-120',
    },
    {
        id: 'celebratory-dinner',
        name: 'Celebratory Dinner for 2',
        description: 'Premium dining experience with transportation',
        longDescription: "Client's Choice of Restaurant, Transportation Credit for Round-Trip To/From Residence. All Payments and Gratuity Included. Maximum budget within reason.",
        icon: Utensils,
        timing: 'Day 60-75',
        tier: ['diamond', 'titanium'],
        category: 'luxury',
        estimatedCost: '$250-400',
    },
    {
        id: 'housewarming-basket',
        name: 'Premium Housewarming Basket',
        description: 'Locally-sourced gourmet treats',
        longDescription: 'Curated basket featuring local artisan products, premium coffee/tea, gourmet snacks, and a personalized welcome message',
        icon: Sparkles,
        timing: 'Day 35-40',
        tier: ['diamond', 'titanium'],
        category: 'premium',
        estimatedCost: '$120-180',
    },
    {
        id: 'smart-home-package',
        name: 'Smart Home Starter Package',
        description: 'Modern smart home essentials',
        longDescription: 'Smart doorbell, smart locks, or smart thermostat - help them modernize their new home',
        icon: KeyRound,
        timing: 'Day 45-50',
        tier: ['titanium'],
        category: 'luxury',
        estimatedCost: '$200-350',
    },
];

const TIER_COLORS = {
    gold: 'border-yellow-500/30 bg-yellow-500/5',
    platinum: 'border-gray-500/30 bg-gray-500/5',
    diamond: 'border-blue-500/30 bg-blue-500/5',
    titanium: 'border-purple-500/30 bg-purple-500/5',
};

const CATEGORY_LABELS = {
    essential: { label: 'Essential', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
    milestone: { label: 'Milestone', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
    premium: { label: 'Premium', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
    luxury: { label: 'Luxury', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
};

export default function ClientGiftsTemplatesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredTemplates = GIFT_TEMPLATES.filter(
        template => selectedCategory === 'all' || template.category === selectedCategory
    );

    const hubTabs = [
        { id: 'packages', label: 'Gift Packages', href: '/client-gifts', icon: Gift },
        { id: 'templates', label: 'Templates', href: '/client-gifts/templates', icon: Package },
        { id: 'calendar', label: 'Calendar', href: '/client-gifts/calendar', icon: Calendar },
        { id: 'analytics', label: 'Analytics', href: '/client-gifts/analytics', icon: CheckCircle2 },
    ];

    return (
        <HubLayout
            title="Gift Templates"
            description="Pre-designed gift touchpoints to create memorable client experiences"
            icon={Package}
            tabs={hubTabs}
        >
            {/* Category Filter */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All Templates</TabsTrigger>
                    <TabsTrigger value="essential">Essential</TabsTrigger>
                    <TabsTrigger value="milestone">Milestone</TabsTrigger>
                    <TabsTrigger value="premium">Premium</TabsTrigger>
                    <TabsTrigger value="luxury">Luxury</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                                <Gift className="h-6 w-6 text-yellow-600" />
                            </div>
                            <p className="text-2xl font-bold">{GIFT_TEMPLATES.filter(t => t.tier.includes('gold')).length}</p>
                            <p className="text-sm text-muted-foreground">Gold Tier</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-gray-500/10 flex items-center justify-center mx-auto">
                                <Sparkles className="h-6 w-6 text-gray-600" />
                            </div>
                            <p className="text-2xl font-bold">{GIFT_TEMPLATES.filter(t => t.tier.includes('platinum')).length}</p>
                            <p className="text-sm text-muted-foreground">Platinum Tier</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                                <Heart className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold">{GIFT_TEMPLATES.filter(t => t.tier.includes('diamond')).length}</p>
                            <p className="text-sm text-muted-foreground">Diamond Tier</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold">{GIFT_TEMPLATES.filter(t => t.tier.includes('titanium')).length}</p>
                            <p className="text-sm text-muted-foreground">Titanium Tier</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                    const Icon = template.icon;
                    const categoryInfo = CATEGORY_LABELS[template.category];

                    return (
                        <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {template.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Long Description */}
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {template.longDescription}
                                </p>

                                {/* Category Badge */}
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={categoryInfo.color}>
                                        {categoryInfo.label}
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {template.estimatedCost}
                                    </span>
                                </div>

                                {/* Timing */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{template.timing}</span>
                                </div>

                                {/* Tier Badges */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Available in:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {template.tier.map((tier) => (
                                            <Badge
                                                key={tier}
                                                variant="outline"
                                                className={`capitalize ${TIER_COLORS[tier]}`}
                                            >
                                                {tier}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button variant="outline" className="w-full" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to Package
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Custom Template CTA */}
            <Card className="mt-8 border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Need a Custom Template?</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                        Create your own custom gift touchpoint tailored to your clients' unique preferences
                    </p>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Template
                    </Button>
                </CardContent>
            </Card>
        </HubLayout>
    );
}
