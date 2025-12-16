'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
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
    DialogTrigger,
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
    Image,
    Video,
    FileText,
    Upload,
    Search,
    Filter,
    Grid3X3,
    List,
    MoreVertical,
    Download,
    Trash2,
    Eye,
    Plus,
    RefreshCw,
    Calendar,
    FolderPlus,
    Folder,
    Tag
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { filterBySearch, highlightMatches } from '@/lib/utils/search-utils';
import {
    ContentSection,
    DataGrid,
    ActionBar,
    LoadingSection,
    EmptySection,
} from '@/components/ui';

interface MediaFile {
    id: string;
    userId: string;
    name: string;
    type: 'image' | 'video' | 'document';
    url: string;
    thumbnailUrl?: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    lastAccessed?: string;
    tags: string[];
    folder?: string;
    description?: string;
    isPublic: boolean;
}

interface MediaFolder {
    id: string;
    name: string;
    description: string;
    fileCount: number;
    createdAt: string;
}

// Mock data for demonstration
const mockFolders: MediaFolder[] = [
    {
        id: 'listings',
        name: 'Listing Photos',
        description: 'Property photos and virtual tours',
        fileCount: 24,
        createdAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'marketing',
        name: 'Marketing Materials',
        description: 'Logos, brochures, and promotional content',
        fileCount: 12,
        createdAt: '2024-01-14T16:45:00Z',
    },
    {
        id: 'documents',
        name: 'Documents',
        description: 'Contracts, forms, and legal documents',
        fileCount: 8,
        createdAt: '2024-01-13T11:20:00Z',
    },
];

const mockFiles: MediaFile[] = [
    {
        id: '1',
        userId: 'user1',
        name: 'luxury-home-exterior.jpg',
        type: 'image',
        url: '/api/media/luxury-home-exterior.jpg',
        thumbnailUrl: '/api/media/thumbnails/luxury-home-exterior.jpg',
        size: 2500000,
        mimeType: 'image/jpeg',
        uploadedAt: '2024-01-15T10:30:00Z',
        lastAccessed: '2024-01-16T14:20:00Z',
        tags: ['luxury', 'exterior', 'listing'],
        folder: 'listings',
        description: 'Beautiful luxury home exterior shot',
        isPublic: false,
    },
    {
        id: '2',
        userId: 'user1',
        name: 'property-tour-video.mp4',
        type: 'video',
        url: '/api/media/property-tour-video.mp4',
        thumbnailUrl: '/api/media/thumbnails/property-tour-video.jpg',
        size: 45000000,
        mimeType: 'video/mp4',
        uploadedAt: '2024-01-14T16:45:00Z',
        tags: ['tour', 'video', 'marketing'],
        folder: 'marketing',
        description: 'Virtual property tour video',
        isPublic: true,
    },
    {
        id: '3',
        userId: 'user1',
        name: 'purchase-agreement-template.pdf',
        type: 'document',
        url: '/api/media/purchase-agreement-template.pdf',
        size: 1200000,
        mimeType: 'application/pdf',
        uploadedAt: '2024-01-13T11:20:00Z',
        tags: ['contract', 'template', 'legal'],
        folder: 'documents',
        description: 'Standard purchase agreement template',
        isPublic: false,
    },
];

