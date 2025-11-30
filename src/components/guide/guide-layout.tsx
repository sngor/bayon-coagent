import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/utils/common"

interface GuideLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
}

export function GuideLayout({
    title,
    description,
    children,
    className,
    ...props
}: GuideLayoutProps) {
    return (
        <div className={cn("container mx-auto py-6 space-y-8", className)} {...props}>
            <PageHeader title={title} description={description} />
            <div className="space-y-8">
                {children}
            </div>
        </div>
    )
}
