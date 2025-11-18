
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  className?: string;
};

/**
 * A reusable page header component.
 * Displays a title and a description to introduce a page.
 * @param {PageHeaderProps} props - The props for the component.
 */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
        {title}
      </h1>
      <p className="text-lg text-muted-foreground">{description}</p>
    </div>
  );
}
