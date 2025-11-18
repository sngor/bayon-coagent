import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "./card";

const enhancedCardVariants = cva(
    "rounded-xl transition-all duration-300",
    {
        variants: {
            variant: {
                default: "bg-card border shadow-sm",
                elevated: "bg-card shadow-lg hover:shadow-xl",
                bordered: "bg-card border-2 border-primary/20",
                glass: "bg-card/80 backdrop-blur-sm border shadow-lg",
                gradient:
                    "bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20",
            },
            interactive: {
                true: "cursor-pointer hover:scale-[1.02] hover:shadow-xl",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            interactive: false,
        },
    }
);

export interface EnhancedCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
    loading?: boolean;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
    ({ className, variant, interactive, loading, children, ...props }, ref) => {
        if (loading) {
            return (
                <Card
                    ref={ref}
                    className={cn(
                        enhancedCardVariants({ variant, interactive: false }),
                        "animate-pulse",
                        className
                    )}
                    {...props}
                >
                    <CardHeader>
                        <div className="h-6 w-3/4 bg-muted rounded" />
                        <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded w-5/6" />
                            <div className="h-4 bg-muted rounded w-4/6" />
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card
                ref={ref}
                className={cn(
                    enhancedCardVariants({ variant, interactive }),
                    className
                )}
                {...props}
            >
                {children}
            </Card>
        );
    }
);

EnhancedCard.displayName = "EnhancedCard";

export {
    EnhancedCard,
    enhancedCardVariants,
    CardHeader as EnhancedCardHeader,
    CardTitle as EnhancedCardTitle,
    CardDescription as EnhancedCardDescription,
    CardContent as EnhancedCardContent,
    CardFooter as EnhancedCardFooter,
};
