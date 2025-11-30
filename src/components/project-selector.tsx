'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import { getProjectsAction, createProjectAction } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import type { Project } from '@/lib/types/common';

interface ProjectSelectorProps {
    value?: string | null;
    onChange: (projectId: string | null) => void;
    label?: string;
    placeholder?: string;
}

export function ProjectSelector({
    value,
    onChange,
    label = 'Save to Project',
    placeholder = 'Select a project (optional)',
}: ProjectSelectorProps) {
    const { user } = useUser();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        if (user?.id) {
            loadProjects();
        }
    }, [user?.id]);

    const loadProjects = async () => {
        if (!user?.id) {
            console.warn('No user ID available for loading projects');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            console.log('Loading projects for user:', user.id);
            const result = await getProjectsAction(user.id);
            console.log('Projects result:', result);

            if (result.data) {
                setProjects(result.data);
                console.log('Loaded projects:', result.data.length);
            } else {
                console.warn('No projects data returned:', result);
                setProjects([]);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load projects. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Project name is required.' });
            return;
        }

        if (!user?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create projects.' });
            return;
        }

        try {
            const result = await createProjectAction(user.id, newProjectName);

            if (result.errors || !result.data) {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                toast({ title: 'Project Created!', description: `"${newProjectName}" has been created.` });
                setNewProjectName('');
                setIsCreateDialogOpen(false);
                await loadProjects();
                onChange(result.data.id);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
        }
    };

    return (
        <>
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex gap-2">
                    <Select
                        value={value || 'none'}
                        onValueChange={(val) => onChange(val === 'none' ? null : val)}
                        disabled={isLoading || !user?.id}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue
                                placeholder={
                                    isLoading
                                        ? "Loading projects..."
                                        : !user?.id
                                            ? "Please log in to see projects"
                                            : placeholder
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Project</SelectItem>
                            {projects.length === 0 && !isLoading && user?.id && (
                                <SelectItem value="empty" disabled>
                                    No projects yet - create one below
                                </SelectItem>
                            )}
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreateDialogOpen(true)}
                        title="Create new project"
                        disabled={!user?.id}
                    >
                        <FolderPlus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Create a new folder to organize your saved content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="newProjectName">Project Name</Label>
                        <Input
                            id="newProjectName"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., 'Luxury Condo Listings'"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateProject();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProject}>Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
