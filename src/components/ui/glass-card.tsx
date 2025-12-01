import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/common"

const glassCardVariants = cva(
    "rounded-2xl p-6 transition-all duration-300 relative overflow-hidden",
    {
        variants: {
            blur: {
                sm: "backdrop-blur-sm",
                md: "backdrop-blur-md",
                lg: "backdrop-blur-lg",
                xl: "backdrop-blur-xl",
            },
            tint: {
                light: "bg-background/60",
                dark: "bg-background/80",
                primary: "bg-primary/5",
                glass: "bg-[hsl(var(--glass-bg))]",
            },
            border: {
                true: "border border-[hsl(var(--glass-border))]",
                false: "border-0",
            },
            glow: {
                true: "shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
                false: "shadow-lg",
            },
            interactive: {
                true: "hover:scale-[1.02] hover:-translate-y-1 cursor-pointer hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.47)]",
                false: "",
            },
        },
        defaultVariants: {
            blur: "md",
            tint: "glass",
            border: true,
            glow: false,
            interactive: false,
        },
    }
)

export interface GlassCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
    gradientBorder?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    (
        {
            className,
            blur,
            tint,
            border,
            glow,
            interactive,
            gradientBorder,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    glassCardVariants({ blur, tint, border, glow, interactive }),
                    gradientBorder && "gradient-border",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 mb-4", className)}
        {...props}
    />
))
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
))
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center mt-4 pt-4 border-t border-white/10", className)}
        {...props}
    />
))
GlassCardFooter.displayName = "GlassCardFooter"

export {
    GlassCard,
    GlassCardHeader,
    GlassCardFooter,
    GlassCardTitle,
    GlassCardDescription,
    GlassCardContent,
}
