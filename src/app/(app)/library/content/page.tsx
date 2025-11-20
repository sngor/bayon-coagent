
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
import { useQuery } from '@/aws/dynamodb/hooks';
import type { SavedContent, Project } from '@/lib/types';
import {
    createProjectAction,
    moveContentToProjectAction,
    deleteContentAction,
    renameContentAction,
} from '@/app/actions';
import { Library, Copy, Folder, FolderPlus, MoreVertical, Trash2, Pencil, ChevronsUpDown } from 'lucide-react';
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




function CreateProjectDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useUser();
    const [name, setName] = useState('');

    const handleCreateProject = async () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Project name is required.' });
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', name);
            const result = await createProjectAction(null, formData);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Project Created!', description: `"${name}" has been created.` });
                setName('');
                setIsOpen(false);
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

function RenameContentDialog({ item, isOpen, setIsOpen }: { item: SavedContent | null, isOpen: boolean, setIsOpen: (open: boolean) => void }) {
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
            const result = await renameContentAction(item.id, name);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Content Renamed!', description: `The item has been renamed to "${name}".` });
                setIsOpen(false);
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
    const { user } = useUser();
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<SavedContent | null>(null);
    const [itemToRename, setItemToRename] = useState<SavedContent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Memoize DynamoDB keys
    const savedContentPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const savedContentSKPrefix = useMemo(() => 'CONTENT#', []);

    const projectsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const projectsSKPrefix = useMemo(() => 'PROJECT#', []);

    const { data: savedContent, isLoading: isLoadingContent } = useQuery<SavedContent>(savedContentPK, savedContentSKPrefix, {
        scanIndexForward: false, // descending order
    });
    const { data: projects, isLoading: isLoadingProjects } = useQuery<Project>(projectsPK, projectsSKPrefix, {
        scanIndexForward: false, // descending order
    });

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
            const result = await moveContentToProjectAction(contentId, projectId);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Content Moved', description: 'The item has been moved to the new project.' });
            }
        } catch (error) {
            console.error('Failed to move content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move content.' });
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            const result = await deleteContentAction(itemToDelete.id);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Content Deleted', description: 'The saved item has been removed.' });
                setItemToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete content.' });
        }
    }

    const isLoading = isLoadingContent || isLoadingProjects;

    const projectList = useMemo(() => {
        if (!projects) return [];
        const unsortedProjects = [...projects];
        const categorized = unsortedProjects.sort((a, b) => a.name.localeCompare(b.name));
        return [{ id: 'uncategorized', name: 'Uncategorized', createdAt: new Date().toISOString() }, ...categorized];
    }, [projects]);


    return (
        <div className="space-y-6">
            {!isLoading && savedContent && savedContent.length > 0 && (
                <div className="mb-6">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search content by name, type, or keywords..."
                    />
                </div>
            )}

            {isLoading && <StandardSkeleton variant="list" count={3} />}

            {!isLoading && savedContent && savedContent.length > 0 && (
                <AlertDialog>
                    <Accordion type="multiple" className="w-full space-y-4" defaultValue={['uncategorized']}>
                        {projectList.map(project => {
                            const items = contentByProject[project.id] || [];
                            if (items.length === 0) return null;

                            return (
                                <AccordionItem value={project.id} key={project.id} className="border-none">
                                    <AccordionTrigger className="bg-muted px-4 py-3 rounded-lg hover:no-underline text-lg font-headline">
                                        <div className="flex items-center gap-3">
                                            <Folder className="h-5 w-5 text-muted-foreground" />
                                            <span>{project.name} ({items.length})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
                                        {items.map(item => (
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
                                                                                <DropdownMenuItem key={p.id} onSelect={() => handleMoveToProject(item.id, p.id)}>
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
                                        ))}
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

            {!isLoading && (!savedContent || savedContent.length === 0) && (
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
            <CreateProjectDialog isOpen={isCreateProjectOpen} setIsOpen={setIsCreateProjectOpen} />
            <RenameContentDialog item={itemToRename} isOpen={!!itemToRename} setIsOpen={() => setItemToRename(null)} />
        </div>
    );
}
