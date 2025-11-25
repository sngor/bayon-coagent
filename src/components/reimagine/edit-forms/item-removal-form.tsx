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
import { X, Plus, Eraser, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [brushSize, setBrushSize] = React.useState(20);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const imageRef = React.useRef<HTMLImageElement | null>(null);

    // Load image onto canvas
    React.useEffect(() => {
        if (!imageUrl || !canvasRef.current || !maskCanvasRef.current) return;

        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const ctx = canvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        if (!ctx || !maskCtx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Store image reference
            imageRef.current = img;

            // Calculate display dimensions (max 600px width)
            const maxWidth = 600;
            const scale = Math.min(1, maxWidth / img.width);
            const displayWidth = img.width * scale;
            const displayHeight = img.height * scale;

            // Set canvas size to display size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            maskCanvas.width = displayWidth;
            maskCanvas.height = displayHeight;

            // Draw image on main canvas
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

            // Initialize mask canvas with transparent background
            maskCtx.clearRect(0, 0, displayWidth, displayHeight);

            setImageLoaded(true);
        };
        img.onerror = () => {
            console.error("Failed to load image");
            setImageLoaded(false);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const coords = getCoordinates(e);
        if (!coords || !maskCanvasRef.current || !canvasRef.current) return;

        const maskCtx = maskCanvasRef.current.getContext("2d");
        const displayCtx = canvasRef.current.getContext("2d");
        if (!maskCtx || !displayCtx) return;

        // Draw on mask canvas (white on black)
        maskCtx.fillStyle = "white";
        maskCtx.beginPath();
        maskCtx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
        maskCtx.fill();

        // Draw on display canvas (semi-transparent red overlay)
        displayCtx.fillStyle = "rgba(255, 0, 0, 0.4)";
        displayCtx.beginPath();
        displayCtx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
        displayCtx.fill();

        // Update mask data
        updateMaskData();
    };

    const updateMaskData = () => {
        if (!maskCanvasRef.current) return;
        const maskDataUrl = maskCanvasRef.current.toDataURL("image/png");
        setMaskData(maskDataUrl);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);
        draw(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        draw(e);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);
        draw(e);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();
        draw(e);
    };

    const handleTouchEnd = () => {
        setIsDrawing(false);
    };

    const handleClearMask = () => {
        if (!canvasRef.current || !maskCanvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const ctx = canvas.getContext("2d");
        const maskCtx = maskCanvas.getContext("2d");
        if (!ctx || !maskCtx) return;

        // Clear both canvases
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Redraw original image
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

        setMaskData("");
    };

    const handleAddObject = () => {
        setObjects([...objects, ""]);
    };

    const handleRemoveObject = (index: number) => {
        if (objects.length === 1) return; // Keep at least one
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

    const isValid = maskData && objects.some((obj) => obj.trim() !== "");

    if (!imageUrl) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground text-center">
                        Please upload an image first
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Mark Objects to Remove</Label>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="brush-size" className="text-xs text-muted-foreground">Brush Size:</Label>
                        <input
                            id="brush-size"
                            type="range"
                            min="5"
                            max="50"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-24"
                            disabled={isProcessing}
                            aria-label="Brush size for marking objects"
                        />
                        <span className="text-xs text-muted-foreground w-8">{brushSize}px</span>
                    </div>
                </div>

                <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Loading image...</p>
                        </div>
                    )}
                    <div className="relative">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className={cn(
                                "w-full h-auto touch-none",
                                imageLoaded ? "cursor-crosshair" : "cursor-wait"
                            )}
                        />
                        <canvas
                            ref={maskCanvasRef}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearMask}
                        disabled={isProcessing || !maskData}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear Mask
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    <Eraser className="h-3 w-3 inline mr-1" />
                    Paint over the objects you want to remove. The red overlay shows your selection.
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
                            className="flex-1"
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
                    disabled={isProcessing || objects.length >= 5}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Object
                </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium text-sm">Removal Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Paint over the entire object you want to remove</li>
                    <li>Describe objects clearly for best AI results</li>
                    <li>You can remove multiple objects at once</li>
                    <li>Adjust brush size for better precision</li>
                </ul>
            </div>

            <div className="flex gap-2 pt-2">
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
                    {isProcessing ? "Removing..." : "Remove Objects"}
                </Button>
            </div>
        </form>
    );
}
