'use client';

/**
 * Listings Content Component
 * 
 * Client component for displaying and managing listings.
 * Handles listing selection, filtering, and publishing workflow.
 * 
 * Requirements:
 * - 2.2: Display imported listings with all standard fields
 * - 4.4: Display performance metrics for each listing
 * - 5.2: Show MLS sync status and last sync time
 */

import { useState, useEffect } from 'react';
import { Listing } from '@/integrations/mls/types';
import { getUserListings, getListingPosts } from '@/app/social-publishing-actions';
import { SocialPublishingDialog } from '@/components/social-publishing-dialog';
import { ListingMetricsDisplay } from '@/components/listing-metrics-display';
import { useUser } from '@/aws/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Home,
    MapPin,
    Bed,
    Bath,
    Maximize,
    Share2,
    Calendar,
    Facebook,
    Instagram,
    Linkedin,
    Loader2,
    AlertCircle,
    Eye,
    RefreshCw,
    CheckCircle2,
    Clock,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ListingStatus = 'active' | 'pending' | 'sold' | 'expired';
type PropertyTypeFilter = 'all' | 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Land';

export function ListingsContent() {
    const { user } = useUser();
    const [listings, setListings] = useState<Listing[]>([]);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('all');
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    useEffect(() => {
        loadListings();
    }, []);

    useEffect(() => {
        filterListings();
    }, [listings, searchQuery, statusFilter, propertyTypeFilter]);

    const loadListings = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getUserListings();

            if (result.success && result.listings) {
                setListings(result.listings);
                // Set last sync time to now (in production, this would come from the API)
                setLastSyncTime(new Date());
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load listings');
        } finally {
            setIsLoading(false);
        }
    };

    const filterListings = () => {
        let filtered = [...listings];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        // Filter by property type
        if (propertyTypeFilter !== 'all') {
            filtered = filtered.filter(l => l.propertyType === propertyTypeFilter);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(l =>
                l.address.street?.toLowerCase().includes(query) ||
                l.address.city?.toLowerCase().includes(query) ||
                l.mlsNumber?.toLowerCase().includes(query) ||
                l.propertyType?.toLowerCase().includes(query)
            );
        }

        setFilteredListings(filtered);
    };

    const handleViewDetails = (listing: Listing) => {
        setSelectedListing(listing);
        setDetailDialogOpen(true);
    };

    const handlePublishClick = (listing: Listing) => {
        setSelectedListing(listing);
        setPublishDialogOpen(true);
    };

    const handlePublishSuccess = () => {
        // Reload listings to show updated post counts
        loadListings();
    };

    const handleRefreshSync = async () => {
        // In production, this would trigger a manual sync
        await loadListings();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: ListingStatus) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'sold':
                return 'bg-blue-100 text-blue-800';
            case 'expired':
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Loading listings...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-medium mb-2">Failed to load listings</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadListings}>Try Again</Button>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Home className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Connect your MLS account in Settings to automatically import your listings.
                </p>
                <Button onClick={() => window.location.href = '/settings'}>
                    Go to Settings
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Sync Status Bar */}
                {lastSyncTime && (
                    <Card className="bg-muted/50">
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">MLS Sync Active</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        Last synced: {lastSyncTime.toLocaleTimeString()} on{' '}
                                        {lastSyncTime.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefreshSync}
                                disabled={isLoading}
                            >
                                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                                Refresh
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by address, MLS number, or property type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as ListingStatus | 'all')}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={propertyTypeFilter}
                        onValueChange={(value) => setPropertyTypeFilter(value as PropertyTypeFilter)}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Property type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Single Family">Single Family</SelectItem>
                            <SelectItem value="Condo">Condo</SelectItem>
                            <SelectItem value="Townhouse">Townhouse</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                            <SelectItem value="Land">Land</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {filteredListings.length} of {listings.length} listing
                        {listings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Listings Grid */}
                {filteredListings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No listings match your filters</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredListings.map((listing) => (
                            <ListingCard
                                key={listing.listingId}
                                listing={listing}
                                onViewDetails={() => handleViewDetails(listing)}
                                onPublish={() => handlePublishClick(listing)}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                                getStatusColor={getStatusColor}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Dialog */}
            {selectedListing && user && (
                <ListingDetailDialog
                    listing={selectedListing}
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    onPublish={() => {
                        setDetailDialogOpen(false);
                        setPublishDialogOpen(true);
                    }}
                    userId={user.id}
                />
            )}

            {/* Publishing Dialog */}
            {selectedListing && (
                <SocialPublishingDialog
                    listing={selectedListing}
                    open={publishDialogOpen}
                    onOpenChange={setPublishDialogOpen}
                    onSuccess={handlePublishSuccess}
                />
            )}
        </>
    );
}

interface ListingDetailDialogProps {
    listing: Listing;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPublish: () => void;
    userId: string;
}

