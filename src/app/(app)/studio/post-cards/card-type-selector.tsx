import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/common";
import { Gift, Home, BadgeCheck, DoorOpen, TrendingUp, Heart } from "lucide-react";

export const CARD_TYPES = [
    { id: 'Holiday Card', label: 'Holiday', icon: Gift, description: 'Seasonal greetings' },
    { id: 'Just Listed', label: 'Just Listed', icon: Home, description: 'New property alert' },
    { id: 'Just Sold', label: 'Just Sold', icon: BadgeCheck, description: 'Success stories' },
    { id: 'Open House', label: 'Open House', icon: DoorOpen, description: 'Event invitations' },
    { id: 'Market Update', label: 'Market Update', icon: TrendingUp, description: 'Stats & trends' },
    { id: 'Client Appreciation', label: 'Thank You', icon: Heart, description: 'Build relationships' },
] as const;

interface CardTypeSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function CardTypeSelector({ value, onChange }: CardTypeSelectorProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CARD_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = value === type.id;
                return (
                    <Card
                        key={type.id}
                        className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                            isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-transparent hover:border-primary/50 bg-muted/50"
                        )}
                        onClick={() => onChange(type.id)}
                    >
                        <div className="p-4 flex flex-col items-center text-center space-y-2">
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium text-sm leading-none mb-1">{type.label}</div>
                                <div className="text-[10px] text-muted-foreground">{type.description}</div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
