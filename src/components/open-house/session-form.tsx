'use client';

import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import type { SessionTemplate } from '@/lib/open-house/types';
import { createOpenHouseSession, listSessionTemplates } from '@/app/(app)/open-house/actions';
import { useRouter } from 'next/navigation';

interface SessionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SessionForm({ open, onOpenChange }: SessionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [templates, setTemplates] = useState<SessionTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');

    const [formData, setFormData] = useState({
        propertyAddress: '',
        propertyId: '',
        scheduledDate: '',
        scheduledStartTime: '',
        scheduledEndTime: '',
        notes: '',
        templateId: '',
    });

    // Load templates when dialog opens
    useEffect(() => {
        if (open) {
            loadTemplates();
        }
    }, [open]);

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const result = await listSessionTemplates();
            if (result.success && result.templates) {
                setTemplates(result.templates);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Apply template when selected (Requirement 14.2)
    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);

        if (!templateId || templateId === 'none') {
            // Clear template-related fields
            setFormData((prev) => ({
                ...prev,
                scheduledEndTime: '',
                notes: '',
                templateId: '',
            }));
            return;
        }

        const template = templates.find((t) => t.templateId === templateId);
        if (!template) return;

        // Pre-populate form with template values (Requirement 14.2)
        setFormData((prev) => {
            const updates: any = {
                ...prev,
                templateId: template.templateId,
                notes: `Created from template: ${template.name}`,
            };

            // Calculate end time based on typical duration if start time is set
            if (prev.scheduledStartTime && template.typicalDuration) {
                const startTime = new Date(prev.scheduledStartTime);
                const endTime = new Date(startTime.getTime() + template.typicalDuration * 60000);
                updates.scheduledEndTime = endTime.toISOString().slice(0, 16);
            }

            return updates;
        });
    };

    // Update end time when start time changes and template is selected
    const handleStartTimeChange = (startTime: string) => {
        setFormData((prev) => {
            const updates: any = { ...prev, scheduledStartTime: startTime };

            // Auto-calculate end time if template is selected
            if (selectedTemplateId && selectedTemplateId !== 'none' && startTime) {
                const template = templates.find((t) => t.templateId === selectedTemplateId);
                if (template?.typicalDuration) {
                    const start = new Date(startTime);
                    const end = new Date(start.getTime() + template.typicalDuration * 60000);
                    updates.scheduledEndTime = end.toISOString().slice(0, 16);
                }
            }

            return updates;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setErrors({});

        try {
            const result = await createOpenHouseSession(formData);

            if (result.success) {
                onOpenChange(false);
                router.push(`/open-house/sessions/${result.sessionId}`);
                // Reset form
                setFormData({
                    propertyAddress: '',
                    propertyId: '',
                    scheduledDate: '',
                    scheduledStartTime: '',
                    scheduledEndTime: '',
                    notes: '',
                    templateId: '',
                });
                setSelectedTemplateId('none');
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Open House Session</DialogTitle>
                        <DialogDescription>
                            Schedule a new open house event. You can use a template to pre-fill common settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Template Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="template">Use Template (Optional)</Label>
                            <Select
                                value={selectedTemplateId}
                                onValueChange={handleTemplateSelect}
                                disabled={loadingTemplates}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No template</SelectItem>
                                    {templates.map((template) => (
                                        <SelectItem key={template.templateId} value={template.templateId}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span>{template.name}</span>
                                                {template.usageCount > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({template.usageCount} uses)
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {loadingTemplates && (
                                <p className="text-xs text-muted-foreground">Loading templates...</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyAddress">
                                Property Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="propertyAddress"
                                value={formData.propertyAddress}
                                onChange={(e) =>
                                    setFormData({ ...formData, propertyAddress: e.target.value })
                                }
                                placeholder="123 Main St, City, State ZIP"
                                required
                            />
                            {errors.propertyAddress && (
                                <p className="text-sm text-destructive">{errors.propertyAddress[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyId">Property ID (Optional)</Label>
                            <Input
                                id="propertyId"
                                value={formData.propertyId}
                                onChange={(e) =>
                                    setFormData({ ...formData, propertyId: e.target.value })
                                }
                                placeholder="MLS# or internal ID"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledDate">
                                    Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    value={formData.scheduledDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduledDate: e.target.value })
                                    }
                                    required
                                />
                                {errors.scheduledDate && (
                                    <p className="text-sm text-destructive">{errors.scheduledDate[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduledStartTime">
                                    Start Time <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="scheduledStartTime"
                                    type="datetime-local"
                                    value={formData.scheduledStartTime}
                                    onChange={(e) => handleStartTimeChange(e.target.value)}
                                    required
                                />
                                {errors.scheduledStartTime && (
                                    <p className="text-sm text-destructive">
                                        {errors.scheduledStartTime[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scheduledEndTime">End Time (Optional)</Label>
                            <Input
                                id="scheduledEndTime"
                                type="datetime-local"
                                value={formData.scheduledEndTime}
                                onChange={(e) =>
                                    setFormData({ ...formData, scheduledEndTime: e.target.value })
                                }
                            />
                            {selectedTemplateId && selectedTemplateId !== 'none' && (
                                <p className="text-xs text-muted-foreground">
                                    Auto-calculated from template duration
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                placeholder="Add any notes about this open house..."
                                rows={3}
                            />
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
                            Create Session
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
