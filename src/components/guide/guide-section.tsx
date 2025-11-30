import * as React from "react"
import { Section } from "@/components/ui/section"

interface GuideSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
}

export function GuideSection({
    title,
    description,
    children,
    ...props
}: GuideSectionProps) {
    return (
        <Section title={title} description={description} {...props}>
            {children}
        </Section>
    )
}
