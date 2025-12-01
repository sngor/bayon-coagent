"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Testimonial } from "@/lib/types/common";
import { generateSocialProofAction } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Instagram, Facebook, Linkedin, Check, Copy, Sparkles, Image as ImageIcon } from "lucide-react";

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

interface SocialProofGeneratorProps {
    testimonials: Testimonial[];
    agentName: string;
}

type SocialFormat = "instagram" | "facebook" | "linkedin";

function SubmitButton({ disabled, isGenerating }: { disabled: boolean; isGenerating: boolean }) {
    const { pending } = useFormStatus();
    const isLoading = pending || isGenerating;

    return (
        <Button type="submit" disabled={disabled || isLoading} className="w-full sm:w-auto">
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Social Proof
                </>
            )}
        </Button>
    );
}

type FormState = {
    message: string;
    data: {
        content: string;
        hashtags: string[];
        imageSuggestions: string[];
        savedContentId?: string;
    } | null;
    errors: any;
};

export function SocialProofGenerator({ testimonials, agentName }: SocialProofGeneratorProps) {
    const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("instagram");
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
    const [savedContentId, setSavedContentId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const initialState: FormState = { message: "", data: null, errors: {} };
    const [state, formAction] = useFormState<FormState, FormData>(
        generateSocialProofAction as any,
        initialState
    );

    // Handle form submission result
    useEffect(() => {
        if (state.message === "success" && state.data) {
            setGeneratedContent(state.data.content);
            setHashtags(state.data.hashtags);
            setImageSuggestions(state.data.imageSuggestions || []);
            setSavedContentId(state.data.savedContentId || null);
            setIsGenerating(false);
        } else if (state.message && state.message !== "success") {
            setIsGenerating(false);
        }
    }, [state]);

    const toggleTestimonial = (testimonialId: string) => {
        setSelectedTestimonials((prev) =>
            prev.includes(testimonialId)
                ? prev.filter((id) => id !== testimonialId)
                : [...prev, testimonialId]
        );
    };

    const selectAll = () => {
        setSelectedTestimonials(testimonials.map((t) => t.id));
    };

    const clearSelection = () => {
        setSelectedTestimonials([]);
    };

    const copyToClipboard = async () => {
        const fullContent = `${generatedContent}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
        await navigator.clipboard.writeText(fullContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (formData: FormData) => {
        setIsGenerating(true);
        setGeneratedContent("");
        setHashtags([]);
        setImageSuggestions([]);
        setSavedContentId(null);
        formAction(formData);
    };

    const getFormatIcon = (format: SocialFormat) => {
        switch (format) {
            case "instagram":
                return <Instagram className="h-4 w-4" />;
            case "facebook":
                return <Facebook className="h-4 w-4" />;
            case "linkedin":
                return <Linkedin className="h-4 w-4" />;
        }
    };

    const getFormatColor = (format: SocialFormat) => {
        switch (format) {
            case "instagram":
                return "from-purple-500 to-pink-500";
            case "facebook":
                return "from-blue-600 to-blue-400";
            case "linkedin":
                return "from-blue-700 to-blue-500";
        }
    };

    return (
        <div className="space-y-6">
            <form action={handleSubmit}>
                <input type="hidden" name="testimonialIds" value={JSON.stringify(selectedTestimonials)} />
                <input type="hidden" name="format" value={selectedFormat} />
                <input type="hidden" name="agentName" value={agentName} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Selection */}
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Platform</CardTitle>
                                <CardDescription>
                                    Choose the social media platform for your post
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3">
                                    {(["instagram", "facebook", "linkedin"] as SocialFormat[]).map((format) => (
                                        <button
                                            key={format}
                                            type="button"
                                            onClick={() => setSelectedFormat(format)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                                                selectedFormat === format
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-gradient-to-br text-white",
                                                    getFormatColor(format)
                                                )}
                                            >
                                                {getFormatIcon(format)}
                                            </div>
                                            <span className="text-sm font-medium capitalize">{format}</span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Testimonial Selection */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Select Testimonials</CardTitle>
                                        <CardDescription>
                                            Choose one or more testimonials to include
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAll}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSelection}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {testimonials.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No testimonials available. Create some testimonials first.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {testimonials.map((testimonial) => (
                                            <div
                                                key={testimonial.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                                    selectedTestimonials.includes(testimonial.id)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() => toggleTestimonial(testimonial.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedTestimonials.includes(testimonial.id)}
                                                    onCheckedChange={() => toggleTestimonial(testimonial.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm">
                                                            {testimonial.clientName}
                                                        </p>
                                                        {testimonial.clientPhotoUrl && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <ImageIcon className="h-3 w-3 mr-1" />
                                                                Photo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {testimonial.testimonialText}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Error Display */}
                        {state.message && state.message !== "success" && (
                            <Card className="border-destructive">
                                <CardContent className="pt-6">
                                    <p className="text-sm text-destructive">{state.message}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Generate Button */}
                        <SubmitButton
                            disabled={selectedTestimonials.length === 0}
                            isGenerating={isGenerating}
                        />
                    </div>

                    {/* Right Column: Generated Content */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Content</CardTitle>
                                <CardDescription>
                                    Your AI-generated social proof post
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {generatedContent ? (
                                    <div className="space-y-4">
                                        {/* Content Preview */}
                                        <div className="relative">
                                            <Textarea
                                                value={generatedContent}
                                                readOnly
                                                className="min-h-[200px] resize-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={copyToClipboard}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Hashtags */}
                                        {hashtags.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Hashtags</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {hashtags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary">
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Image Suggestions */}
                                        {imageSuggestions.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Image Suggestions</h4>
                                                <ul className="space-y-2">
                                                    {imageSuggestions.map((suggestion, index) => (
                                                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <ImageIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>{suggestion}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Success Message */}
                                        {savedContentId && (
                                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <p className="text-sm text-green-800 dark:text-green-200">
                                                    ✓ Content saved to your Library
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            Select testimonials and click generate to create your social proof content
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
