"use client";

import * as React from "react";
import {
    DayToDuskParamsSchema,
    type DayToDuskParams,
} from "@/ai/schemas/reimagine-schemas";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface DayToDuskFormProps {
    onSubmit: (params: DayToDuskParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<DayToDuskParams>;
    isProcessing?: boolean;
}

const intensityLabels: Record<DayToDuskParams["intensity"], string> = {
    subtle: "Subtle",
    moderate: "Moderate",
    dramatic: "Dramatic",
};

const intensityDescriptions: Record<DayToDuskParams["intensity"], string> = {
    subtle: "Light golden hour glow with minimal sky changes",
    moderate: "Balanced dusk lighting with warm tones and enhanced sky",
    dramatic: "Deep sunset colors with rich golden lighting and vibrant sky",
};

export function DayToDuskForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
}: DayToDuskFormProps) {
    const [intensity, setIntensity] = React.useState<
        DayToDuskParams["intensity"] | undefined
    >(defaultValues?.intensity || "moderate");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!intensity) {
            return;
        }

        const params: DayToDuskParams = { intensity };

        // Validate with Zod schema
        const result = DayToDuskParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        }
    };

    const isValid = !!intensity;

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="intensity">Lighting Intensity</Label>
                        <Select
                            value={intensity}
                            onValueChange={(value) =>
                                setIntensity(value as DayToDuskParams["intensity"])
                            }
                            disabled={isProcessing}
                        >
                            <SelectTrigger id="intensity">
                                <SelectValue placeholder="Select intensity" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(intensityLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {intensity && (
                            <p className="text-sm text-muted-foreground">
                                {intensityDescriptions[intensity]}
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <h4 className="text-sm font-medium">Tips for Best Results</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Works best with daytime exterior photos</li>
                            <li>Ensure the sky is visible in the image</li>
                            <li>Interior lights will be enhanced automatically</li>
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
                        {isProcessing ? "Processing..." : "Convert to Dusk"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
