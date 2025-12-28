import * as React from "react"
import { cn } from "@/lib/utils/common"

export interface BorderedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Padding size for the container
     */
    padding?: 'sm' | 'md' | 'lg' | 'xl'
    /**
     * Border style - uses black border when no shadow is present
     */
    borderStyle?: 'thin' | 'medium' | 'thick'
    /**
     * Whether the container should be interactive
     */
    interactive?: boolean
}

/**
 * A container component that follows the rule: "if border doesn't have shadow, use black color"
 * This component specifically creates borders without shadows, using black borders as specified.
 */
const BorderedContainer = React.forwardRef<HTMLDivElement, BorderedContainerProps>(
    ({
        className,
        padding = 'md',
        borderStyle = 'thin',
        interactive = false,
        children,
        ...props
    }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // Base styling with black border (no shadow)
                    "rounded-lg bg-card text-card-foreground border-solid-black",

                    // Padding variants
                    padding === 'sm' && "p-3",
                    padding === 'md' && "p-4 sm:p-6",
                    padding === 'lg' && "p-6 sm:p-8",
                    padding === 'xl' && "p-8 sm:p-10",

                    // Border thickness
                    borderStyle === 'thin' && "border",
                    borderStyle === 'medium' && "border-2",
                    borderStyle === 'thick' && "border-4",

                    // Interactive behavior (adds shadow on hover, so border color changes)
                    interactive && "cursor-pointer transition-all duration-300 hover:shadow-md hover:border-border hover:scale-[1.01]",

                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
BorderedContainer.displayName = "BorderedContainer"

export { BorderedContainer }