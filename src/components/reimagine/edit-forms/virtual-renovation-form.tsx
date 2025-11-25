"use client";

import * as React from "react";
import {
    VirtualRenovationParamsSchema,
    type VirtualRenovationParams,
} from "@/ai/schemas/reimagine-schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface VirtualRenovationFormProps {
    onSubmit: (params: VirtualRenovationParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<VirtualRenovationParams>;
    isProcessing?: boolean;
}

export function VirtualRenovationForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
}: VirtualRenovationFormProps) {
    const [description, setDescription] = React.useState<string>(
        defaultValues?.description || ""
    );
    const [style, setStyle] = React.useState<string>(
        defaultValues?.style || ""
    );
    const [error, setError] = React.useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (description.length < 10) {
            setError("Description must be at least 10 characters");
            return;
        }

        if (description.length > 1000) {
            setError("Description must be less than 1000 characters");
            return;
        }

        const params: VirtualRenovationParams = {
            description,
            ...(style.trim() ? { style: style.trim() } : {}),
        };

        // Validate with Zod schema
        const result = VirtualRenovationParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        } else {
            setError(result.error.errors[0]?.message || "Invalid parameters");
        }
    };

    const isValid = description.length >= 10 && description.length <= 1000;
    const charCount = description.length;

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="description">Renovation Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the renovations you want to visualize. For example: 'Replace the old kitchen cabinets with modern white shaker cabinets, add a marble countertop, and install stainless steel appliances'"
                            rows={6}
                            disabled={isProcessing}
                            className={error ? "border-destructive" : ""}
                        />
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                                Be specific about materials, colors, and changes
                            </p>
                            <span
                                className={`text-sm ${charCount < 10 || charCount > 1000
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {charCount}/1000
                            </span>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="style">Style Guidance (Optional)</Label>
                        <Input
                            id="style"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            placeholder="e.g., modern farmhouse, industrial, coastal"
                            disabled={isProcessing}
                        />
                        <p className="text-sm text-muted-foreground">
                            Specify an overall design style for the renovation
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <h4 className="font-headline text-sm font-medium">Renovation Tips</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Be specific about materials and finishes</li>
                            <li>Mention colors and textures you want</li>
                            <li>Describe structural changes clearly</li>
                            <li>Include lighting and fixture details</li>
                        </ul>
                    </div>

                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
                        <h4 className="font-headline text-sm font-medium text-blue-900 dark:text-blue-100">
                            Example Descriptions
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                            <p>
                                <strong>Kitchen:</strong> "Replace dated oak cabinets with white
                                shaker-style cabinets, install quartz countertops in white with
                                gray veining, add a subway tile backsplash, and update to
                                stainless steel appliances"
                            </p>
                            <p>
                                <strong>Bathroom:</strong> "Remove old tub and install a walk-in
                                shower with glass doors, add large format gray tiles, install a
                                floating vanity with vessel sink, and add modern chrome fixtures"
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isValid || isProcessing}
                        className="flex-1"
                    >
                        {isProcessing ? "Renovating..." : "Visualize Renovation"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
