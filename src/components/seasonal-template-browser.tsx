'use client';

/**
 * Seasonal Template Browser Component
 * 
 * Displays seasonal templates with intelligent recommendations and proactive notifications.
 * Features time-based filtering, personalized suggestions, and seasonal opportunity alerts.
 * 
 * Requirements:
 * - 11.1: Display seasonal templates organized by time of year
 * - 11.2: Recommend relevant seasonal templates to the user
 * - 11.3: Customize template with user's brand information
 * - 11.4: Notify users of new or improved templates
 * - 11.5: Display all relevant templates when multiple seasonal events overlap
 */

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
    Calendar,
    Sparkles,
    TrendingUp,
    Bell,
    Search,
    Filter,
    Clock,
    Star,
    Leaf,
    Sun,
    Snowflake,
    MapPin,
    Users,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { ContentCategory, Template } from '@/lib/content-workflow-types';
import {
    getSeasonalTemplatesAction,
    getSeasonalNotificationsAction,
    applyTemplateAction
} from '@/features/content-engine/actions/content-workflow-actions';

interface SeasonalTemplateBrowserProps {
    onTemplateSelect?: (template: Template) => void;
    contentType?: ContentCategory;
    className?: string;
}

export function SeasonalTemplateBrowser({
    onTemplateSelect,
    contentType,
    className = ''
}: SeasonalTemplateBrowserProps) {
    const [isPending, startTransition] = useTransition();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [recommendations, setRecommendations] = useState<{
        current: Template[];
        upcoming: Template[];
        trending: Template[];
    }>({ current: [], upcoming: [], trending: [] });
    const [notifications, setNotifications] = useState<Array<{
        type: 'seasonal_opportunity' | 'template_update' | 'market_trend';
        title: string;
        message: string;
        templates: Template[];
        priority: 'high' | 'medium' | 'low';
        actionUrl?: string;
        expiresAt: Date;
    }>>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('current');

    // Season icons and colors
    const seasonConfig = {
        spring: { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50', name: 'Spring' },
        summer: { icon: Sun, color: 'text-yellow-600', bgColor: 'bg-yellow-50', name: 'Summer' },
        fall: { icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-50', name: 'Fall' },
        winter: { icon: Snowflake, color: 'text-blue-600', bgColor: 'bg-blue-50', name: 'Winter' }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const contentTypeLabels: Record<ContentCategory, string> = {
        [ContentCategory.MARKET_UPDATE]: 'Market Update',
        [ContentCategory.BLOG_POST]: 'Blog Post',
        [ContentCategory.VIDEO_SCRIPT]: 'Video Script',
        [ContentCategory.NEIGHBORHOOD_GUIDE]: 'Neighborhood Guide',
        [ContentCategory.SOCIAL_MEDIA]: 'Social Media Post',
        [ContentCategory.LISTING_DESCRIPTION]: 'Listing Description',
        [ContentCategory.NEWSLETTER]: 'Newsletter',
        [ContentCategory.EMAIL_TEMPLATE]: 'Email Template'
    };

    // Load seasonal templates and notifications
    useEffect(() => {
        loadSeasonalData();
    }, [selectedSeason, selectedMonth, contentType]);

    const loadSeasonalData = () => {
        startTransition(async () => {
            try {
                // Load seasonal templates
                const templatesResult = await getSeasonalTemplatesAction(
                    selectedSeason === 'all' ? undefined : selectedSeason,
                    selectedMonth,
                    contentType,
                    true
                );

                if (templatesResult.success) {
                    setTemplates(templatesResult.data?.templates || []);
                    setRecommendations(templatesResult.data?.recommendations || {
                        current: [],
                        upcoming: [],
                        trending: []
                    });
                }

                // Load seasonal notifications
                const notificationsResult = await getSeasonalNotificationsAction(14);
                if (notificationsResult.success) {
                    setNotifications(notificationsResult.data?.notifications || []);
                }
            } catch (error) {
                console.error('Failed to load seasonal data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Loading Failed',
                    description: 'Could not load seasonal templates. Please try again.',
                });
            }
        });
    };

    const handleTemplateSelect = async (template: Template) => {
        if (onTemplateSelect) {
            onTemplateSelect(template);
        } else {
            // Apply template and redirect to content creation
            try {
                const result = await applyTemplateAction(template.id);
                if (result.success) {
                    toast({
                        title: 'Template Applied',
                        description: `"${template.name}" is ready for customization.`,
                    });
                    // In a real app, this would redirect to the content creation page
                    window.location.href = `/studio/write?template=${template.id}`;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Template Error',
                    description: 'Could not apply template. Please try again.',
                });
            }
        }
    };

    const filteredTemplates = templates.filter(template => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                template.name.toLowerCase().includes(query) ||
                template.description.toLowerCase().includes(query) ||
                template.seasonalTags?.some(tag => tag.toLowerCase().includes(query))
            );
        }
        return true;
    });

    const renderTemplateCard = (template: Template, showSeasonalBadge = true) => {
        const seasonalTag = template.seasonalTags?.find(tag =>
            ['spring', 'summer', 'fall', 'winter'].includes(tag)
        );
        const SeasonIcon = seasonalTag ? seasonConfig[seasonalTag as keyof typeof seasonConfig]?.icon : Calendar;
        const seasonColor = seasonalTag ? seasonConfig[seasonalTag as keyof typeof seasonConfig]?.color : 'text-muted-foreground';

        return (
            <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTemplateSelect(template)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <SeasonIcon className={`h-4 w-4 ${seasonColor}`} />
                            <CardTitle className="text-sm font-medium line-clamp-1">
                                {template.name}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                            {template.usageCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    {template.usageCount}
                                </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <CardDescription className="text-xs line-clamp-2">
                        {template.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="outline" className="text-xs">
                            {contentTypeLabels[template.contentType]}
                        </Badge>
                        {showSeasonalBadge && template.isSeasonal && (
                            <Badge variant="secondary" className="text-xs">
                                Seasonal
                            </Badge>
                        )}
                        {template.seasonalTags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs capitalize">
                                {tag.replace('-', ' ')}
                            </Badge>
                        ))}
                    </div>
                    {template.configuration.stylePreferences.tone && (
                        <p className="text-xs text-muted-foreground">
                            Tone: {template.configuration.stylePreferences.tone}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderNotifications = () => {
        if (notifications.length === 0) return null;

        return (
            <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Seasonal Opportunities
                </h3>
                {notifications.slice(0, 3).map((notification, index) => (
                    <Alert key={index} className={`${notification.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                        notification.priority === 'medium' ? 'border-blue-200 bg-blue-50' :
                            'border-gray-200 bg-gray-50'
                        }`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">{notification.title}</AlertTitle>
                        <AlertDescription className="text-xs">
                            {notification.message}
                            {notification.templates.length > 0 && (
                                <span className="block mt-1 font-medium">
                                    {notification.templates.length} template{notification.templates.length > 1 ? 's' : ''} available
                                </span>
                            )}
                        </AlertDescription>
                    </Alert>
                ))}
            </div>
        );
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Seasonal Templates
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Timely templates personalized for your market and brand
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {renderNotifications()}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search seasonal templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Seasons</SelectItem>
                            <SelectItem value="spring">Spring</SelectItem>
                            <SelectItem value="summer">Summer</SelectItem>
                            <SelectItem value="fall">Fall</SelectItem>
                            <SelectItem value="winter">Winter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedMonth?.toString() || 'all'}
                        onValueChange={(value) => setSelectedMonth(value === 'all' ? undefined : parseInt(value))}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {monthNames.map((month, index) => (
                                <SelectItem key={month} value={(index + 1).toString()}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Template Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="current" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Current ({recommendations.current.length})
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Upcoming ({recommendations.upcoming.length})
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Trending ({recommendations.trending.length})
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        All ({filteredTemplates.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Templates relevant for the current season and market conditions
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.current.map(template => renderTemplateCard(template))}
                    </div>
                    {recommendations.current.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No current seasonal templates available</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Get ahead of the season with upcoming templates
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.upcoming.map(template => renderTemplateCard(template))}
                    </div>
                    {recommendations.upcoming.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming seasonal templates available</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="trending" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Popular templates for peak seasonal performance
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.trending.map(template => renderTemplateCard(template))}
                    </div>
                    {recommendations.trending.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No trending seasonal templates available</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        All seasonal templates matching your filters
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => renderTemplateCard(template))}
                    </div>
                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No templates match your current filters</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedSeason('all');
                                    setSelectedMonth(undefined);
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {isPending && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}