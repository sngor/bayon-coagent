import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  className?: string;
  actions?: React.ReactNode;
};

/**
 * A reusable page header component.
 * Displays a title and a description to introduce a page.
 * @param {PageHeaderProps} props - The props for the component.
 */
export function PageHeader({ title, description, className, actions }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="space-y-2">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
