'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { SessionTemplate } from '@/lib/open-house/types';
import { createSessionTemplate, updateSessionTemplate } from '@/app/(app)/open-house/actions';
import { useRouter } from 'next/navigation';

interface TemplateFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: SessionTemplate; // If provided, we're editing
}

export function TemplateForm({ open, onOpenChange, template }: TemplateFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [formData, setFormData] = useState({
        name: template?.name || '',
        description: template?.description || '',
        propertyType: template?.propertyType || '',
        typicalDuration: template?.typicalDuration || 120,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setErrors({});

        try {
            let result;
            if (template) {
                // Update existing template
                result = await updateSessionTemplate(template.templateId, formData);
            } else {
                // Create new template
                result = await createSessionTemplate(formData);
            }

            if (result.success) {
                onOpenChange(false);
                router.refresh();
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    propertyType: '',
                    typicalDuration: 120,
                });
            } else {
                setError(result.error || 'An error occurred');
                if (result.errors) {
                    setErrors(result.errors);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {template ? 'Edit Template' : 'Create Template'}
                        </DialogTitle>
                        <DialogDescription>
                            {template
                                ? 'Update your session template. Changes will only affect future sessions.'
                                : 'Create a reusable template for common open house scenarios.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Template Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Luxury Home Open House"
                                maxLength={100}
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Describe when to use this template..."
                                maxLength={500}
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyType">Property Type</Label>
                            <Input
                                id="propertyType"
                                value={formData.propertyType}
                                onChange={(e) =>
                                    setFormData({ ...formData, propertyType: e.target.value })
                                }
                                placeholder="e.g., Single Family, Condo, Townhouse"
                            />
                            {errors.propertyType && (
                                <p className="text-sm text-destructive">{errors.propertyType[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="typicalDuration">
                                Typical Duration (minutes) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="typicalDuration"
                                type="number"
                                min="1"
                                value={formData.typicalDuration}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        typicalDuration: parseInt(e.target.value) || 0,
                                    })
                                }
                                required
                            />
                            {errors.typicalDuration && (
                                <p className="text-sm text-destructive">
                                    {errors.typicalDuration[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {template ? 'Update Template' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
