"use client";

import * as React from "react";
import {
    ItemRemovalParamsSchema,
    type ItemRemovalParams,
} from "@/ai/schemas/reimagine-schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

interface ItemRemovalFormProps {
    onSubmit: (params: ItemRemovalParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<ItemRemovalParams>;
    isProcessing?: boolean;
    imageUrl?: string;
}

export function ItemRemovalForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
    imageUrl,
}: ItemRemovalFormProps) {
    const [objects, setObjects] = React.useState<string[]>(
        defaultValues?.objects || [""]
    );
    const [maskData, setMaskData] = React.useState<string>(
        defaultValues?.maskData || ""
    );
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    // Load image onto canvas
    React.useEffect(() => {
        if (!imageUrl || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        draw(e);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        // Convert canvas to base64 mask data
        if (canvasRef.current) {
            const maskDataUrl = canvasRef.current.toDataURL("image/png");
            setMaskData(maskDataUrl);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
    };

    const handleClearMask = () => {
        if (!canvasRef.current || !imageUrl) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageUrl;
        setMaskData("");
    };

    const handleAddObject = () => {
        setObjects([...objects, ""]);
    };

    const handleRemoveObject = (index: number) => {
        setObjects(objects.filter((_, i) => i !== index));
    };

    const handleObjectChange = (index: number, value: string) => {
        const newObjects = [...objects];
        newObjects[index] = value;
        setObjects(newObjects);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const filteredObjects = objects.filter((obj) => obj.trim() !== "");

        if (!maskData || filteredObjects.length === 0) {
            return;
        }

        const params: ItemRemovalParams = {
            maskData,
            objects: filteredObjects,
        };

        // Validate with Zod schema
        const result = ItemRemovalParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        }
    };

    const isValid =
        maskData && objects.some((obj) => obj.trim() !== "");

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label>Mark Objects to Remove</Label>
                        <div className="border rounded-lg overflow-hidden bg-muted/50">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                className="w-full h-auto cursor-crosshair"
                                style={{ maxHeight: "400px" }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearMask}
                                disabled={isProcessing}
                            >
                                Clear Mask
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Click and drag to mark areas you want to remove
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label>Describe Objects to Remove</Label>
                        {objects.map((object, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={object}
                                    onChange={(e) => handleObjectChange(index, e.target.value)}
                                    placeholder="e.g., power lines, trash can, car"
                                    disabled={isProcessing}
                                />
                                {objects.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleRemoveObject(index)}
                                        disabled={isProcessing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddObject}
                            disabled={isProcessing}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Object
                        </Button>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <h4 className="font-headline text-sm font-medium">Removal Tips</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Mark the entire object you want to remove</li>
                            <li>Describe objects clearly for best results</li>
                            <li>Multiple objects can be removed at once</li>
                        </ul>
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
                        {isProcessing ? "Processing..." : "Remove Objects"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
