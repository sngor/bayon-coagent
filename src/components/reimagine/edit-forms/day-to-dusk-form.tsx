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

const directionLabels: Record<DayToDuskParams["direction"], string> = {
    "day-to-dusk": "Day to Dusk",
    "dusk-to-day": "Dusk to Day",
};

const directionDescriptions: Record<DayToDuskParams["direction"], string> = {
    "day-to-dusk": "Transform daytime photos to golden hour/dusk lighting",
    "dusk-to-day": "Convert dusk/evening photos to bright daytime lighting",
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

    const [direction, setDirection] = React.useState<
        DayToDuskParams["direction"]
    >(defaultValues?.direction || "day-to-dusk");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!intensity || !direction) {
            return;
        }

        const params: DayToDuskParams = { intensity, direction };

        // Validate with Zod schema
        const result = DayToDuskParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        }
    };

    const isValid = !!intensity && !!direction;

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="direction">Conversion Direction</Label>
                        <Select
                            value={direction}
                            onValueChange={(value) =>
                                setDirection(value as DayToDuskParams["direction"])
                            }
                            disabled={isProcessing}
                        >
                            <SelectTrigger id="direction">
                                <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(directionLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {direction && (
                            <p className="text-sm text-muted-foreground">
                                {directionDescriptions[direction]}
                            </p>
                        )}
                    </div>

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
                        <h4 className="font-headline text-sm font-medium">Tips for Best Results</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            {direction === "day-to-dusk" ? (
                                <>
                                    <li>Works best with daytime exterior photos</li>
                                    <li>Ensure the sky is visible in the image</li>
                                    <li>Interior lights will be enhanced automatically</li>
                                </>
                            ) : (
                                <>
                                    <li>Works best with dusk or evening exterior photos</li>
                                    <li>Converts warm evening tones to bright daylight</li>
                                    <li>Sky will be transformed to clear daytime blue</li>
                                </>
                            )}
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
                        {isProcessing ? "Processing..." : direction === "day-to-dusk" ? "Convert to Dusk" : "Convert to Day"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
