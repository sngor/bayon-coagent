import * as React from "react"
import { cn } from "@/lib/utils/common"

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    description?: string
    container?: boolean
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
    ({ className, title, description, container = false, children, ...props }, ref) => {
        return (
            <section
                ref={ref}
                className={cn(
                    "py-6 md:py-8",
                    container && "container mx-auto px-4 md:px-6",
                    className
                )}
                {...props}
            >
                {(title || description) && (
                    <div className="mb-6 space-y-1">
                        {title && (
                            <h2 className="text-xl font-semibold tracking-tight text-foreground font-headline">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </section>
        )
    }
)
Section.displayName = "Section"

export { Section }
