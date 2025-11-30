
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils/common"

const buttonVariants = cva(
  // Mobile-optimized: touch-manipulation for better touch response, min-h-[44px] for touch targets
  // Enhanced micro-interactions: relative overflow-hidden for ripple effect, improved active state with inset shadow
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background relative overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] touch-manipulation [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
        link: "text-primary underline-offset-4 hover:underline min-h-[44px] active:shadow-none",
        ai: "ai-gradient shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        shimmer: "shimmer-gradient shadow-lg hover:scale-105 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        success: "bg-success text-success-foreground hover:bg-success-hover shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        premium: "bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-primary-foreground shadow-lg hover:shadow-2xl hover:scale-[1.02] button-glow active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        glow: "bg-primary text-primary-foreground shadow-lg hover:shadow-2xl hover:scale-[1.02] button-glow active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        "glow-success": "bg-success text-success-foreground shadow-lg hover:shadow-2xl hover:scale-[1.02] button-glow-success active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        "gradient-border": "bg-background text-foreground gradient-border gradient-border-animated hover:scale-[1.02] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[40px] rounded-md px-3 text-xs",
        lg: "min-h-[48px] rounded-lg px-8 text-base",
        xl: "min-h-[52px] rounded-lg px-10 text-lg",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      setRipples((prev) => [...prev, { x, y, id }])

      // Remove ripple after animation (improved timing: 600ms → 500ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
      }, 500)

      onClick?.(e)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={asChild ? onClick : handleClick}
        disabled={props.disabled || loading}
        {...props}
      >
        {asChild ? (
          props.children
        ) : (
          <>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {props.children}
            {!loading && ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: 0,
                  height: 0,
                }}
              />
            ))}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
