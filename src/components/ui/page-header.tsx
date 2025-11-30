import * as React from "react"
import { cn } from "@/lib/utils/common"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: React.ElementType
  breadcrumbs?: React.ReactNode | { label: string; href?: string }[]
  variant?: 'default' | 'hub' | 'compact'
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, icon: Icon, breadcrumbs, variant = 'default', ...props }, ref) => {
    const renderBreadcrumbs = () => {
      if (!breadcrumbs) return null;
      if (React.isValidElement(breadcrumbs)) return breadcrumbs;
      if (Array.isArray(breadcrumbs)) {
        return (
          <nav className="flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-2">/</span>}
                {item.href ? (
                  <a href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        );
      }
      return null;
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-4 pb-4", className)}
        {...props}
      >
        {breadcrumbs && (
          <div className="mb-2">
            {renderBreadcrumbs()}
          </div>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="p-2 bg-primary/10 rounded-lg mt-1">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="space-y-1.5">
              <h1 className={cn(
                "font-bold tracking-tight text-foreground font-headline",
                variant === 'compact' ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              )}>
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader }