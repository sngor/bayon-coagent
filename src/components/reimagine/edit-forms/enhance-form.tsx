"use client";

import * as React from "react";
import {
    EnhanceParamsSchema,
    type EnhanceParams,
} from "@/ai/schemas/reimagine-schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/common";

interface EnhanceFormProps {
    onSubmit: (params: EnhanceParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<EnhanceParams>;
    isProcessing?: boolean;
    imageUrl?: string;
}

export function EnhanceForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
    imageUrl,
}: EnhanceFormProps) {
    const [autoAdjust, setAutoAdjust] = React.useState<boolean>(
        defaultValues?.autoAdjust ?? true
    );
    const [brightness, setBrightness] = React.useState<number>(
        defaultValues?.brightness ?? 0
    );
    const [contrast, setContrast] = React.useState<number>(
        defaultValues?.contrast ?? 0
    );
    const [saturation, setSaturation] = React.useState<number>(
        defaultValues?.saturation ?? 0
    );

    const handleReset = () => {
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const params: EnhanceParams = {
            autoAdjust,
            ...(autoAdjust
                ? {}
                : {
                    brightness,
                    contrast,
                    saturation,
                }),
        };

        // Validate with Zod schema
        const result = EnhanceParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        }
    };

    const hasManualChanges = brightness !== 0 || contrast !== 0 || saturation !== 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Preview with Live Adjustments */}
            {imageUrl && !autoAdjust && (
                <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                        <img
                            src={imageUrl}
                            alt="Enhancement preview"
                            className="w-full h-auto"
                            style={{
                                filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Preview shows approximate adjustments. Final AI enhancement may differ.
                    </p>
                </div>
            )}

            {/* Auto Adjust Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <Label htmlFor="auto-adjust" className="font-medium cursor-pointer">
                            AI Auto Enhance
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Let AI automatically optimize brightness, contrast, and colors
                    </p>
                </div>
                <Switch
                    id="auto-adjust"
                    checked={autoAdjust}
                    onCheckedChange={setAutoAdjust}
                    disabled={isProcessing}
                />
            </div>

            {/* Manual Adjustments */}
            {!autoAdjust && (
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Manual Adjustments</Label>
                        {hasManualChanges && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                disabled={isProcessing}
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                            </Button>
                        )}
                    </div>

                    {/* Brightness */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="brightness" className="text-sm">
                                Brightness
                            </Label>
                            <span className={cn(
                                "text-sm font-medium tabular-nums",
                                brightness > 0 && "text-green-600 dark:text-green-400",
                                brightness < 0 && "text-red-600 dark:text-red-400"
                            )}>
                                {brightness > 0 ? "+" : ""}
                                {brightness}
                            </span>
                        </div>
                        <Slider
                            id="brightness"
                            min={-100}
                            max={100}
                            step={5}
                            value={[brightness]}
                            onValueChange={(value) => setBrightness(value[0])}
                            disabled={isProcessing}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Make the image lighter or darker
                        </p>
                    </div>

                    {/* Contrast */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="contrast" className="text-sm">
                                Contrast
                            </Label>
                            <span className={cn(
                                "text-sm font-medium tabular-nums",
                                contrast > 0 && "text-green-600 dark:text-green-400",
                                contrast < 0 && "text-red-600 dark:text-red-400"
                            )}>
                                {contrast > 0 ? "+" : ""}
                                {contrast}
                            </span>
                        </div>
                        <Slider
                            id="contrast"
                            min={-100}
                            max={100}
                            step={5}
                            value={[contrast]}
                            onValueChange={(value) => setContrast(value[0])}
                            disabled={isProcessing}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Adjust the difference between light and dark areas
                        </p>
                    </div>

                    {/* Saturation */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="saturation" className="text-sm">
                                Saturation
                            </Label>
                            <span className={cn(
                                "text-sm font-medium tabular-nums",
                                saturation > 0 && "text-green-600 dark:text-green-400",
                                saturation < 0 && "text-red-600 dark:text-red-400"
                            )}>
                                {saturation > 0 ? "+" : ""}
                                {saturation}
                            </span>
                        </div>
                        <Slider
                            id="saturation"
                            min={-100}
                            max={100}
                            step={5}
                            value={[saturation]}
                            onValueChange={(value) => setSaturation(value[0])}
                            disabled={isProcessing}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Adjust color intensity and vibrancy
                        </p>
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium text-sm">Enhancement Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>AI Auto Enhance works best for most images</li>
                    <li>Manual mode gives you precise control over adjustments</li>
                    <li>Subtle changes (±20) often look more natural</li>
                    <li>Preview shows approximate results before processing</li>
                </ul>
            </div>

            {/* Action Buttons */}
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
                    disabled={isProcessing}
                    className="flex-1"
                >
                    {isProcessing ? "Enhancing..." : "Enhance Image"}
                </Button>
            </div>
        </form>
    );
}
