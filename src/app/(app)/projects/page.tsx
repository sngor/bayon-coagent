
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { getRepository } from '@/aws/dynamodb';
import { getProjectKeys, getSavedContentKeys } from '@/aws/dynamodb/keys';
import type { SavedContent, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
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


function SavedContentSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
            ))}
        </div>
    )
}

function CreateProjectDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useUser();
    const [name, setName] = useState('');

    const handleCreateProject = async () => {
        if (!user || !name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Project name is required.' });
            return;
        }
        try {
            const repository = getRepository();
            const projectId = Date.now().toString();
            const keys = getProjectKeys(user.id, projectId);
            await repository.put({
                ...keys,
                EntityType: 'Project',
                Data: {
                    name,
                    createdAt: new Date().toISOString(),
                },
                CreatedAt: Date.now(),
                UpdatedAt: Date.now()
            });
            toast({ title: 'Project Created!', description: `"${name}" has been created.` });
            setName('');
            setIsOpen(false);
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
        if (!user || !item || !name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Content name is required.' });
            return;
        }
        try {
            const repository = getRepository();
            const keys = getSavedContentKeys(user.id, item.id);
            await repository.update(keys.PK, keys.SK, { name });
            toast({ title: 'Content Renamed!', description: `The item has been renamed to "${name}".` });
            setIsOpen(false);
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


export default function ProjectsPage() {
    const { user } = useUser();
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<SavedContent | null>(null);
    const [itemToRename, setItemToRename] = useState<SavedContent | null>(null);

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

        for (const item of savedContent) {
            if (item.projectId && grouped[item.projectId]) {
                grouped[item.projectId].push(item);
            } else {
                grouped.uncategorized.push(item);
            }
        }

        return grouped;
    }, [savedContent, projects]);

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
        if (!user) return;
        try {
            const repository = getRepository();
            const keys = getSavedContentKeys(user.id, contentId);
            await repository.update(keys.PK, keys.SK, { projectId: projectId || null });
            toast({ title: 'Content Moved', description: 'The item has been moved to the new project.' });
        } catch (error) {
            console.error('Failed to move content:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move content.' });
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete || !user) return;
        try {
            const repository = getRepository();
            const keys = getSavedContentKeys(user.id, itemToDelete.id);
            await repository.delete(keys.PK, keys.SK);
            toast({ title: 'Content Deleted', description: 'The saved item has been removed.' });
            setItemToDelete(null);
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
        <div className="animate-fade-in-up space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <PageHeader
                    title="Projects"
                    description="Your library of AI-generated content, organized by project."
                />
                <Button onClick={() => setIsCreateProjectOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Project
                </Button>
            </div>

            {isLoading && <SavedContentSkeleton />}

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
                <Card className="flex flex-col items-center justify-center text-center py-20 animate-fade-in-up">
                    <Library className="h-16 w-16 mb-4 text-muted-foreground" />
                    <CardTitle className="font-headline text-2xl">Your Projects are Empty</CardTitle>
                    <CardDescription className="mt-2">
                        You haven't saved any content yet.
                    </CardDescription>
                    <CardContent className="mt-6">
                        <Button asChild>
                            <Link href="/content-engine">
                                Go to the Co-Marketing Studio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
            <CreateProjectDialog isOpen={isCreateProjectOpen} setIsOpen={setIsCreateProjectOpen} />
            <RenameContentDialog item={itemToRename} isOpen={!!itemToRename} setIsOpen={() => setItemToRename(null)} />
        </div>
    );
}