function ListingDetailDialog({
    listing,
    open,
    onOpenChange,
    onPublish,
    userId,
}: ListingDetailDialogProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        if (open && listing.listingId) {
            loadPosts();
        }
    }, [open, listing.listingId]);

    const loadPosts = async () => {
        if (!listing.listingId) return;

        setIsLoadingPosts(true);
        try {
            const result = await getListingPosts(listing.listingId);
            if (result.success && result.posts) {
                setPosts(result.posts);
            }
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'facebook':
                return <Facebook className="h-4 w-4 text-blue-600" />;
            case 'instagram':
                return <Instagram className="h-4 w-4 text-pink-600" />;
            case 'linkedin':
                return <Linkedin className="h-4 w-4 text-blue-700" />;
            default:
                return null;
        }
    };

    const publishedPosts = posts.filter(p => p.status === 'published');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {listing.address.street}
                    </DialogTitle>
                    <DialogDescription>
                        {listing.address.city}, {listing.address.state} {listing.address.zip} • MLS# {listing.mlsNumber}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="metrics">Metrics</TabsTrigger>
                        <TabsTrigger value="posts">Social Posts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Photos Gallery */}
                        {listing.photos && listing.photos.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {listing.photos.slice(0, 6).map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || `Photo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {listing.photos.length > 6 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        +{listing.photos.length - 6} more photos
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Property Details */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Price</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatPrice(listing.price)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                                    <p className="text-lg font-semibold">{listing.bedrooms}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                                    <p className="text-lg font-semibold">{listing.bathrooms}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Square Feet</p>
                                    <p className="text-lg font-semibold">
                                        {listing.squareFeet.toLocaleString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Property Type</p>
                                    <p className="text-lg font-semibold">{listing.propertyType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className="capitalize">{listing.status}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">List Date</p>
                                    <p className="text-lg font-semibold">
                                        {new Date(listing.listDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-line">
                                    {listing.description}
                                </p>
                            </div>
                        )}

                        {/* Features */}
                        {listing.features && listing.features.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Features</h3>
                                <div className="flex flex-wrap gap-2">
                                    {listing.features.map((feature, index) => (
                                        <Badge key={index} variant="secondary">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Publish Button */}
                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={onPublish} size="lg">
                                <Share2 className="h-4 w-4 mr-2" />
                                Publish to Social Media
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="metrics" className="space-y-4">
                        {userId && listing.listingId ? (
                            <ListingMetricsDisplay
                                userId={userId}
                                listingId={listing.listingId}
                            />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No metrics available
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="posts" className="space-y-4">
                        {isLoadingPosts ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : publishedPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    This listing hasn't been published to social media yet
                                </p>
                                <Button onClick={onPublish}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Publish Now
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {publishedPosts.map((post) => (
                                    <Card key={post.postId}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getPlatformIcon(post.platform)}
                                                    <div>
                                                        <p className="font-semibold capitalize">
                                                            {post.platform}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Published{' '}
                                                            {new Date(post.publishedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {post.platformPostUrl && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={post.platformPostUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View Post
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {post.content}
                                            </p>
                                            {post.hashtags && post.hashtags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    {post.hashtags.slice(0, 5).map((tag: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {post.hashtags.length > 5 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{post.hashtags.length - 5} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

interface ListingCardProps {
    listing: Listing;
    onViewDetails: () => void;
    onPublish: () => void;
    formatPrice: (price: number) => string;
    formatDate: (date: string) => string;
    getStatusColor: (status: ListingStatus) => string;
}

function ListingCard({
    listing,
    onViewDetails,
    onPublish,
    formatPrice,
    formatDate,
    getStatusColor,
}: ListingCardProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [listing.listingId]);

    const loadPosts = async () => {
        if (!listing.listingId) return;

        setIsLoadingPosts(true);
        try {
            const result = await getListingPosts(listing.listingId);
            if (result.success && result.posts) {
                setPosts(result.posts);
            }
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const primaryPhoto = listing.photos?.[0];
    const publishedPlatforms = posts
        .filter(p => p.status === 'published')
        .map(p => p.platform);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
                {primaryPhoto ? (
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="relative h-48 bg-gray-100 w-full cursor-pointer group"
                        aria-label="View listing details"
                    >
                        <img
                            src={primaryPhoto.url}
                            alt={listing.address.street || 'Property'}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <Badge
                            className={cn(
                                'absolute top-3 right-3',
                                getStatusColor(listing.status as ListingStatus)
                            )}
                        >
                            {listing.status}
                        </Badge>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="h-48 bg-gray-100 flex items-center justify-center w-full cursor-pointer hover:bg-gray-200 transition-colors"
                        aria-label="View listing details"
                    >
                        <Home className="h-12 w-12 text-gray-400" />
                    </button>
                )}
            </CardHeader>

            <CardContent className="p-4 space-y-3">
                <button
                    type="button"
                    onClick={onViewDetails}
                    className="text-left w-full"
                    aria-label={`View details for ${listing.address.street}`}
                >
                    <div className="text-2xl font-bold text-primary hover:underline">
                        {formatPrice(listing.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        MLS# {listing.mlsNumber}
                    </div>
                </button>

                <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                        <div>{listing.address.street}</div>
                        <div className="text-muted-foreground">
                            {listing.address.city}, {listing.address.state} {listing.address.zip}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{listing.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span>{listing.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span>{listing.squareFeet.toLocaleString()} sqft</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Listed {formatDate(listing.listDate)}</span>
                </div>

                {/* Published Platforms */}
                {publishedPlatforms.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Published on:</span>
                        <div className="flex gap-1">
                            {publishedPlatforms.includes('facebook') && (
                                <Facebook className="h-4 w-4 text-blue-600" />
                            )}
                            {publishedPlatforms.includes('instagram') && (
                                <Instagram className="h-4 w-4 text-pink-600" />
                            )}
                            {publishedPlatforms.includes('linkedin') && (
                                <Linkedin className="h-4 w-4 text-blue-700" />
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    onClick={onViewDetails}
                    variant="outline"
                    className="flex-1"
                >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                </Button>
                <Button
                    onClick={onPublish}
                    className="flex-1"
                    variant={publishedPlatforms.length > 0 ? 'outline' : 'default'}
                    disabled={listing.status === 'sold' || listing.status === 'expired'}
                >
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish
                </Button>
            </CardFooter>
        </Card>
    );
}
