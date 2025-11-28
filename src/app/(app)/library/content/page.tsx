
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardPageLayout } from '@/components/standard';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { SearchInput } from '@/components/ui/search-input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useUser } from '@/aws/auth';
import type { SavedContent, Project } from '@/lib/types';
import {
    createProjectAction,
    moveContentToProjectAction,
    deleteContentAction,
    renameContentAction,
    getSavedContentAction,
    getProjectsAction,
    deleteProjectAction,
    updateContentAction,
} from '@/app/actions';
import { Library, Copy, Folder, FolderPlus, MoreVertical, Trash2, Pencil, ChevronsUpDown, LayoutGrid, LayoutList, RefreshCw, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/page-header';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';





function CreateProjectDialog({
    isOpen,
    setIsOpen,
    onProjectCreated
}: {
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onProjectCreated: (projectId?: string) => void
}) {
    const { user } = useUser();
    const [name, setName] = useState('');

    const handleCreateProject = async () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Project name is required.' });
            return;
        }
        if (!user?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        try {
            const result = await createProjectAction(user.id, name);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Project Created!', description: `"${name}" has been created.` });
                setName('');
                setIsOpen(false);
                onProjectCreated(result.data.id); // Pass the new project ID
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Create a new folder to organize your saved content.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 'Luxury Condo Listings'" />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MoveContentDialog({
    item,
    projects,
    isOpen,
    setIsOpen,
    onContentMoved
}: {
    item: SavedContent | null,
    projects: Project[] | null,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onContentMoved: (contentId: string, projectId: string | null) => void
}) {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setSelectedProjectId(item.projectId || null);
        }
    }, [item]);

    const handleMove = () => {
        if (!item) return;
        onContentMoved(item.id, selectedProjectId === 'uncategorized' ? null : selectedProjectId);
        setIsOpen(false);
    };

    const currentProject = item?.projectId
        ? projects?.find(p => p.id === item.projectId)?.name || 'Unknown Project'
        : 'Uncategorized';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move Content</DialogTitle>
                    <DialogDescription>
                        Move "{item?.name || item?.type}" to a different project.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm text-muted-foreground">
                        Currently in: <span className="font-medium">{currentProject}</span>
                    </div>
                    <div className="space-y-2">
                        <Label>Move to:</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="uncategorized"
                                    name="project"
                                    value="uncategorized"
                                    checked={selectedProjectId === null || selectedProjectId === 'uncategorized'}
                                    onChange={() => setSelectedProjectId('uncategorized')}
                                    className="h-4 w-4"
                                    aria-label="Move to Uncategorized"
                                />
                                <Label htmlFor="uncategorized" className="flex items-center gap-2 cursor-pointer">
                                    <Folder className="h-4 w-4" />
                                    Uncategorized
                                </Label>
                            </div>
                            {projects?.map(project => (
                                <div key={project.id} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id={project.id}
                                        name="project"
                                        value={project.id}
                                        checked={selectedProjectId === project.id}
                                        onChange={() => setSelectedProjectId(project.id)}
                                        className="h-4 w-4"
                                        aria-label={`Move to ${project.name}`}
                                    />
                                    <Label htmlFor={project.id} className="flex items-center gap-2 cursor-pointer">
                                        <Folder className="h-4 w-4" />
                                        {project.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleMove}
                        disabled={selectedProjectId === (item?.projectId || 'uncategorized')}
                    >
                        Move Content
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RenameContentDialog({
    item,
    isOpen,
    setIsOpen,
    onContentRenamed
}: {
    item: SavedContent | null,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onContentRenamed: (updatedItem: SavedContent) => void
}) {
    const { user } = useUser();
    const [name, setName] = useState(item?.name || '');

    useEffect(() => {
        if (item) {
            setName(item.name || '');
        }
    }, [item]);

    const handleRename = async () => {
        if (!item || !name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Content name is required.' });
            return;
        }
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await renameContentAction(user.id, item.id, name);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Content Renamed!', description: `The item has been renamed to "${name}".` });
                setIsOpen(false);

                // Pass the updated item to the parent for optimistic update
                const updatedItem = { ...item, name };
                onContentRenamed(updatedItem);
            }
        } catch (error) {
            console.error('Failed to rename content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename content.' });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Content</DialogTitle>
                    <DialogDescription>
                        Give this saved content a new name.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="contentName">Content Name</Label>
                    <Input id="contentName" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g., ${item?.type} for October`} />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleRename}>Save Name</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ViewEditContentDialog({
    item,
    isOpen,
    setIsOpen,
    onContentUpdated
}: {
    item: SavedContent | null,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onContentUpdated: (updatedItem: SavedContent) => void
}) {
    const { user } = useUser();
    const [editedContent, setEditedContent] = useState(item?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setEditedContent(item.content || '');
        }
    }, [item]);

    const handleSave = async () => {
        if (!item || !editedContent.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Content cannot be empty.' });
            return;
        }

        setIsSaving(true);
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await updateContentAction(user.id, item.id, editedContent);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Content Updated!', description: 'Your changes have been saved.' });
                const updatedItem = { ...item, content: editedContent };
                onContentUpdated(updatedItem);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to update content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update content.' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(editedContent);
        toast({ title: "Copied to Clipboard!" });
    }

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">{item.name || item.type}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                                <span className="text-xs">Created {formatDate(item.createdAt)}</span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[50vh] w-full rounded-md border mt-4">
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[50vh] border-0 focus-visible:ring-0 resize-none"
                        placeholder="Enter your content here..."
                    />
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function formatDate(dateValue: any): string {
    if (!dateValue) return 'Unknown date';
    // Handle Firestore timestamp
    if (typeof dateValue === 'object' && 'seconds' in dateValue) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString();
    }
    // Handle ISO string or number
    return new Date(dateValue).toLocaleDateString();
}


export default function LibraryPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<SavedContent | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [itemToRename, setItemToRename] = useState<SavedContent | null>(null);
    const [itemToMove, setItemToMove] = useState<SavedContent | null>(null);
    const [itemToView, setItemToView] = useState<SavedContent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');


    const [savedContent, setSavedContent] = useState<SavedContent[] | null>(null);
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [openProjects, setOpenProjects] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch content and projects using Server Actions
    useEffect(() => {
        if (!user) {
            setSavedContent([]);
            setProjects([]);
            setIsLoadingContent(false);
            setIsLoadingProjects(false);
            return;
        }

        // Fetch saved content
        const fetchContent = async () => {
            console.log('📥 fetchContent called');
            setIsLoadingContent(true);
            try {
                const result = await getSavedContentAction(user?.id);
                console.log('📥 getSavedContentAction result:', result);
                if (result.data) {
                    console.log('📥 Content items:', result.data.length);
                    console.log('📥 First item:', result.data[0]);
                    setSavedContent(result.data);
                } else {
                    console.log('📥 No content data');
                    setSavedContent([]);
                    if (result.errors) {
                        console.error('Failed to fetch saved content:', result.errors);
                    }
                }
            } catch (error) {
                console.error('Error fetching saved content:', error);
                setSavedContent([]);
            } finally {
                setIsLoadingContent(false);
            }
        };

        // Fetch projects
        const fetchProjects = async () => {
            console.log('📂 fetchProjects called');
            setIsLoadingProjects(true);
            try {
                const result = await getProjectsAction(user?.id);
                console.log('📂 getProjectsAction result:', result);
                if (result.data) {
                    console.log('📂 Projects:', result.data.length);
                    console.log('📂 Projects data:', result.data);
                    setProjects(result.data);
                } else {
                    console.log('📂 No projects data');
                    setProjects([]);
                    if (result.errors) {
                        console.error('Failed to fetch projects:', result.errors);
                    }
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
                setProjects([]);
            } finally {
                setIsLoadingProjects(false);
            }
        };

        console.log('🔄 Initial load - fetching data...');
        fetchContent();
        fetchProjects();

        // Refresh when page becomes visible (user navigates back)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('👁️ Page visible, refreshing data...');
                fetchContent();
                fetchProjects();
            }
        };

        // Refresh when window gains focus (user clicks back to tab)
        const handleFocus = () => {
            console.log('🎯 Window focused, refreshing data...');
            fetchContent();
            fetchProjects();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    // Refresh functions
    const refreshContent = async (showLoading = false) => {
        console.log('🔄 Refreshing content...');
        if (showLoading) setIsRefreshing(true);
        try {
            if (!user?.id) {
                setSavedContent([]);
                return;
            }
            const result = await getSavedContentAction(user.id);
            console.log('📝 Content result:', result);
            if (result.data) {
                console.log('📝 Setting content:', result.data.length, 'items');
                console.log('📝 Content data:', JSON.stringify(result.data, null, 2));
                // Force a new array reference to trigger re-render
                setSavedContent([...result.data]);
                setRefreshKey(prev => prev + 1);
            } else {
                console.log('📝 No content data received');
                setSavedContent([]);
            }
        } catch (error) {
            console.error('Error refreshing content:', error);
            setSavedContent([]);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    const refreshProjects = async (newProjectId?: string, showLoading = false) => {
        console.log('🔄 Refreshing projects...');
        if (showLoading) setIsRefreshing(true);
        try {
            if (!user?.id) {
                setProjects([]);
                return;
            }
            const result = await getProjectsAction(user.id);
            console.log('📁 Projects result:', result);
            if (result.data) {
                console.log('📁 Setting projects:', result.data.length, 'projects');
                console.log('📁 Projects data:', JSON.stringify(result.data, null, 2));
                // Force a new array reference to trigger re-render
                setProjects([...result.data]);
                setRefreshKey(prev => prev + 1);
                // Auto-expand the newly created project
                if (newProjectId) {
                    setOpenProjects(prev => [...prev, newProjectId]);
                }
            } else {
                console.log('📁 No projects data received');
                setProjects([]);
            }
        } catch (error) {
            console.error('Error refreshing projects:', error);
            setProjects([]);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    const contentByProject = useMemo(() => {
        if (!savedContent) return {};

        const grouped: { [key: string]: SavedContent[] } = {
            uncategorized: []
        };

        if (projects) {
            for (const project of projects) {
                grouped[project.id] = [];
            }
        }

        // Filter by search query
        const filteredContent = savedContent.filter(item => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                item.name?.toLowerCase().includes(query) ||
                item.type?.toLowerCase().includes(query) ||
                item.content?.toLowerCase().includes(query)
            );
        });

        for (const item of filteredContent) {
            if (item.projectId && grouped[item.projectId]) {
                grouped[item.projectId].push(item);
            } else {
                grouped.uncategorized.push(item);
            }
        }

        return grouped;
    }, [savedContent, projects, searchQuery]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to Clipboard!",
        });
    }

    const handleMoveToProject = async (contentId: string, projectId: string | null) => {
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await moveContentToProjectAction(user.id, contentId, projectId);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                // Optimistically update the UI immediately
                setSavedContent(prev =>
                    prev ? prev.map(item =>
                        item.id === contentId ? { ...item, projectId: projectId || undefined } : item
                    ) : []
                );
                setRefreshKey(prev => prev + 1);

                toast({ title: 'Content Moved', description: 'The item has been moved to the new project.' });

                // Then refresh from server to ensure consistency
                await refreshContent();
            }
        } catch (error) {
            console.error('Failed to move content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move content.' });
            // Refresh on error to restore correct state
            await refreshContent();
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await deleteContentAction(user.id, itemToDelete.id);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                // Optimistically update the UI immediately
                setSavedContent(prev => prev ? prev.filter(item => item.id !== itemToDelete.id) : []);
                setRefreshKey(prev => prev + 1);

                toast({ title: 'Content Deleted', description: 'The saved item has been removed.' });
                setItemToDelete(null);

                // Then refresh from server to ensure consistency
                await refreshContent();
            }
        } catch (error) {
            console.error('Failed to delete content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete content.' });
            // Refresh on error to restore correct state
            await refreshContent();
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        console.log('🎯 handleDeleteProject called with:', projectToDelete.id);
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await deleteProjectAction(user.id, projectToDelete.id);
            console.log('🎯 Delete result:', result);

            if (result.errors || !result.data) {
                console.log('❌ Delete failed:', result.message);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                console.log('✅ Delete successful, refreshing UI...');
                toast({ title: 'Project Deleted', description: `"${projectToDelete.name}" has been deleted.` });

                // Remove from open projects if it was open
                setOpenProjects(prev => prev.filter(id => id !== projectToDelete.id));

                console.log('🎯 About to refresh projects and content...');
                // Refresh both projects and content
                await Promise.all([
                    refreshProjects(),
                    refreshContent()
                ]);
                console.log('🎯 Refresh complete!');
                setProjectToDelete(null);
            }
        } catch (error) {
            console.error('❌ Failed to delete project:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete project.' });
        }
    }

    const isLoading = isUserLoading || isLoadingContent || isLoadingProjects || isRefreshing;

    const projectList = useMemo(() => {
        if (!projects) return [];
        const unsortedProjects = [...projects];
        const categorized = unsortedProjects.sort((a, b) => a.name.localeCompare(b.name));
        const allProjects = [{ id: 'uncategorized', name: 'Uncategorized', createdAt: new Date().toISOString() }, ...categorized];

        // When searching, only show projects that have matching content
        if (searchQuery) {
            return allProjects.filter(project => {
                const items = contentByProject[project.id] || [];
                return items.length > 0;
            });
        }

        return allProjects;
    }, [projects, searchQuery, contentByProject]);

    // Auto-expand projects with search results
    useEffect(() => {
        if (searchQuery && projectList.length > 0) {
            const projectsWithResults = projectList
                .filter(project => {
                    const items = contentByProject[project.id] || [];
                    return items.length > 0;
                })
                .map(project => project.id);
            setOpenProjects(projectsWithResults);
        } else if (!searchQuery) {
            // Close all projects when search is cleared
            setOpenProjects([]);
        }
    }, [searchQuery, projectList, contentByProject, setOpenProjects]);

    return (
        <div className="space-y-6" key={refreshKey}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">Content Library</CardTitle>
                            <CardDescription>Manage your created content</CardDescription>
                        </div>
                        {(() => {
                            const pageConfig = getPageConfig('/library/content');
                            return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                        })()}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            {!isLoading && savedContent && savedContent.length > 0 && (
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search content by name, type, or keywords..."
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {(projects && projects.length > 0) && (
                                <div className="flex items-center border rounded-lg">
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className="rounded-r-none"
                                    >
                                        <LayoutList className="h-4 w-4" />
                                        <span className="sr-only">List view</span>
                                    </Button>
                                    <Button
                                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className="rounded-l-none"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        <span className="sr-only">Grid view</span>
                                    </Button>
                                </div>
                            )}
                            <Button
                                onClick={async () => {
                                    setIsRefreshing(true);
                                    try {
                                        await Promise.all([refreshContent(true), refreshProjects(undefined, true)]);
                                        toast({ title: 'Refreshed', description: 'Library data updated.' });
                                    } finally {
                                        setIsRefreshing(false);
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading || isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="sr-only">Refresh</span>
                            </Button>
                            <Button onClick={() => setIsCreateProjectOpen(true)} variant="default">
                                <FolderPlus className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </div>
                    </div >
                </CardContent >
            </Card >

            {isLoading && <StandardSkeleton variant="list" count={3} />
            }

            {/* Search Results Indicator */}
            {
                !isLoading && searchQuery && (
                    <div className="text-sm text-muted-foreground mb-4">
                        {(() => {
                            const totalResults = Object.values(contentByProject).flat().length;
                            const projectsWithResults = projectList.length;
                            return totalResults > 0
                                ? `Found ${totalResults} item${totalResults === 1 ? '' : 's'} in ${projectsWithResults} project${projectsWithResults === 1 ? '' : 's'} matching "${searchQuery}"`
                                : `No results found for "${searchQuery}"`;
                        })()}
                    </div>
                )
            }

            {
                !isLoading && (projects && projects.length > 0) && viewMode === 'list' && (
                    <AlertDialog>
                        <Accordion type="multiple" className="w-full space-y-4" value={openProjects} onValueChange={setOpenProjects}>
                            {projectList.map(project => {
                                const items = contentByProject[project.id] || [];

                                return (
                                    <AccordionItem value={project.id} key={project.id} className="border border-border/50 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div key={`trigger-${project.id}`} className="bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-4 border-b border-border/30 rounded-t-xl">
                                            <div className="flex items-center justify-between w-full">
                                                <AccordionTrigger className="hover:no-underline text-lg font-semibold group flex-1 mr-2">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                            <Folder className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-headline font-semibold text-foreground">{project.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {items.length} {items.length === 1 ? 'item' : 'items'}
                                                                {items.length > 0 && (
                                                                    <span className="ml-2">
                                                                        • Last updated {formatDate(Math.max(...items.map(item => {
                                                                            if (typeof item.createdAt === 'object' && 'seconds' in item.createdAt) {
                                                                                return item.createdAt.seconds * 1000;
                                                                            }
                                                                            return new Date(item.createdAt).getTime();
                                                                        })))}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                {project.id !== 'uncategorized' && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent/50">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Project options</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => setProjectToDelete(project)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Project
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                        <AccordionContent key={`content-${project.id}`} className="px-6 pb-6 space-y-3">
                                            {items.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
                                                    <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                                                        <Library className="h-6 w-6" />
                                                    </div>
                                                    <p className="font-medium">No content in this project yet</p>
                                                    <p className="text-sm mt-1">Create content in Studio and save it to this project</p>
                                                </div>
                                            ) : (
                                                items.map(item => (
                                                    <Card
                                                        key={item.id}
                                                        className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border bg-background/50 hover:bg-background cursor-pointer"
                                                        onClick={() => setItemToView(item)}
                                                    >
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <Badge variant="secondary" className="text-xs font-medium">
                                                                            {item.type}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {formatDate(item.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <CardTitle className="text-base font-semibold leading-tight mb-2 group-hover:text-primary transition-colors">
                                                                        {item.name || item.type}
                                                                    </CardTitle>
                                                                    <CardDescription className="text-sm line-clamp-2 text-muted-foreground">
                                                                        {item.content.replace(/[#*`]/g, '').substring(0, 120)}
                                                                        {item.content.length > 120 && '...'}
                                                                    </CardDescription>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            copyToClipboard(item.content);
                                                                        }}
                                                                        className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
                                                                        title="Copy content"
                                                                    >
                                                                        <Copy className="w-4 h-4" />
                                                                        <span className="sr-only">Copy</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setItemToMove(item);
                                                                        }}
                                                                        className="h-8 px-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                                                                        title="Move to project"
                                                                    >
                                                                        <FolderOpen className="w-4 h-4" />
                                                                        <span className="sr-only">Move</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setItemToView(item);
                                                                        }}
                                                                        className="h-8 px-2 hover:bg-accent"
                                                                        title="View & Edit"
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                        <span className="sr-only">View</span>
                                                                    </Button>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                            <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-accent">
                                                                                <MoreVertical className="w-4 h-4" />
                                                                                <span className="sr-only">More options</span>
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onSelect={() => setItemToView(item)}>
                                                                                <FileText className="mr-2 h-4 w-4" />
                                                                                View & Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onSelect={() => setItemToRename(item)}>
                                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                                Rename
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onSelect={() => setItemToMove(item)}>
                                                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                                                Move to Project
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <AlertDialogTrigger asChild>
                                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete(item)}>
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    Delete
                                                                                </DropdownMenuItem>
                                                                            </AlertDialogTrigger>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                    </Card>
                                                ))
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the saved content item.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            }

            {
                !isLoading && (projects && projects.length > 0) && viewMode === 'grid' && (
                    <AlertDialog>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projectList.map(project => {
                                const items = contentByProject[project.id] || [];

                                return (
                                    <Card key={project.id} className="flex flex-col hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border group">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                                                        <Folder className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="font-headline text-lg font-semibold group-hover:text-primary transition-colors">{project.name}</CardTitle>
                                                        <CardDescription className="text-sm">
                                                            {items.length} {items.length === 1 ? 'item' : 'items'}
                                                            {items.length > 0 && (
                                                                <span className="block text-xs mt-1">
                                                                    Updated {formatDate(Math.max(...items.map(item => {
                                                                        if (typeof item.createdAt === 'object' && 'seconds' in item.createdAt) {
                                                                            return item.createdAt.seconds * 1000;
                                                                        }
                                                                        return new Date(item.createdAt).getTime();
                                                                    })))}
                                                                </span>
                                                            )}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                {project.id !== 'uncategorized' && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Project options</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => setProjectToDelete(project)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Project
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            {items.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    <p>No content yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {items.slice(0, 3).map(item => (
                                                        <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{item.name || item.type}</p>
                                                                <p className="text-xs text-muted-foreground">{item.type}</p>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                                        <MoreVertical className="h-3 w-3" />
                                                                        <span className="sr-only">Options</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => copyToClipboard(item.content)}>
                                                                        <Copy className="mr-2 h-4 w-4" />
                                                                        Copy
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => setItemToRename(item)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Rename
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => setItemToMove(item)}>
                                                                        <FolderOpen className="mr-2 h-4 w-4" />
                                                                        Move to Project
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete(item)}>
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    ))}
                                                    {items.length > 3 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                            onClick={() => {
                                                                setViewMode('list');
                                                                setOpenProjects([project.id]);
                                                            }}
                                                        >
                                                            View all {items.length} items
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-red-500">
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <AlertDialogTitle>Delete Content?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the saved content item.
                                        </AlertDialogDescription>
                                    </div>
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            }

            {/* Delete Project Confirmation Modal */}
            <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-amber-500">
                                <Folder className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    All content in "{projectToDelete?.name}" will be moved to Uncategorized. This action cannot be undone.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Keep Project</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject} className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600 text-white">
                            Delete Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Empty state for no search results */}
            {
                !isLoading && searchQuery && Object.values(contentByProject).flat().length === 0 && (
                    <IntelligentEmptyState
                        icon={Library}
                        title="No Results Found"
                        description={`No content matches "${searchQuery}". Try different keywords or check your spelling.`}
                        actions={[
                            {
                                label: "Clear Search",
                                onClick: () => setSearchQuery(''),
                                variant: "outline"
                            },
                        ]}
                        variant="card"
                    />
                )
            }

            {/* Empty state for no content at all */}
            {
                !isLoading && !searchQuery && (!projects || projects.length === 0) && (!savedContent || savedContent.length === 0) && (
                    <IntelligentEmptyState
                        icon={Library}
                        title="Your Library is Empty"
                        description="You haven't saved any content yet. Start creating content in the Studio to build your library of AI-generated marketing materials."
                        actions={[
                            {
                                label: "Go to Studio",
                                onClick: () => router.push('/studio/write'),
                                icon: FolderPlus,
                            },
                        ]}
                        variant="card"
                    />
                )
            }
            <CreateProjectDialog
                isOpen={isCreateProjectOpen}
                setIsOpen={setIsCreateProjectOpen}
                onProjectCreated={async (projectId) => {
                    await refreshProjects(projectId);
                }}
            />
            <RenameContentDialog
                item={itemToRename}
                isOpen={!!itemToRename}
                setIsOpen={() => setItemToRename(null)}
                onContentRenamed={async (updatedItem) => {
                    // Optimistically update the UI immediately
                    setSavedContent(prev =>
                        prev ? prev.map(item =>
                            item.id === updatedItem.id ? updatedItem : item
                        ) : []
                    );
                    setRefreshKey(prev => prev + 1);

                    // Then refresh from server to ensure consistency
                    await refreshContent();
                }}
            />
            <MoveContentDialog
                item={itemToMove}
                projects={projects}
                isOpen={!!itemToMove}
                setIsOpen={() => setItemToMove(null)}
                onContentMoved={async (contentId, projectId) => {
                    await handleMoveToProject(contentId, projectId);
                }}
            />
            <ViewEditContentDialog
                item={itemToView}
                isOpen={!!itemToView}
                setIsOpen={() => setItemToView(null)}
                onContentUpdated={async (updatedItem) => {
                    // Optimistically update the UI immediately
                    setSavedContent(prev =>
                        prev ? prev.map(item =>
                            item.id === updatedItem.id ? updatedItem : item
                        ) : []
                    );
                    setRefreshKey(prev => prev + 1);

                    // Then refresh from server to ensure consistency
                    await refreshContent();
                }}
            />
        </div >
    );
}