export default function LibraryMediaPage() {
    const { user } = useUser();
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // New folder form state
    const [newFolder, setNewFolder] = useState({
        name: '',
        description: '',
    });

    // Load data on component mount
    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with real API calls
            // const [filesResult, foldersResult] = await Promise.all([
            //     listMediaFiles(),
            //     listMediaFolders()
            // ]);

            // For now, use mock data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
            setFiles(mockFiles);
            setFolders(mockFolders);
        } catch (error) {
            console.error('Failed to load media data:', error);
            toast({
                title: 'Load Failed',
                description: 'Failed to load media library. Please refresh the page.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Filter files based on search and filters
    const filteredFiles = useMemo(() => {
        let filtered = files;

        // Apply search filter
        if (searchQuery) {
            filtered = filterBySearch(filtered, searchQuery, (file) => [
                file.name,
                file.description || '',
                ...file.tags,
            ]);
        }

        // Apply folder filter
        if (selectedFolder !== 'all') {
            filtered = filtered.filter(file => file.folder === selectedFolder);
        }

        // Apply type filter
        if (selectedType !== 'all') {
            filtered = filtered.filter(file => file.type === selectedType);
        }

        // Sort by upload date (newest first)
        filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        return filtered;
    }, [files, searchQuery, selectedFolder, selectedType]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        setIsUploading(true);

        try {
            for (const file of Array.from(uploadedFiles)) {
                // Validate file size (50MB limit)
                if (file.size > 50 * 1024 * 1024) {
                    toast({
                        title: 'File Too Large',
                        description: `${file.name} is larger than 50MB. Please choose a smaller file.`,
                        variant: 'destructive',
                    });
                    continue;
                }

                // TODO: Implement actual file upload
                // const result = await uploadMediaFile(file, selectedFolder);

                // For now, simulate upload
                await new Promise(resolve => setTimeout(resolve, 1000));

                const newFile: MediaFile = {
                    id: Date.now().toString(),
                    userId: user!.id,
                    name: file.name,
                    type: getFileType(file.type),
                    url: URL.createObjectURL(file),
                    size: file.size,
                    mimeType: file.type,
                    uploadedAt: new Date().toISOString(),
                    tags: [],
                    folder: selectedFolder !== 'all' ? selectedFolder : undefined,
                    isPublic: false,
                };

                setFiles(prev => [newFile, ...prev]);
            }

            toast({
                title: 'Upload Successful',
                description: `${uploadedFiles.length} file(s) uploaded successfully.`,
            });

            setShowUploadDialog(false);
        } catch (error) {
            toast({
                title: 'Upload Failed',
                description: 'Failed to upload files. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolder.name.trim()) {
            toast({
                title: 'Name Required',
                description: 'Please enter a folder name.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // TODO: Implement actual folder creation
            const folder: MediaFolder = {
                id: newFolder.name.toLowerCase().replace(/\s+/g, '-'),
                name: newFolder.name,
                description: newFolder.description,
                fileCount: 0,
                createdAt: new Date().toISOString(),
            };

            setFolders(prev => [...prev, folder]);
            setShowFolderDialog(false);
            setNewFolder({ name: '', description: '' });

            toast({
                title: 'Folder Created',
                description: `"${folder.name}" has been created.`,
            });
        } catch (error) {
            toast({
                title: 'Creation Failed',
                description: 'Failed to create folder. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const deleteFile = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file) return;

        try {
            // TODO: Implement actual file deletion
            setFiles(prev => prev.filter(f => f.id !== fileId));

            toast({
                title: 'File Deleted',
                description: `"${file.name}" has been deleted.`,
            });
        } catch (error) {
            toast({
                title: 'Delete Failed',
                description: 'Failed to delete file. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const downloadFile = (file: MediaFile) => {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Download Started',
            description: `"${file.name}" is being downloaded.`,
        });
    };

    const getFileType = (mimeType: string): MediaFile['type'] => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        return 'document';
    };

    const getFileIcon = (type: MediaFile['type']) => {
        switch (type) {
            case 'image': return <Image className="h-4 w-4" />;
            case 'video': return <Video className="h-4 w-4" />;
            case 'document': return <FileText className="h-4 w-4" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
                    <p className="text-muted-foreground">
                        Manage your images, videos, and documents
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FolderPlus className="h-4 w-4 mr-2" />
                                New Folder
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Folder</DialogTitle>
                                <DialogDescription>
                                    Organize your media files with custom folders.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="folder-name" className="text-sm font-medium">Folder Name</label>
                                    <Input
                                        id="folder-name"
                                        placeholder="e.g., Property Photos"
                                        value={newFolder.name}
                                        onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="folder-description" className="text-sm font-medium">Description</label>
                                    <Input
                                        id="folder-description"
                                        placeholder="Brief description of this folder"
                                        value={newFolder.description}
                                        onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateFolder}>
                                    Create Folder
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Files
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Media Files</DialogTitle>
                                <DialogDescription>
                                    Upload images, videos, or documents to your media library.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="file-upload" className="text-sm font-medium">Select Files</label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="w-full p-2 border rounded-md"
                                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Supported formats: Images (JPG, PNG, GIF), Videos (MP4, MOV), Documents (PDF, DOC, TXT). Max size: 50MB per file.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Folders Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedFolder === 'all' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedFolder('all')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">All Files</h4>
                                <p className="text-sm text-muted-foreground">{files.length} files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {folders.map((folder) => (
                    <Card
                        key={folder.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedFolder === folder.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedFolder(selectedFolder === folder.id ? 'all' : folder.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Folder className="h-5 w-5 text-primary" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{folder.name}</h4>
                                    <p className="text-sm text-muted-foreground">{folder.fileCount} files</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={() => setSearchQuery('')}
                                placeholder="Search files..."
                                aria-label="Search media files"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Type</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="document">Documents</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedFolder('all');
                                    setSelectedType('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Files Grid/List */}
            <div className="space-y-4">
                {isLoading ? (
                    <LoadingSection
                        title="Loading media library..."
                        description="Fetching your files and folders"
                        variant="default"
                    />
                ) : filteredFiles.length === 0 ? (
                    searchQuery || selectedFolder !== 'all' || selectedType !== 'all' ? (
                        <EmptySection
                            title="No files found"
                            description="Try adjusting your search terms or filters"
                            icon={Search}
                            action={{
                                label: "Clear filters",
                                onClick: () => {
                                    setSearchQuery('');
                                    setSelectedFolder('all');
                                    setSelectedType('all');
                                },
                                variant: "outline"
                            }}
                            variant="minimal"
                        />
                    ) : (
                        <EmptySection
                            title="No Media Files Yet"
                            description="Upload your first images, videos, or documents to get started"
                            icon={Upload}
                            action={{
                                label: "Upload Files",
                                onClick: () => setShowUploadDialog(true),
                                variant: "default"
                            }}
                            variant="minimal"
                        />
                    )
                ) : (
                    <DataGrid columns={viewMode === 'grid' ? 4 : 1}>
                        {filteredFiles.map((file) => (
                            <Card key={file.id} className="hover:shadow-md transition-shadow">
                                <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-6'}>
                                    {viewMode === 'grid' ? (
                                        <div className="space-y-3">
                                            {/* File Preview */}
                                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                                                {file.type === 'image' && file.thumbnailUrl ? (
                                                    <img
                                                        src={file.thumbnailUrl}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* File Info */}
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium text-sm truncate flex-1" title={file.name}>
                                                        {searchQuery ? (
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: highlightMatches(file.name, searchQuery)
                                                            }} />
                                                        ) : file.name}
                                                    </h4>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => downloadFile(file)}>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => deleteFile(file.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {getFileIcon(file.type)}
                                                    <span>{formatFileSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(file.uploadedAt)}</span>
                                                </div>

                                                {file.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {file.tags.slice(0, 2).map((tag, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {searchQuery ? (
                                                                    <span dangerouslySetInnerHTML={{
                                                                        __html: highlightMatches(tag, searchQuery)
                                                                    }} />
                                                                ) : tag}
                                                            </Badge>
                                                        ))}
                                                        {file.tags.length > 2 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{file.tags.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">
                                                        {searchQuery ? (
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: highlightMatches(file.name, searchQuery)
                                                            }} />
                                                        ) : file.name}
                                                    </h4>
                                                    {file.description && (
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {searchQuery ? (
                                                                <span dangerouslySetInnerHTML={{
                                                                    __html: highlightMatches(file.description, searchQuery)
                                                                }} />
                                                            ) : file.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(file.uploadedAt)}</span>
                                                        {file.isPublic && (
                                                            <>
                                                                <span>•</span>
                                                                <Badge variant="outline" className="text-xs">Public</Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                    {file.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {file.tags.map((tag, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    <Tag className="h-2 w-2 mr-1" />
                                                                    {searchQuery ? (
                                                                        <span dangerouslySetInnerHTML={{
                                                                            __html: highlightMatches(tag, searchQuery)
                                                                        }} />
                                                                    ) : tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => downloadFile(file)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => deleteFile(file.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </DataGrid>
                )}
            </div>
        </div>
    );
}
