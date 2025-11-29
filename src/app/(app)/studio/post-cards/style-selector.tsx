import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STYLE_PRESETS = [
    "Modern Minimalist",
    "Luxury Real Estate",
    "Warm & Cozy",
    "Professional Corporate",
    "Watercolor Artistic",
    "Bold & Geometric"
];

interface StyleSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((style) => (
                <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(style)}
                    className={cn(
                        "transition-all",
                        value === style
                            ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {style}
                </Button>
            ))}
        </div>
    );
}
