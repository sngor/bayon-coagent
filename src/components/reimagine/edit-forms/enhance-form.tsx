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
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface EnhanceFormProps {
    onSubmit: (params: EnhanceParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<EnhanceParams>;
    isProcessing?: boolean;
}

export function EnhanceForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
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

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-adjust">Auto Adjust</Label>
                            <p className="text-sm text-muted-foreground">
                                Let AI automatically optimize all settings
                            </p>
                        </div>
                        <Switch
                            id="auto-adjust"
                            checked={autoAdjust}
                            onCheckedChange={setAutoAdjust}
                            disabled={isProcessing}
                        />
                    </div>

                    {!autoAdjust && (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="brightness">Brightness</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {brightness > 0 ? "+" : ""}
                                        {brightness}
                                    </span>
                                </div>
                                <Slider
                                    id="brightness"
                                    min={-100}
                                    max={100}
                                    step={1}
                                    value={[brightness]}
                                    onValueChange={(value) => setBrightness(value[0])}
                                    disabled={isProcessing}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Adjust overall image brightness
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="contrast">Contrast</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {contrast > 0 ? "+" : ""}
                                        {contrast}
                                    </span>
                                </div>
                                <Slider
                                    id="contrast"
                                    min={-100}
                                    max={100}
                                    step={1}
                                    value={[contrast]}
                                    onValueChange={(value) => setContrast(value[0])}
                                    disabled={isProcessing}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Adjust difference between light and dark areas
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="saturation">Saturation</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {saturation > 0 ? "+" : ""}
                                        {saturation}
                                    </span>
                                </div>
                                <Slider
                                    id="saturation"
                                    min={-100}
                                    max={100}
                                    step={1}
                                    value={[saturation]}
                                    onValueChange={(value) => setSaturation(value[0])}
                                    disabled={isProcessing}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Adjust color intensity and vibrancy
                                </p>
                            </div>
                        </>
                    )}

                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <h4 className="text-sm font-medium">Enhancement Tips</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Auto adjust works best for most images</li>
                            <li>Manual adjustments give you precise control</li>
                            <li>Subtle changes often look more natural</li>
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
                    <Button type="submit" disabled={isProcessing} className="flex-1">
                        {isProcessing ? "Processing..." : "Enhance Image"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
