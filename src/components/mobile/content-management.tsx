'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
    Plus,
    Edit3,
    Trash2,
    Save,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    FileText,
    MessageSquare,
    TrendingUp,
    StickyNote,
    Home,
    Users,
    Search,
    Filter,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    offlineContentManager,
    ContentDraft,
    ContentCreationRequest,
    ContentEditRequest,
    generateContentPreview,
    formatContentType,
    getContentTypeIcon,
    validateContentDraft
} from '@/lib/offline-content-manager';
import { OfflineStatusIndicator } from './offline-status-indicator';
import { useUser } from '@/aws/auth/use-user';

// Helper functions
function getStatusBadgeVariant(status: ContentDraft['syncStatus']) {
    switch (status) {
        case 'synced': return 'default' as const;
        case 'pending': return 'secondary' as const;
        case 'syncing': return 'secondary' as const;
        case 'failed': return 'destructive' as const;
        case 'conflict': return 'destructive' as const;
        default: return 'outline' as const;
    }
}

function getStatusIcon(status: ContentDraft['syncStatus']) {
    switch (status) {
        case 'synced': return CheckCircle;
        case 'pending': return Clock;
        case 'syncing': return RefreshCw;
        case 'failed': return AlertTriangle;
        case 'conflict': return AlertTriangle;
        default: return FileText;
    }
}

export interface ContentManagementProps {
    className?: string;
    defaultType?: ContentDraft['type'];
    onContentCreated?: (content: ContentDraft) => void;
    onContentEdited?: (content: ContentDraft) => void;
    onContentDeleted?: (contentId: string) => void;
}

/**
 * Mobile Content Management Component
 * 
 * Provides comprehensive offline content creation, editing, and management
 */
