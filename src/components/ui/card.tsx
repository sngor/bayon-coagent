
import * as React from "react"

import { cn } from "@/lib/utils/common"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    variant?: 'base' | 'elevated' | 'floating' | 'modal' | 'premium' | 'bordered';
  }
>(({ className, interactive, variant = 'base', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base container styling
      variant === 'base' && "container-base",
      variant === 'elevated' && "container-elevated",
      variant === 'floating' && "container-floating",
      variant === 'modal' && "container-modal",
      variant === 'premium' && "container-premium",
      variant === 'bordered' && "container-no-shadow",
      // Interactive behavior
      interactive && "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-300",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-headline text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 sm:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
