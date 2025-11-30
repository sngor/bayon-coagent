/**
 * Breadcrumbs Usage Examples
 * 
 * This file demonstrates various ways to use the Breadcrumbs component
 * in the application. These examples can be used as reference when
 * implementing breadcrumbs in new pages.
 */

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageLayout } from "@/components/layouts/page-layout";

// Example 1: Simple two-level breadcrumb
export function SimpleBreadcrumbExample() {
    return (
        <Breadcrumbs
            items={[
                { label: "Home", href: "/" },
                { label: "Current Page" }
            ]}
        />
    );
}

// Example 2: Three-level breadcrumb with dashboard
export function DashboardBreadcrumbExample() {
    return (
        <Breadcrumbs
            items={[
                { label: "Home", href: "/" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "Marketing Plan" }
            ]}
        />
    );
}

// Example 3: Deep navigation breadcrumb
export function DeepNavigationExample() {
    return (
        <Breadcrumbs
            items={[
                { label: "Home", href: "/" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "Content Engine", href: "/content-engine" },
                { label: "Blog Posts", href: "/content-engine/blog-posts" },
                { label: "Edit Post" }
            ]}
        />
    );
}

// Example 4: Breadcrumbs with custom styling
export function StyledBreadcrumbExample() {
    return (
        <Breadcrumbs
            items={[
                { label: "Home", href: "/" },
                { label: "Settings" }
            ]}
            className="mb-6 px-4"
        />
    );
}

// Example 5: Integrated with PageLayout (Recommended)
export function PageLayoutWithBreadcrumbsExample() {
    return (
        <PageLayout
            header={{
                title: "Marketing Plan",
                description: "Create and manage your marketing strategy",
                breadcrumbs: [
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Marketing Plan" }
                ]
            }}
        >
            <div className="space-y-6">
                <p>Your page content goes here...</p>
            </div>
        </PageLayout>
    );
}

// Example 6: Dynamic breadcrumbs based on route
export function DynamicBreadcrumbExample({ reportId }: { reportId: string }) {
    return (
        <PageLayout
            header={{
                title: `Report #${reportId}`,
                breadcrumbs: [
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Research Agent", href: "/research-agent" },
                    { label: `Report #${reportId}` }
                ]
            }}
        >
            <div>Report content...</div>
        </PageLayout>
    );
}

// Example 7: Breadcrumbs for nested settings pages
export function SettingsBreadcrumbExample() {
    return (
        <Breadcrumbs
            items={[
                { label: "Home", href: "/" },
                { label: "Settings", href: "/settings" },
                { label: "Profile", href: "/settings/profile" },
                { label: "Edit Avatar" }
            ]}
        />
    );
}

// Example 8: Breadcrumbs for tool pages
export function ToolPageBreadcrumbExample() {
    return (
        <PageLayout
            header={{
                title: "Brand Audit",
                description: "Analyze your online presence and reputation",
                breadcrumbs: [
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Brand Audit" }
                ]
            }}
        >
            <div>Brand audit content...</div>
        </PageLayout>
    );
}

/**
 * Common Breadcrumb Patterns
 * 
 * 1. Dashboard Pages:
 *    Home → Dashboard → [Page Name]
 * 
 * 2. Tool Pages:
 *    Home → Dashboard → [Tool Name]
 * 
 * 3. Detail Pages:
 *    Home → Dashboard → [Tool Name] → [Item Name]
 * 
 * 4. Settings Pages:
 *    Home → Settings → [Section Name]
 * 
 * 5. Nested Content:
 *    Home → Dashboard → [Tool] → [Category] → [Item]
 */

/**
 * Best Practices
 * 
 * 1. Always include "Home" as the first item
 * 2. The last item should not have an href (it's the current page)
 * 3. Keep breadcrumb trails to 5 levels or less for usability
 * 4. Use clear, concise labels
 * 5. Match breadcrumb labels to page titles when possible
 * 6. Use the PageLayout component for consistent integration
 */

/**
 * Accessibility Notes
 * 
 * - The component automatically handles ARIA attributes
 * - Screen readers will announce "Breadcrumb navigation"
 * - Current page is marked with aria-current="page"
 * - Separator icons are hidden from screen readers
 * - All links are keyboard navigable
 */
