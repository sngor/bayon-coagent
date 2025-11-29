import * as React from "react"
import { cn } from "@/lib/utils/common"

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'base' | 'elevated' | 'floating' | 'modal' | 'premium'
    interactive?: boolean
    padding?: 'sm' | 'md' | 'lg' | 'xl'
    border?: 'subtle' | 'default' | 'strong' | 'accent' | 'success' | 'warning' | 'error'
    gradient?: 'primary' | 'success' | 'warning' | 'error'
    glass?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    ({
        className,
        variant = 'base',
        interactive = false,
        padding = 'md',
        border,
        gradient,
        glass = false,
        ...props
    }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // Base container styles
                    !glass && variant === 'base' && "container-base",
                    !glass && variant === 'elevated' && "container-elevated",
                    !glass && variant === 'floating' && "container-floating",
                    !glass && variant === 'modal' && "container-modal",
                    !glass && variant === 'premium' && "container-premium",

                    // Glass variants
                    glass && variant === 'base' && "container-glass",
                    glass && variant === 'elevated' && "container-glass-elevated",
                    glass && (variant === 'floating' || variant === 'modal' || variant === 'premium') && "container-glass-elevated",

                    // Interactive behavior
                    interactive && !glass && variant === 'base' && "container-interactive",
                    interactive && !glass && variant === 'elevated' && "container-interactive-elevated",
                    interactive && !glass && (variant === 'floating' || variant === 'modal' || variant === 'premium') && "container-interactive-floating",

                    // Padding variants
                    padding === 'sm' && "container-padding-sm",
                    padding === 'md' && "container-padding-md",
                    padding === 'lg' && "container-padding-lg",
                    padding === 'xl' && "container-padding-xl",

                    // Border variants
                    border === 'subtle' && "container-border-subtle",
                    border === 'default' && "container-border-default",
                    border === 'strong' && "container-border-strong",
                    border === 'accent' && "container-border-accent",
                    border === 'success' && "container-border-success",
                    border === 'warning' && "container-border-warning",
                    border === 'error' && "container-border-error",

                    // Gradient variants
                    gradient === 'primary' && "container-gradient-primary",
                    gradient === 'success' && "container-gradient-success",
                    gradient === 'warning' && "container-gradient-warning",
                    gradient === 'error' && "container-gradient-error",

                    className
                )}
                {...props}
            />
        )
    }
)
Container.displayName = "Container"

// Specialized container components
const MetricContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-metric", className)}
            {...props}
        />
    )
)
MetricContainer.displayName = "MetricContainer"

const NotificationContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-notification", className)}
            {...props}
        />
    )
)
NotificationContainer.displayName = "NotificationContainer"

const FeatureContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-feature", className)}
            {...props}
        />
    )
)
FeatureContainer.displayName = "FeatureContainer"

const SectionContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-section", className)}
            {...props}
        />
    )
)
SectionContainer.displayName = "SectionContainer"

// Status containers
const SuccessContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant' | 'gradient'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-success", className)}
            {...props}
        />
    )
)
SuccessContainer.displayName = "SuccessContainer"

const WarningContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant' | 'gradient'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-warning", className)}
            {...props}
        />
    )
)
WarningContainer.displayName = "WarningContainer"

const ErrorContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant' | 'gradient'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-error", className)}
            {...props}
        />
    )
)
ErrorContainer.displayName = "ErrorContainer"

const InfoContainer = React.forwardRef<HTMLDivElement, Omit<ContainerProps, 'variant' | 'gradient'>>(
    ({ className, ...props }, ref) => (
        <Container
            ref={ref}
            className={cn("container-info", className)}
            {...props}
        />
    )
)
InfoContainer.displayName = "InfoContainer"

export {
    Container,
    MetricContainer,
    NotificationContainer,
    FeatureContainer,
    SectionContainer,
    SuccessContainer,
    WarningContainer,
    ErrorContainer,
    InfoContainer
}