export function ContentManagement({
    className,
    defaultType,
    onContentCreated,
    onContentEdited,
    onContentDeleted
}: ContentManagementProps) {
    const { user } = useUser();
    const [drafts, setDrafts] = useState<ContentDraft[]>([]);
    const [filteredDrafts, setFilteredDrafts] = useState<ContentDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<ContentDraft['type'] | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'local' | 'synced' | 'pending' | 'failed'>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<ContentDraft | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Load drafts
    const loadDrafts = async () => {
        try {
            setLoading(true);
            const allDrafts = await offlineContentManager.getAllDrafts(user?.id);
            setDrafts(allDrafts);
        } catch (error) {
            console.error('Failed to load drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter drafts based on search and filters
    useEffect(() => {
        let filtered = drafts;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(draft =>
                draft.title.toLowerCase().includes(query) ||
                generateContentPreview(draft.content).toLowerCase().includes(query) ||
                draft.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(draft => draft.type === typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(draft => draft.syncStatus === statusFilter);
        }

        setFilteredDrafts(filtered);
    }, [drafts, searchQuery, typeFilter, statusFilter]);

    // Initialize
    useEffect(() => {
        loadDrafts();
    }, [user?.id]);

    // Handle content creation
    const handleCreateContent = async (request: ContentCreationRequest) => {
        try {
            const content = await offlineContentManager.createContent({
                ...request,
                userId: user?.id
            });

            await loadDrafts();
            setIsCreateDialogOpen(false);

            if (onContentCreated) {
                onContentCreated(content);
            }
        } catch (error) {
            console.error('Failed to create content:', error);
        }
    };

    // Handle content editing
    const handleEditContent = async (request: ContentEditRequest) => {
        try {
            const content = await offlineContentManager.editContent(request);

            await loadDrafts();
            setIsEditDialogOpen(false);
            setEditingContent(null);

            if (onContentEdited) {
                onContentEdited(content);
            }
        } catch (error) {
            console.error('Failed to edit content:', error);
        }
    };

    // Handle content deletion
    const handleDeleteContent = async (contentId: string) => {
        try {
            await offlineContentManager.deleteDraft(contentId);
            await loadDrafts();

            if (onContentDeleted) {
                onContentDeleted(contentId);
            }
        } catch (error) {
            console.error('Failed to delete content:', error);
        }
    };

    // Handle sync trigger
    const handleSyncTrigger = async () => {
        await loadDrafts();
    };

    // Get status badge variant
    const getStatusBadgeVariant = (status: ContentDraft['syncStatus']) => {
        switch (status) {
            case 'synced': return 'default';
            case 'pending': return 'secondary';
            case 'syncing': return 'secondary';
            case 'failed': return 'destructive';
            case 'conflict': return 'destructive';
            default: return 'outline';
        }
    };

    // Get status icon
    const getStatusIcon = (status: ContentDraft['syncStatus']) => {
        switch (status) {
            case 'synced': return CheckCircle;
            case 'pending': return Clock;
            case 'syncing': return RefreshCw;
            case 'failed': return AlertTriangle;
            case 'conflict': return AlertTriangle;
            default: return FileText;
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header with offline status */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-headline text-2xl font-bold">Content Management</h2>
                    <p className="text-muted-foreground">Create and manage content offline</p>
                </div>
                <OfflineStatusIndicator compact onSyncTrigger={handleSyncTrigger} />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="blog">Blog Post</SelectItem>
                            <SelectItem value="social">Social Media</SelectItem>
                            <SelectItem value="market-update">Market Update</SelectItem>
                            <SelectItem value="notes">Notes</SelectItem>
                            <SelectItem value="listing-description">Listing</SelectItem>
                            <SelectItem value="meeting-prep">Meeting Prep</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="synced">Synced</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    <CreateContentDialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                        onCreateContent={handleCreateContent}
                        defaultType={defaultType}
                    />
                </div>
            </div>

            {/* Content list */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading content...</span>
                    </div>
                ) : filteredDrafts.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-headline text-lg font-medium mb-2">No content found</h3>
                            <p className="text-muted-foreground mb-4">
                                {drafts.length === 0
                                    ? "Create your first piece of content to get started"
                                    : "Try adjusting your search or filters"
                                }
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Content
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    filteredDrafts.map((draft) => (
                        <ContentCard
                            key={draft.id}
                            draft={draft}
                            onEdit={(draft) => {
                                setEditingContent(draft);
                                setIsEditDialogOpen(true);
                            }}
                            onDelete={handleDeleteContent}
                        />
                    ))
                )}
            </div>

            {/* Edit dialog */}
            {editingContent && (
                <EditContentDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    content={editingContent}
                    onEditContent={handleEditContent}
                />
            )}
        </div>
    );
}

/**
 * Content Card Component
 */
interface ContentCardProps {
    draft: ContentDraft;
    onEdit: (draft: ContentDraft) => void;
    onDelete: (contentId: string) => void;
}

function ContentCard({ draft, onEdit, onDelete }: ContentCardProps) {
    const StatusIcon = getStatusIcon(draft.syncStatus);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getContentTypeIcon(draft.type)}</span>
                            <h3 className="font-headline font-medium truncate">{draft.title}</h3>
                            <Badge variant={getStatusBadgeVariant(draft.syncStatus)} className="text-xs">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {draft.syncStatus}
                            </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                            {generateContentPreview(draft.content, 120)}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{formatContentType(draft.type)}</span>
                            <span>•</span>
                            <span>Modified {new Date(draft.lastModified).toLocaleDateString()}</span>
                            {draft.metadata?.tags && draft.metadata.tags.length > 0 && (
                                <>
                                    <span>•</span>
                                    <div className="flex space-x-1">
                                        {draft.metadata.tags.slice(0, 2).map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {draft.metadata.tags.length > 2 && (
                                            <span className="text-muted-foreground">+{draft.metadata.tags.length - 2}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(draft)}
                        >
                            <Edit3 className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{draft.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(draft.id)}>
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Create Content Dialog
 */
interface CreateContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateContent: (request: ContentCreationRequest) => void;
    defaultType?: ContentDraft['type'];
}

function CreateContentDialog({
    open,
    onOpenChange,
    onCreateContent,
    defaultType
}: CreateContentDialogProps) {
    const [formData, setFormData] = useState({
        type: defaultType || 'blog' as ContentDraft['type'],
        title: '',
        content: '',
        tags: '',
        category: '',
        targetAudience: '',
        platform: ''
    });
    const [errors, setErrors] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const validationErrors = validateContentDraft({
            title: formData.title,
            type: formData.type,
            content: formData.content
        });

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Create content
        const request: ContentCreationRequest = {
            type: formData.type,
            title: formData.title,
            content: formData.content,
            metadata: {
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                category: formData.category || undefined,
                targetAudience: formData.targetAudience || undefined,
                platform: formData.platform || undefined,
            }
        };

        onCreateContent(request);

        // Reset form
        setFormData({
            type: defaultType || 'blog',
            title: '',
            content: '',
            tags: '',
            category: '',
            targetAudience: '',
            platform: ''
        });
        setErrors([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Content</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            <ul className="text-sm text-destructive space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Content Type</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ContentDraft['type'] }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="blog">Blog Post</SelectItem>
                                    <SelectItem value="social">Social Media</SelectItem>
                                    <SelectItem value="market-update">Market Update</SelectItem>
                                    <SelectItem value="notes">Notes</SelectItem>
                                    <SelectItem value="listing-description">Listing Description</SelectItem>
                                    <SelectItem value="meeting-prep">Meeting Prep</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                placeholder="e.g., Market Analysis"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter content title..."
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter your content..."
                            rows={8}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="tags">Tags</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div>
                            <Label htmlFor="targetAudience">Target Audience</Label>
                            <Input
                                id="targetAudience"
                                value={formData.targetAudience}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                                placeholder="e.g., First-time buyers"
                            />
                        </div>
                    </div>

                    {formData.type === 'social' && (
                        <div>
                            <Label htmlFor="platform">Platform</Label>
                            <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="twitter">Twitter</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Create Content
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Edit Content Dialog
 */
interface EditContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: ContentDraft;
    onEditContent: (request: ContentEditRequest) => void;
}

function EditContentDialog({
    open,
    onOpenChange,
    content,
    onEditContent
}: EditContentDialogProps) {
    const [formData, setFormData] = useState({
        title: content.title,
        content: content.content,
        tags: content.metadata?.tags?.join(', ') || '',
        category: content.metadata?.category || '',
        targetAudience: content.metadata?.targetAudience || '',
        platform: content.metadata?.platform || ''
    });
    const [errors, setErrors] = useState<string[]>([]);

    // Update form data when content changes
    useEffect(() => {
        setFormData({
            title: content.title,
            content: content.content,
            tags: content.metadata?.tags?.join(', ') || '',
            category: content.metadata?.category || '',
            targetAudience: content.metadata?.targetAudience || '',
            platform: content.metadata?.platform || ''
        });
    }, [content]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const validationErrors = validateContentDraft({
            title: formData.title,
            type: content.type,
            content: formData.content
        });

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Edit content
        const request: ContentEditRequest = {
            id: content.id,
            title: formData.title,
            content: formData.content,
            metadata: {
                ...content.metadata,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                category: formData.category || undefined,
                targetAudience: formData.targetAudience || undefined,
                platform: formData.platform || undefined,
            }
        };

        onEditContent(request);
        setErrors([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Content</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            <ul className="text-sm text-destructive space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Content Type</Label>
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                                <span>{getContentTypeIcon(content.type)}</span>
                                <span>{formatContentType(content.type)}</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                placeholder="e.g., Market Analysis"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter content title..."
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter your content..."
                            rows={8}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="tags">Tags</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div>
                            <Label htmlFor="targetAudience">Target Audience</Label>
                            <Input
                                id="targetAudience"
                                value={formData.targetAudience}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                                placeholder="e.g., First-time buyers"
                            />
                        </div>
                    </div>

                    {content.type === 'social' && (
                        <div>
                            <Label htmlFor="platform">Platform</Label>
                            <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="twitter">Twitter</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}