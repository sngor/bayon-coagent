"use client";

import { useState, useEffect } from "react";
import { Testimonial } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClientPhotoUpload } from "@/components/client-photo-upload";
import { X } from "lucide-react";

interface TestimonialFormProps {
    userId: string;
    testimonial?: Testimonial;
    onSubmit: (data: TestimonialFormData) => Promise<void>;
    onCancel?: () => void;
}

export interface TestimonialFormData {
    clientName: string;
    testimonialText: string;
    dateReceived: string;
    clientPhotoUrl?: string;
    isFeatured: boolean;
    displayOrder?: number;
    tags: string[];
}

export function TestimonialForm({
    userId,
    testimonial,
    onSubmit,
    onCancel,
}: TestimonialFormProps) {
    const [formData, setFormData] = useState<TestimonialFormData>({
        clientName: testimonial?.clientName || "",
        testimonialText: testimonial?.testimonialText || "",
        dateReceived: testimonial?.dateReceived
            ? new Date(testimonial.dateReceived).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        clientPhotoUrl: testimonial?.clientPhotoUrl,
        isFeatured: testimonial?.isFeatured || false,
        displayOrder: testimonial?.displayOrder,
        tags: testimonial?.tags || [],
    });

    const [tagInput, setTagInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.clientName.trim()) {
            newErrors.clientName = "Client name is required";
        }

        if (!formData.testimonialText.trim()) {
            newErrors.testimonialText = "Testimonial text is required";
        }

        if (!formData.dateReceived) {
            newErrors.dateReceived = "Date received is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error("Form submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag)) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div>
                <Label htmlFor="clientName">
                    Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                    }
                    error={errors.clientName}
                    placeholder="John Smith"
                />
            </div>

            {/* Testimonial Text */}
            <div>
                <Label htmlFor="testimonialText">
                    Testimonial <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="testimonialText"
                    value={formData.testimonialText}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            testimonialText: e.target.value,
                        }))
                    }
                    placeholder="Share what the client said about your service..."
                    rows={6}
                    className={errors.testimonialText ? "border-destructive" : ""}
                />
                {errors.testimonialText && (
                    <p className="text-sm text-destructive mt-1">
                        {errors.testimonialText}
                    </p>
                )}
            </div>

            {/* Date Received */}
            <div>
                <Label htmlFor="dateReceived">
                    Date Received <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="dateReceived"
                    type="date"
                    value={formData.dateReceived}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dateReceived: e.target.value }))
                    }
                    error={errors.dateReceived}
                    disabled={!!testimonial} // Preserve original date on edit
                />
                {testimonial && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Date received cannot be changed after creation
                    </p>
                )}
            </div>

            {/* Client Photo Upload */}
            <ClientPhotoUpload
                userId={userId}
                currentPhotoUrl={formData.clientPhotoUrl}
                onPhotoUploaded={(url) =>
                    setFormData((prev) => ({ ...prev, clientPhotoUrl: url }))
                }
                onPhotoRemoved={() =>
                    setFormData((prev) => ({ ...prev, clientPhotoUrl: undefined }))
                }
            />

            {/* Tags */}
            <div>
                <Label htmlFor="tagInput">Tags</Label>
                <div className="flex gap-2">
                    <Input
                        id="tagInput"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add tags (e.g., buyer, seller, luxury)"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                    </Button>
                </div>
                {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                    aria-label={`Remove ${tag} tag`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Featured Status */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                    aria-label="Mark as featured"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">
                    Mark as featured (display on profile page)
                </Label>
            </div>

            {/* Display Order (only if featured) */}
            {formData.isFeatured && (
                <div>
                    <Label htmlFor="displayOrder">Display Order (Optional)</Label>
                    <Input
                        id="displayOrder"
                        type="number"
                        min="0"
                        value={formData.displayOrder || ""}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                displayOrder: e.target.value ? parseInt(e.target.value) : undefined,
                            }))
                        }
                        placeholder="Leave empty for automatic ordering"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Lower numbers appear first. Leave empty to use date order.
                    </p>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : testimonial
                            ? "Update Testimonial"
                            : "Create Testimonial"}
                </Button>
            </div>
        </form>
    );
}
