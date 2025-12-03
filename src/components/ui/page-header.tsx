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

    // Hub variant uses larger, more prominent styling
    const isHub = variant === 'hub';
    const isCompact = variant === 'compact';

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4",
          isHub ? "pb-0" : "pb-4",
          className
        )}
        {...props}
      >
        {breadcrumbs && (
          <div className="mb-2">
            {renderBreadcrumbs()}
          </div>
        )}
        <div className={cn(
          "flex gap-4",
          isHub ? "items-start justify-between" : "flex-col md:flex-row md:items-center md:justify-between"
        )}>
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {Icon && (
              <div className={cn(
                "flex-shrink-0 mt-1",
                isHub ? "" : "p-2 bg-primary/10 rounded-lg"
              )} aria-hidden="true">
                <Icon className={cn(
                  "text-primary",
                  isHub ? "h-8 w-8" : isCompact ? "w-5 h-5" : "w-6 h-6"
                )} />
              </div>
            )}
            <div className={cn("min-w-0 flex-1", isHub ? "" : "space-y-1.5")}>
              <h1 className={cn(
                "font-bold tracking-tight text-foreground font-headline",
                isHub ? "text-3xl md:text-4xl" : isCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              )}>
                {title}
              </h1>
              {description && (
                <p className={cn(
                  "text-muted-foreground",
                  isHub ? "mt-2 text-lg" : "text-sm sm:text-base"
                )}>
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className={cn(
              "flex-shrink-0",
              isHub ? "" : "flex items-center gap-2"
            )} role="group" aria-label="Page actions">
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