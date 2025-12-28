import * as React from "react";
import { cn } from "@/lib/utils/common";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Responsive Table Component
 * 
 * Provides two display modes:
 * 1. Scrollable table on mobile (default)
 * 2. Card-based layout on mobile (when mobileLayout="cards")
 * 
 * Requirements: 16.4, 21.4
 */

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Layout mode for mobile viewports
     * - "scroll": Horizontal scrolling table (default)
     * - "cards": Card-based layout
     */
    mobileLayout?: "scroll" | "cards";

    /**
     * Breakpoint at which to switch to mobile layout
     * @default "md" (768px)
     */
    breakpoint?: "sm" | "md" | "lg";

    /**
     * Show scroll indicator on mobile
     * @default true
     */
    showScrollIndicator?: boolean;
}

const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
    (
        {
            className,
            mobileLayout = "scroll",
            breakpoint = "md",
            showScrollIndicator = true,
            children,
            ...props
        },
        ref
    ) => {
        const [showLeftShadow, setShowLeftShadow] = React.useState(false);
        const [showRightShadow, setShowRightShadow] = React.useState(false);
        const scrollRef = React.useRef<HTMLDivElement>(null);

        const handleScroll = React.useCallback(() => {
            const element = scrollRef.current;
            if (!element) return;

            const { scrollLeft, scrollWidth, clientWidth } = element;
            setShowLeftShadow(scrollLeft > 0);
            setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
        }, []);

        React.useEffect(() => {
            const element = scrollRef.current;
            if (!element || mobileLayout !== "scroll") return;

            handleScroll();
            element.addEventListener("scroll", handleScroll);
            window.addEventListener("resize", handleScroll);

            return () => {
                element.removeEventListener("scroll", handleScroll);
                window.removeEventListener("resize", handleScroll);
            };
        }, [handleScroll, mobileLayout]);

        const breakpointClass = {
            sm: "sm",
            md: "md",
            lg: "lg",
        }[breakpoint];

        if (mobileLayout === "scroll") {
            return (
                <div
                    ref={ref}
                    className={cn("relative w-full", className)}
                    {...props}
                >
                    {/* Scroll shadows */}
                    {showScrollIndicator && (
                        <>
                            <div
                                className={cn(
                                    "absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10 transition-opacity duration-200",
                                    "bg-gradient-to-r from-background to-transparent",
                                    showLeftShadow ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <div
                                className={cn(
                                    "absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10 transition-opacity duration-200",
                                    "bg-gradient-to-l from-background to-transparent",
                                    showRightShadow ? "opacity-100" : "opacity-0"
                                )}
                            />
                        </>
                    )}

                    <div
                        ref={scrollRef}
                        className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                    >
                        <div className="min-w-full inline-block align-middle">
                            {children}
                        </div>
                    </div>

                    {/* Scroll hint for mobile */}
                    {showScrollIndicator && showRightShadow && (
                        <div className={cn(
                            `${breakpointClass}:hidden`,
                            "absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border animate-pulse"
                        )}>
                            Scroll →
                        </div>
                    )}
                </div>
            );
        }

        // For card layout, we need to extract table data
        // This is handled by the parent component using ResponsiveTableCards
        return (
            <div ref={ref} className={cn("w-full", className)} {...props}>
                {children}
            </div>
        );
    }
);
ResponsiveTable.displayName = "ResponsiveTable";

/**
 * Card-based table layout for mobile
 * Use this component to render table data as cards on mobile viewports
 */
interface ResponsiveTableCardsProps<T> {
    data: T[];
    columns: {
        key: keyof T;
        label: string;
        render?: (value: T[keyof T], item: T) => React.ReactNode;
    }[];
    keyExtractor: (item: T) => string | number;
    breakpoint?: "sm" | "md" | "lg";
    cardClassName?: string;
    onCardClick?: (item: T) => void;
}

function ResponsiveTableCards<T>({
    data,
    columns,
    keyExtractor,
    breakpoint = "md",
    cardClassName,
    onCardClick,
}: ResponsiveTableCardsProps<T>) {
    const breakpointClass = {
        sm: "sm",
        md: "md",
        lg: "lg",
    }[breakpoint];

    return (
        <>
            {/* Card layout for mobile */}
            <div className={cn(`${breakpointClass}:hidden`, "space-y-4")}>
                {data.map((item) => (
                    <Card
                        key={keyExtractor(item)}
                        className={cn(
                            "transition-all duration-200",
                            onCardClick && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
                            cardClassName
                        )}
                        onClick={() => onCardClick?.(item)}
                    >
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {columns.map((column) => (
                                    <div key={String(column.key)} className="flex justify-between items-start gap-4">
                                        <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                                            {column.label}
                                        </span>
                                        <span className="text-sm font-semibold text-right flex-1">
                                            {column.render
                                                ? column.render(item[column.key], item)
                                                : String(item[column.key])}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table layout for desktop */}
            <div className={cn(`hidden ${breakpointClass}:block`)}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={String(column.key)}>{column.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow
                                key={keyExtractor(item)}
                                className={cn(
                                    onCardClick && "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => onCardClick?.(item)}
                            >
                                {columns.map((column) => (
                                    <TableCell key={String(column.key)}>
                                        {column.render
                                            ? column.render(item[column.key], item)
                                            : String(item[column.key])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

/**
 * Wrapper component that combines ResponsiveTable with proper styling
 */
const ResponsiveTableWrapper = React.forwardRef<
    HTMLDivElement,
    ResponsiveTableProps
>(({ className, children, ...props }, ref) => {
    return (
        <ResponsiveTable
            ref={ref}
            className={cn("border rounded-lg overflow-hidden", className)}
            {...props}
        >
            {children}
        </ResponsiveTable>
    );
});
ResponsiveTableWrapper.displayName = "ResponsiveTableWrapper";

export {
    ResponsiveTable,
    ResponsiveTableCards,
    ResponsiveTableWrapper,
    type ResponsiveTableProps,
    type ResponsiveTableCardsProps,
};
