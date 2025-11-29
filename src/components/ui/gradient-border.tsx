import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/common";

const gradientBorderVariants = cva(
    "relative overflow-hidden transition-all duration-300",
    {
        variants: {
            variant: {
                default: "gradient-border-default",
                primary: "gradient-border-primary",
                accent: "gradient-border-accent",
                success: "gradient-border-success",
                animated: "gradient-border-animated",
            },
            borderWidth: {
                thin: "gradient-border-thin",
                medium: "gradient-border-medium",
                thick: "gradient-border-thick",
            },
            glow: {
                none: "",
                sm: "glow-effect-sm",
                md: "glow-effect-md",
                lg: "glow-effect-lg",
            },
            rounded: {
                none: "rounded-none",
                sm: "rounded-sm",
                md: "rounded-md",
                lg: "rounded-lg",
                xl: "rounded-xl",
                "2xl": "rounded-2xl",
                full: "rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            borderWidth: "medium",
            glow: "none",
            rounded: "lg",
        },
    }
);

export interface GradientBorderProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientBorderVariants> {
    children: React.ReactNode;
    animate?: boolean;
}

/**
 * GradientBorder component - Creates a container with animated gradient borders
 * 
 * @example
 * ```tsx
 * <GradientBorder variant="primary" glow="md">
 *   <div className="p-6">Content here</div>
 * </GradientBorder>
 * ```
 */
const GradientBorder = React.forwardRef<HTMLDivElement, GradientBorderProps>(
    (
        {
            className,
            variant,
            borderWidth,
            glow,
            rounded,
            animate = false,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    gradientBorderVariants({ variant, borderWidth, glow, rounded }),
                    animate && "gradient-border-animate",
                    className
                )}
                {...props}
            >
                <div className="relative z-10 h-full w-full bg-background rounded-[inherit]">
                    {children}
                </div>
            </div>
        );
    }
);

GradientBorder.displayName = "GradientBorder";

export { GradientBorder, gradientBorderVariants };
