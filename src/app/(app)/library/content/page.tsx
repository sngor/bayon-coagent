
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
} from '@/app/actions';
import { Library, Copy, Folder, FolderPlus, MoreVertical, Trash2, Pencil, ChevronsUpDown, LayoutGrid, LayoutList, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
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

function RenameContentDialog({
    item,
    isOpen,
    setIsOpen,
    onContentRenamed
}: {
    item: SavedContent | null,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onContentRenamed: () => void
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
                onContentRenamed();
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


export default function LibraryPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<SavedContent | null>(null);
    const [itemToRename, setItemToRename] = useState<SavedContent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [savedContent, setSavedContent] = useState<SavedContent[] | null>(null);
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [openProjects, setOpenProjects] = useState<string[]>(['uncategorized']);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [refreshKey, setRefreshKey] = useState(0);

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
    const refreshContent = async () => {
        console.log('🔄 Refreshing content...');
        const result = await getSavedContentAction();
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
    };

    const refreshProjects = async (newProjectId?: string) => {
        console.log('🔄 Refreshing projects...');
        const result = await getProjectsAction();
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

    const formatDate = (dateValue: any): string => {
        if (!dateValue) return 'Unknown date';
        // Handle Firestore timestamp
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000).toLocaleDateString();
        }
        // Handle ISO string or number
        return new Date(dateValue).toLocaleDateString();
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
                toast({ title: 'Content Moved', description: 'The item has been moved to the new project.' });
                refreshContent();
            }
        } catch (error) {
            console.error('Failed to move content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move content.' });
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
                toast({ title: 'Content Deleted', description: 'The saved item has been removed.' });
                setItemToDelete(null);
                refreshContent();
            }
        } catch (error) {
            console.error('Failed to delete content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete content.' });
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        console.log('🎯 handleDeleteProject called with:', projectId);
        const project = projects?.find(p => p.id === projectId);
        console.log('🎯 Found project:', project);

        if (!project) {
            console.log('❌ Project not found!');
            return;
        }

        const confirmed = window.confirm(
            `Delete "${project.name}"?\n\nAll content in this project will be moved to Uncategorized. This action cannot be undone.`
        );

        console.log('🎯 User confirmed:', confirmed);
        if (!confirmed) return;

        console.log('🎯 Calling deleteProjectAction...');
        try {
            if (!user?.id) {
                toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
                return;
            }
            const result = await deleteProjectAction(user.id, projectId);
            console.log('🎯 Delete result:', result);

            if (result.errors || !result.data) {
                console.log('❌ Delete failed:', result.message);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                console.log('✅ Delete successful, refreshing UI...');
                toast({ title: 'Project Deleted', description: `"${project.name}" has been deleted.` });

                // Remove from open projects if it was open
                setOpenProjects(prev => prev.filter(id => id !== projectId));

                console.log('🎯 About to refresh projects and content...');
                // Refresh both projects and content
                await Promise.all([
                    refreshProjects(),
                    refreshContent()
                ]);
                console.log('🎯 Refresh complete!');
            }
        } catch (error) {
            console.error('❌ Failed to delete project:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete project.' });
        }
    }

    const isLoading = isUserLoading || isLoadingContent || isLoadingProjects;

    const projectList = useMemo(() => {
        if (!projects) return [];
        const unsortedProjects = [...projects];
        const categorized = unsortedProjects.sort((a, b) => a.name.localeCompare(b.name));
        return [{ id: 'uncategorized', name: 'Uncategorized', createdAt: new Date().toISOString() }, ...categorized];
    }, [projects]);


    return (
        <div className="space-y-6" key={refreshKey}>
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
                            await Promise.all([refreshContent(), refreshProjects()]);
                            toast({ title: 'Refreshed', description: 'Library data updated.' });
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Refresh</span>
                    </Button>
                    <Button onClick={() => setIsCreateProjectOpen(true)} variant="default">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </div>
            </div>

            {isLoading && <StandardSkeleton variant="list" count={3} />}

            {!isLoading && (projects && projects.length > 0) && viewMode === 'list' && (
                <AlertDialog>
                    <Accordion type="multiple" className="w-full space-y-4" value={openProjects} onValueChange={setOpenProjects}>
                        {projectList.map(project => {
                            const items = contentByProject[project.id] || [];

                            return (
                                <AccordionItem value={project.id} key={project.id} className="border-none">
                                    <div key={`trigger-${project.id}`} className="bg-muted px-4 py-3 rounded-lg">
                                        <AccordionTrigger className="hover:no-underline text-lg font-headline">
                                            <div className="flex items-center justify-between w-full pr-2">
                                                <div className="flex items-center gap-3">
                                                    <Folder className="h-5 w-5 text-muted-foreground" />
                                                    <span>{project.name} ({items.length})</span>
                                                </div>
                                                {project.id !== 'uncategorized' && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Project options</span>
                                                            </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteProject(project.id);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Project
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                    </div>
                                    <AccordionContent key={`content-${project.id}`} className="pt-4 space-y-4">
                                        {items.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>No content in this project yet.</p>
                                                <p className="text-sm mt-2">Create content in Studio and save it to this project.</p>
                                            </div>
                                        ) : (
                                            items.map(item => (
                                                <Collapsible key={item.id} asChild>
                                                    <Card className="bg-secondary/30">
                                                        <CardHeader className="flex flex-row justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg font-semibold">{item.name || item.type}</CardTitle>
                                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline">{item.type}</Badge>
                                                                    <span>Saved on {formatDate(item.createdAt)}</span>
                                                                </CardDescription>
                                                            </div>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <CollapsibleTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <ChevronsUpDown className="h-4 w-4" />
                                                                        <span className="sr-only">Expand</span>
                                                                    </Button>
                                                                </CollapsibleTrigger>
                                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.content)}>
                                                                    <Copy className="w-4 h-4" />
                                                                    <span className="sr-only">Copy</span>
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                            <span className="sr-only">More options</span>
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onSelect={() => setItemToRename(item)}>
                                                                            <Pencil className="mr-2" />
                                                                            Rename
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSub>
                                                                            <DropdownMenuSubTrigger>Move to...</DropdownMenuSubTrigger>
                                                                            <DropdownMenuSubContent>
                                                                                <DropdownMenuItem onSelect={() => handleMoveToProject(item.id, null)}>
                                                                                    Uncategorized
                                                                                </DropdownMenuItem>
                                                                                {projects && projects.length > 0 && <DropdownMenuSeparator />}
                                                                                {projects?.filter(p => p.id !== item.projectId).map(p => (
                                                                                    <DropdownMenuItem key={`list-move-${item.id}-${p.id}`} onSelect={() => handleMoveToProject(item.id, p.id)}>
                                                                                        {p.name}
                                                                                    </DropdownMenuItem>
                                                                                ))}
                                                                            </DropdownMenuSubContent>
                                                                        </DropdownMenuSub>
                                                                        <DropdownMenuSeparator />
                                                                        <AlertDialogTrigger asChild>
                                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete(item)}>
                                                                                <Trash2 className="mr-2" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </AlertDialogTrigger>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </CardHeader>
                                                        <CollapsibleContent>
                                                            <CardContent>
                                                                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: marked(item.content) as string }} />
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
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
            )}

            {!isLoading && (projects && projects.length > 0) && viewMode === 'grid' && (
                <AlertDialog>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projectList.map(project => {
                            const items = contentByProject[project.id] || [];

                            return (
                                <Card key={project.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-lg bg-primary/10">
                                                    <Folder className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                                    <CardDescription>{items.length} {items.length === 1 ? 'item' : 'items'}</CardDescription>
                                                </div>
                                            </div>
                                            {project.id !== 'uncategorized' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                            <span className="sr-only">Project options</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDeleteProject(project.id)}
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
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger>Move to...</DropdownMenuSubTrigger>
                                                                    <DropdownMenuSubContent>
                                                                        <DropdownMenuItem onSelect={() => handleMoveToProject(item.id, null)}>
                                                                            Uncategorized
                                                                        </DropdownMenuItem>
                                                                        {projects && projects.length > 0 && <DropdownMenuSeparator />}
                                                                        {projects?.filter(p => p.id !== item.projectId).map(p => (
                                                                            <DropdownMenuItem key={`move-${item.id}-${p.id}`} onSelect={() => handleMoveToProject(item.id, p.id)}>
                                                                                {p.name}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuSub>
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
            )}

            {!isLoading && (!projects || projects.length === 0) && (!savedContent || savedContent.length === 0) && (
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
            )}
            <CreateProjectDialog
                isOpen={isCreateProjectOpen}
                setIsOpen={setIsCreateProjectOpen}
                onProjectCreated={refreshProjects}
            />
            <RenameContentDialog
                item={itemToRename}
                isOpen={!!itemToRename}
                setIsOpen={() => setItemToRename(null)}
                onContentRenamed={refreshContent}
            />
        </div>
    );
}
