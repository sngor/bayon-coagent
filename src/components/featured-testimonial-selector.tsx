"use client";

import { useState, useEffect } from "react";
import { Testimonial } from "@/lib/types/common/common";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, GripVertical, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils/common";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FeaturedTestimonialSelectorProps {
    testimonials: Testimonial[];
    onSave: (featured: Testimonial[]) => Promise<void>;
}

interface SortableTestimonialItemProps {
    testimonial: Testimonial;
    onRemove: (id: string) => void;
}

function SortableTestimonialItem({ testimonial, onRemove }: SortableTestimonialItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: testimonial.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 bg-card border rounded-lg",
                isDragging && "opacity-50 shadow-lg"
            )}
        >
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing touch-none"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{testimonial.clientName}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {testimonial.testimonialText}
                </p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(testimonial.id)}
                className="shrink-0"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function FeaturedTestimonialSelector({
    testimonials,
    onSave,
}: FeaturedTestimonialSelectorProps) {
    const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);
    const [availableTestimonials, setAvailableTestimonials] = useState<Testimonial[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize featured and available testimonials
    useEffect(() => {
        const featured = testimonials
            .filter((t) => t.isFeatured)
            .sort((a, b) => {
                const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            })
            .slice(0, 6); // Limit to 6

        const available = testimonials.filter((t) => !t.isFeatured);

        setFeaturedTestimonials(featured);
        setAvailableTestimonials(available);
        setHasChanges(false);
    }, [testimonials]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFeaturedTestimonials((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
            setHasChanges(true);
        }
    };

    const handleAddTestimonial = (testimonial: Testimonial) => {
        if (featuredTestimonials.length >= 6) {
            return; // Already at limit
        }

        setFeaturedTestimonials((prev) => [...prev, testimonial]);
        setAvailableTestimonials((prev) => prev.filter((t) => t.id !== testimonial.id));
        setHasChanges(true);
    };

    const handleRemoveTestimonial = (testimonialId: string) => {
        const testimonial = featuredTestimonials.find((t) => t.id === testimonialId);
        if (!testimonial) return;

        setFeaturedTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
        setAvailableTestimonials((prev) => [...prev, testimonial]);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update displayOrder for featured testimonials
            const updatedFeatured = featuredTestimonials.map((t, index) => ({
                ...t,
                isFeatured: true,
                displayOrder: index,
            }));

            await onSave(updatedFeatured);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save featured testimonials:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const canAddMore = featuredTestimonials.length < 6;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Featured Testimonials
                        </CardTitle>
                        <CardDescription>
                            Select up to 6 testimonials to display on your profile page. Drag to
                            reorder.
                        </CardDescription>
                    </div>
                    <Badge variant={canAddMore ? "secondary" : "default"}>
                        {featuredTestimonials.length} / 6
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Featured Testimonials List */}
                <div>
                    <h3 className="text-sm font-medium mb-3">Featured on Profile</h3>
                    {featuredTestimonials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No featured testimonials yet</p>
                            <p className="text-sm">Add testimonials from the list below</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={featuredTestimonials.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {featuredTestimonials.map((testimonial) => (
                                        <SortableTestimonialItem
                                            key={testimonial.id}
                                            testimonial={testimonial}
                                            onRemove={handleRemoveTestimonial}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                {/* Available Testimonials */}
                {availableTestimonials.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3">Available Testimonials</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableTestimonials.map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {testimonial.clientName}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {testimonial.testimonialText}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddTestimonial(testimonial)}
                                        disabled={!canAddMore}
                                        className="shrink-0"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        size="lg"
                    >
                        {isSaving ? "Saving..." : "Save Featured Testimonials"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
