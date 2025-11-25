"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    VirtualStagingParamsSchema,
    type VirtualStagingParams,
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface VirtualStagingFormProps {
    onSubmit: (params: VirtualStagingParams) => void;
    onCancel: () => void;
    defaultValues?: Partial<VirtualStagingParams>;
    isProcessing?: boolean;
}

const roomTypeLabels: Record<VirtualStagingParams["roomType"], string> = {
    "living-room": "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    "dining-room": "Dining Room",
    office: "Office",
    bathroom: "Bathroom",
};

const styleLabels: Record<VirtualStagingParams["style"], string> = {
    modern: "Modern",
    traditional: "Traditional",
    minimalist: "Minimalist",
    luxury: "Luxury",
    rustic: "Rustic",
    contemporary: "Contemporary",
};

export function VirtualStagingForm({
    onSubmit,
    onCancel,
    defaultValues,
    isProcessing = false,
}: VirtualStagingFormProps) {
    const [roomType, setRoomType] = React.useState<
        VirtualStagingParams["roomType"] | undefined
    >(defaultValues?.roomType);
    const [style, setStyle] = React.useState<
        VirtualStagingParams["style"] | undefined
    >(defaultValues?.style);
    const [customPrompt, setCustomPrompt] = React.useState<string>(
        defaultValues?.customPrompt || ""
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomType || !style) {
            return;
        }

        const params: VirtualStagingParams = {
            roomType,
            style,
            ...(customPrompt && { customPrompt }),
        };

        // Validate with Zod schema
        const result = VirtualStagingParamsSchema.safeParse(params);
        if (result.success) {
            onSubmit(result.data);
        }
    };

    const isValid = roomType && style;

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="room-type">Room Type</Label>
                        <Select
                            value={roomType}
                            onValueChange={(value) =>
                                setRoomType(value as VirtualStagingParams["roomType"])
                            }
                            disabled={isProcessing}
                        >
                            <SelectTrigger id="room-type">
                                <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(roomTypeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Choose the type of room to stage
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="style">Furniture Style</Label>
                        <Select
                            value={style}
                            onValueChange={(value) =>
                                setStyle(value as VirtualStagingParams["style"])
                            }
                            disabled={isProcessing}
                        >
                            <SelectTrigger id="style">
                                <SelectValue placeholder="Select furniture style" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(styleLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Choose the aesthetic style for furniture and decor
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-prompt">
                            Custom Instructions (Optional)
                        </Label>
                        <Textarea
                            id="custom-prompt"
                            placeholder="E.g., 'Add a large sectional sofa, coffee table, and plants' or 'Include warm lighting and cozy textures'"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            disabled={isProcessing}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Add specific details about furniture, colors, or atmosphere you want
                        </p>
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
                        {isProcessing ? "Staging..." : "Generate Staging"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
