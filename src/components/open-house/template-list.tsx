'use client';

import { useState } from 'react';
import { TemplateCard } from './template-card';
import { TemplateForm } from './template-form';
import type { SessionTemplate } from '@/lib/open-house/types';
import { deleteSessionTemplate } from '@/app/(app)/open-house/actions';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TemplateListProps {
    templates: SessionTemplate[];
    onUseTemplate: (template: SessionTemplate) => void;
}

export function TemplateList({ templates, onUseTemplate }: TemplateListProps) {
    const router = useRouter();
    const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | undefined>();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleEdit = (template: SessionTemplate) => {
        setEditingTemplate(template);
        setFormOpen(true);
    };

    const handleDelete = (templateId: string) => {
        setTemplateToDelete(templateId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        setDeleting(true);
        try {
            const result = await deleteSessionTemplate(templateToDelete);
            if (result.success) {
                router.refresh();
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
            } else {
                alert(result.error || 'Failed to delete template');
            }
        } catch (error) {
            alert('An unexpected error occurred');
        } finally {
            setDeleting(false);
        }
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) {
            setEditingTemplate(undefined);
        }
    };

    if (templates.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <TemplateCard
                        key={template.templateId}
                        template={template}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUse={onUseTemplate}
                    />
                ))}
            </div>

            <TemplateForm
                open={formOpen}
                onOpenChange={handleFormClose}
                template={editingTemplate}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this template? This action cannot be
                            undone. Sessions created from this template will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
