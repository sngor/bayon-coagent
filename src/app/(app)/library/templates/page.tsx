'use client';

import { useState, useEffect, useMemo } from 'react';
import { StandardCard } from '@/components/standard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { getUserTemplates, getTemplate } from '@/services/publishing/template-service';
import { Template, ContentCategory, TemplateBrowserConfig } from '@/lib/content-workflow-types';
import {
    Search,
    Filter,
    Grid3X3,
    List,
    Calendar,
    Users,
    Star,
    Clock,
    MoreVertical,
    FileText,
    Mail,
    PenTool,
    Home,
    TrendingUp,
    Video,
    Newspaper,
    Eye,
    Edit,
    Share2,
    Trash2,
    Copy,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

// Content type icons mapping
const contentTypeIcons = {
    [ContentCategory.BLOG_POST]: FileText,
    [ContentCategory.SOCIAL_MEDIA]: PenTool,
    [ContentCategory.LISTING_DESCRIPTION]: Home,
    [ContentCategory.MARKET_UPDATE]: TrendingUp,
    [ContentCategory.NEIGHBORHOOD_GUIDE]: Home,
    [ContentCategory.VIDEO_SCRIPT]: Video,
    [ContentCategory.NEWSLETTER]: Newspaper,
    [ContentCategory.EMAIL_TEMPLATE]: Mail,
};

// Seasonal tags for current time-based recommendations
const getCurrentSeasonalTags = (): string[] => {
    const now = new Date();
    const month = now.getMonth();
    const tags: string[] = [];

    // Winter (Dec, Jan, Feb)
    if (month === 11 || month === 0 || month === 1) {
        tags.push('winter', 'holiday', 'new-year', 'cozy-homes');
    }
    // Spring (Mar, Apr, May)
    else if (month >= 2 && month <= 4) {
        tags.push('spring', 'home-buying-season', 'fresh-start', 'garden');
    }
    // Summer (Jun, Jul, Aug)
    else if (month >= 5 && month <= 7) {
        tags.push('summer', 'vacation-homes', 'outdoor-living', 'family-time');
    }
    // Fall (Sep, Oct, Nov)
    else {
        tags.push('fall', 'autumn', 'back-to-school', 'harvest', 'thanksgiving');
    }

    return tags;
};

interface TemplateCardProps {
    template: Template;
    viewMode: 'grid' | 'list';
    onPreview: (template: Template) => void;
    onUse: (template: Template) => void;
    onEdit: (template: Template) => void;
    onShare: (template: Template) => void;
    onDelete: (template: Template) => void;
    onDuplicate: (template: Template) => void;
    isApplying?: boolean;
}

function TemplateCard({
    template,
    viewMode,
    onPreview,
    onUse,
    onEdit,
    onShare,
    onDelete,
    onDuplicate,
    isApplying = false
}: TemplateCardProps) {
    const IconComponent = contentTypeIcons[template.contentType] || FileText;
    const isRecent = template.lastUsed && new Date(template.lastUsed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isPopular = template.usageCount > 10;

    if (viewMode === 'list') {
        return (
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <IconComponent className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-medium text-sm truncate">{template.name}</h3>
                                    {template.isSeasonal && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Seasonal
                                        </Badge>
                                    )}
                                    {template.isShared && (
                                        <Badge variant="outline" className="text-xs">
                                            <Users className="w-3 h-3 mr-1" />
                                            Shared
                                        </Badge>
                                    )}
                                    {isRecent && (
                                        <Badge variant="default" className="text-xs">
                                            Recent
                                        </Badge>
                                    )}
                                    {isPopular && (
                                        <Badge variant="default" className="text-xs">
                                            <Star className="w-3 h-3 mr-1" />
                                            Popular
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {template.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                                    <span>Used {template.usageCount} times</span>
                                    <span>•</span>
                                    <span>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPreview(template)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onUse(template)}
                                disabled={isApplying}
                            >
                                {isApplying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    'Use Template'
                                )}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(template)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(template)}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onShare(template)}>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete(template)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                                {template.name}
                            </CardTitle>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(template)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(template)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(template)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(template)}
                                className="text-destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {template.isSeasonal && (
                        <Badge variant="secondary" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Seasonal
                        </Badge>
                    )}
                    {template.isShared && (
                        <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Shared
                        </Badge>
                    )}
                    {isRecent && (
                        <Badge variant="default" className="text-xs">
                            Recent
                        </Badge>
                    )}
                    {isPopular && (
                        <Badge variant="default" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <CardDescription className="text-xs line-clamp-2 mb-3">
                    {template.description}
                </CardDescription>
                {template.previewImage && (
                    <div className="w-full h-24 bg-muted rounded-md mb-3 overflow-hidden">
                        <img
                            src={template.previewImage}
                            alt={`${template.name} preview`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Used {template.usageCount} times</span>
                    <span>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="pt-0 space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(template)}
                    className="flex-1"
                >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUse(template)}
                    className="flex-1"
                    disabled={isApplying}
                >
                    {isApplying ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        'Use Template'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

function TemplateSkeletonCard({ viewMode }: { viewMode: 'grid' | 'list' }) {
    if (viewMode === 'list') {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="flex space-x-4">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="w-6 h-6" />
                </div>
                <div className="flex gap-1 mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="w-full h-24 rounded-md mb-3" />
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </CardContent>
            <CardFooter className="pt-0 space-x-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
            </CardFooter>
        </Card>
    );
}

export default function LibraryTemplatesPage() {
    const { user } = useUser();
    const { toast } = useToast();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'shared' | 'seasonal'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContentType, setSelectedContentType] = useState<ContentCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'usageCount' | 'lastUsed'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

    const currentSeasonalTags = useMemo(() => getCurrentSeasonalTags(), []);

    // Load templates
    useEffect(() => {
        if (!user?.id) return;

        const loadTemplates = async () => {
            setLoading(true);
            try {
                const result = await getUserTemplates({
                    userId: user.id,
                    searchQuery: searchQuery || undefined,
                    sortBy,
                    sortOrder
                });

                if (result.success && result.templates) {
                    setTemplates(result.templates);
                } else {
                    toast({
                        title: 'Error loading templates',
                        description: result.error || 'Failed to load templates',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                console.error('Error loading templates:', error);
                toast({
                    title: 'Error loading templates',
                    description: 'An unexpected error occurred',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        loadTemplates();
    }, [user?.id, searchQuery, sortBy, sortOrder, toast]);

    // Filter templates based on active tab and filters
    const filteredTemplates = useMemo(() => {
        let filtered = templates;

        // Filter by tab
        switch (activeTab) {
            case 'personal':
                filtered = filtered.filter(t => !t.isShared);
                break;
            case 'shared':
                filtered = filtered.filter(t => t.isShared);
                break;
            case 'seasonal':
                filtered = filtered.filter(t => t.isSeasonal);
                break;
        }

        // Filter by content type
        if (selectedContentType !== 'all') {
            filtered = filtered.filter(t => t.contentType === selectedContentType);
        }

        return filtered;
    }, [templates, activeTab, selectedContentType]);

    // Get seasonal recommendations
    const seasonalRecommendations = useMemo(() => {
        return templates.filter(t =>
            t.isSeasonal &&
            t.seasonalTags?.some(tag => currentSeasonalTags.includes(tag))
        ).slice(0, 3);
    }, [templates, currentSeasonalTags]);

    // Template actions
    const handlePreview = (template: Template) => {
        // TODO: Implement template preview modal
        toast({
            title: 'Preview Template',
            description: `Previewing ${template.name}`,
        });
    };

    const handleUse = async (template: Template) => {
        setApplyingTemplateId(template.id);

        try {
            // Import the apply template action
            const { applyTemplateAction } = await import('@/features/content-engine/actions/content-workflow-actions');

            const result = await applyTemplateAction(template.id);

            if (result.success && result.data) {
                const { template: appliedTemplate, populatedConfiguration } = result.data;

                // Create URL parameters for the Studio page based on template content type
                const studioRoutes: Record<ContentCategory, string> = {
                    [ContentCategory.MARKET_UPDATE]: '/studio/write?tab=market-update',
                    [ContentCategory.BLOG_POST]: '/studio/write?tab=blog-post',
                    [ContentCategory.VIDEO_SCRIPT]: '/studio/write?tab=video-script',
                    [ContentCategory.NEIGHBORHOOD_GUIDE]: '/studio/write?tab=guide',
                    [ContentCategory.SOCIAL_MEDIA]: '/studio/write?tab=social',
                    [ContentCategory.LISTING_DESCRIPTION]: '/studio/describe',
                    [ContentCategory.NEWSLETTER]: '/studio/write?tab=newsletter',
                    [ContentCategory.EMAIL_TEMPLATE]: '/studio/write?tab=email'
                };

                const studioRoute = studioRoutes[appliedTemplate.contentType] || '/studio/write';

                // Store template configuration in sessionStorage for the Studio page to pick up
                sessionStorage.setItem('applied-template', JSON.stringify({
                    templateId: appliedTemplate.id,
                    templateName: appliedTemplate.name,
                    contentType: appliedTemplate.contentType,
                    configuration: populatedConfiguration,
                    appliedAt: new Date().toISOString()
                }));

                // Navigate to the appropriate Studio page
                window.location.href = studioRoute;

                toast({
                    title: 'Template Applied!',
                    description: `${template.name} has been applied. Redirecting to Studio...`,
                });
            } else {
                toast({
                    title: 'Error applying template',
                    description: result.message || 'Failed to apply template',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error applying template:', error);
            toast({
                title: 'Error applying template',
                description: 'An unexpected error occurred',
                variant: 'destructive'
            });
        } finally {
            setApplyingTemplateId(null);
        }
    };

    const handleEdit = (template: Template) => {
        // TODO: Implement template editing
        toast({
            title: 'Edit Template',
            description: `Editing ${template.name}`,
        });
    };

    const handleShare = (template: Template) => {
        // TODO: Implement template sharing
        toast({
            title: 'Share Template',
            description: `Sharing ${template.name}`,
        });
    };

    const handleDelete = (template: Template) => {
        // TODO: Implement template deletion
        toast({
            title: 'Delete Template',
            description: `Deleting ${template.name}`,
        });
    };

    const handleDuplicate = (template: Template) => {
        // TODO: Implement template duplication
        toast({
            title: 'Duplicate Template',
            description: `Duplicating ${template.name}`,
        });
    };

    if (!user) {
        return (
            <div className="space-y-6">
                <StandardCard title="Authentication Required">
                    <p>Please sign in to access your templates.</p>
                </StandardCard>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Templates</h1>
                    <p className="text-muted-foreground">
                        Save and reuse your best-performing content templates
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Seasonal Recommendations */}
            {seasonalRecommendations.length > 0 && (
                <StandardCard
                    title="Seasonal Recommendations"
                    description="Templates perfect for this time of year"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {seasonalRecommendations.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                viewMode="grid"
                                onPreview={handlePreview}
                                onUse={handleUse}
                                onEdit={handleEdit}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                isApplying={applyingTemplateId === template.id}
                            />
                        ))}
                    </div>
                </StandardCard>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search templates by name, description, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={selectedContentType} onValueChange={(value) => setSelectedContentType(value as ContentCategory | 'all')}>
                        <SelectTrigger className="w-48">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.values(ContentCategory).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {(type as string).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                        const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                    }}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt-desc">Newest First</SelectItem>
                            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem value="name-asc">Name A-Z</SelectItem>
                            <SelectItem value="name-desc">Name Z-A</SelectItem>
                            <SelectItem value="usageCount-desc">Most Used</SelectItem>
                            <SelectItem value="usageCount-asc">Least Used</SelectItem>
                            <SelectItem value="lastUsed-desc">Recently Used</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Template Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Templates</TabsTrigger>
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="shared">Shared</TabsTrigger>
                    <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {loading ? (
                        <div className={cn(
                            "grid gap-4",
                            viewMode === 'grid'
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "grid-cols-1"
                        )}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TemplateSkeletonCard key={i} viewMode={viewMode} />
                            ))}
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <StandardCard>
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? "Try adjusting your search or filters"
                                        : "Create your first template to get started"
                                    }
                                </p>
                                {!searchQuery && (
                                    <Button>
                                        Create Template
                                    </Button>
                                )}
                            </div>
                        </StandardCard>
                    ) : (
                        <div className={cn(
                            "grid gap-4",
                            viewMode === 'grid'
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "grid-cols-1"
                        )}>
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    viewMode={viewMode}
                                    onPreview={handlePreview}
                                    onUse={handleUse}
                                    onEdit={handleEdit}
                                    onShare={handleShare}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    isApplying={applyingTemplateId === template.id}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
