'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    FileText,
    Image,
    MessageSquare,
    CheckCircle,
    Flag,
    EyeOff,
    Search,
    Filter,
    Calendar,
    User,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { getContentForModeration, moderateContent } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { ModerationItem } from '@/services/admin/content-moderation-service';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'approved', label: 'Approved', color: 'bg-green-500' },
    { value: 'flagged', label: 'Flagged', color: 'bg-red-500' },
    { value: 'hidden', label: 'Hidden', color: 'bg-gray-500' },
];

const CONTENT_TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'blog_post', label: 'Blog Post' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'description', label: 'Description' },
    { value: 'image', label: 'Image' },
];

const CONTENT_TYPE_ICONS = {
    blog_post: FileText,
    social_media: MessageSquare,
    description: FileText,
    image: Image,
};

export default function ContentModerationPage() {
    const [items, setItems] = useState<ModerationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('pending');
    const [contentType, setContentType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        action: 'approve' | 'flag' | 'hide' | null;
        item: ModerationItem | null;
    }>({ open: false, action: null, item: null });
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        loadContent();
    }, [status, contentType]);

    async function loadContent() {
        setIsLoading(true);
        try {
            const result = await getContentForModeration({
                status: status !== 'all' ? status : undefined,
                contentType: contentType !== 'all' ? contentType : undefined,
                limit: 50,
            });

            if (result.success && result.data) {
                setItems(result.data.items);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load content',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load content:', error);
            toast({
                title: 'Error',
                description: 'Failed to load content for moderation',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    function openActionDialog(action: 'approve' | 'flag' | 'hide', item: ModerationItem) {
        setActionDialog({ open: true, action, item });
        setReason('');
    }

    function closeActionDialog() {
        setActionDialog({ open: false, action: null, item: null });
        setReason('');
    }

    async function handleModerateAction() {
        if (!actionDialog.action || !actionDialog.item) return;

        if ((actionDialog.action === 'flag' || actionDialog.action === 'hide') && !reason.trim()) {
            toast({
                title: 'Error',
                description: 'Please provide a reason',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await moderateContent(
                actionDialog.item.contentId,
                actionDialog.action,
                reason.trim() || undefined
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                closeActionDialog();
                loadContent();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to moderate content',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to moderate content:', error);
            toast({
                title: 'Error',
                description: 'Failed to moderate content',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleBulkAction(action: 'approve' | 'flag' | 'hide') {
        if (selectedItems.size === 0) {
            toast({
                title: 'Error',
                description: 'Please select items to moderate',
                variant: 'destructive',
            });
            return;
        }

        if ((action === 'flag' || action === 'hide') && !reason.trim()) {
            toast({
                title: 'Error',
                description: 'Please provide a reason for bulk action',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        let successCount = 0;
        let failCount = 0;

        for (const contentId of selectedItems) {
            try {
                const result = await moderateContent(contentId, action, reason.trim() || undefined);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }

        toast({
            title: 'Bulk Action Complete',
            description: `${successCount} succeeded, ${failCount} failed`,
        });

        setSelectedItems(new Set());
        setReason('');
        setIsSubmitting(false);
        loadContent();
    }

    function toggleItemSelection(contentId: string) {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(contentId)) {
            newSelection.delete(contentId);
        } else {
            newSelection.add(contentId);
        }
        setSelectedItems(newSelection);
    }

    function toggleSelectAll() {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.contentId)));
        }
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getStatusBadge(status: string) {
        const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
        return (
            <Badge variant="outline" className={`${statusOption?.color} text-white`}>
                {statusOption?.label || status}
            </Badge>
        );
    }

    function getContentTypeIcon(type: string) {
        const Icon = CONTENT_TYPE_ICONS[type as keyof typeof CONTENT_TYPE_ICONS] || FileText;
        return <Icon className="h-4 w-4" />;
    }

    const filteredItems = items.filter(item => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.title.toLowerCase().includes(query) ||
                item.userName.toLowerCase().includes(query) ||
                item.userEmail.toLowerCase().includes(query) ||
                item.content.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
                    <p className="text-muted-foreground">
                        Review and moderate user-generated content
                    </p>
                </div>
                <Button onClick={loadContent} variant="outline" disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {/* Filters */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle>Filters</CardTitle>
                                <CardDescription>Filter content by status and type</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Content Type Filter */}
                            <div className="space-y-2">
                                <Label>Content Type</Label>
                                <Select value={contentType} onValueChange={setContentType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONTENT_TYPE_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search content..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardContent className="relative z-10 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium">
                                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Reason for bulk action..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-64"
                                    />
                                    <Button
                                        onClick={() => handleBulkAction('approve')}
                                        variant="outline"
                                        size="sm"
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve All
                                    </Button>
                                    <Button
                                        onClick={() => handleBulkAction('flag')}
                                        variant="outline"
                                        size="sm"
                                        disabled={isSubmitting}
                                    >
                                        <Flag className="h-4 w-4 mr-2" />
                                        Flag All
                                    </Button>
                                    <Button
                                        onClick={() => handleBulkAction('hide')}
                                        variant="outline"
                                        size="sm"
                                        disabled={isSubmitting}
                                    >
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Hide All
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            )}

            {/* Content Table */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle>Content Queue</CardTitle>
                                    <CardDescription>
                                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No content found matching your filters
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.size === items.length && items.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded"
                                                    aria-label="Select all items"
                                                />
                                            </TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item) => (
                                            <TableRow key={item.contentId}>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(item.contentId)}
                                                        onChange={() => toggleItemSelection(item.contentId)}
                                                        className="rounded"
                                                        aria-label={`Select ${item.title}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getContentTypeIcon(item.contentType)}
                                                        <span className="text-sm capitalize">
                                                            {item.contentType.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="text-left hover:underline max-w-xs truncate block"
                                                    >
                                                        {item.title}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{item.userName}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.userEmail}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(item.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            onClick={() => openActionDialog('approve', item)}
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={item.status === 'approved'}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => openActionDialog('flag', item)}
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={item.status === 'flagged'}
                                                        >
                                                            <Flag className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => openActionDialog('hide', item)}
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={item.status === 'hidden'}
                                                        >
                                                            <EyeOff className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Content Preview Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedItem?.title}</DialogTitle>
                        <DialogDescription>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{selectedItem?.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{selectedItem && formatDate(selectedItem.createdAt)}</span>
                                </div>
                                {selectedItem && getStatusBadge(selectedItem.status)}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Content</Label>
                            <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                {selectedItem?.content}
                            </div>
                        </div>
                        {selectedItem?.moderationNote && (
                            <div>
                                <Label>Moderation Note</Label>
                                <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    {selectedItem.moderationNote}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>
                            Close
                        </Button>
                        {selectedItem && selectedItem.status !== 'approved' && (
                            <Button onClick={() => {
                                openActionDialog('approve', selectedItem);
                                setSelectedItem(null);
                            }}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialog.open} onOpenChange={closeActionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog.action === 'approve' && 'Approve Content'}
                            {actionDialog.action === 'flag' && 'Flag Content'}
                            {actionDialog.action === 'hide' && 'Hide Content'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.action === 'approve' &&
                                'This will approve the content and make it visible to the user.'}
                            {actionDialog.action === 'flag' &&
                                'This will flag the content for review and notify the user.'}
                            {actionDialog.action === 'hide' &&
                                'This will hide the content from the user\'s library while preserving the data.'}
                        </DialogDescription>
                    </DialogHeader>
                    {(actionDialog.action === 'flag' || actionDialog.action === 'hide') && (
                        <div className="space-y-2">
                            <Label>Reason *</Label>
                            <Textarea
                                placeholder="Provide a reason for this action..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={closeActionDialog} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleModerateAction} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {actionDialog.action === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                                    {actionDialog.action === 'flag' && <Flag className="h-4 w-4 mr-2" />}
                                    {actionDialog.action === 'hide' && <EyeOff className="h-4 w-4 mr-2" />}
                                    Confirm
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
