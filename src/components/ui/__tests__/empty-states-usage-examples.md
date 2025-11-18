# Empty States Usage Examples

This document provides practical examples of how to integrate the empty state components into various pages of the application.

## Dashboard Page - No Marketing Plan

```tsx
import { NoDataEmptyState } from "@/components/ui/empty-states";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardMarketingPlanSection() {
  const router = useRouter();
  const hasMarketingPlan = false; // Check if user has a plan

  if (!hasMarketingPlan) {
    return (
      <NoDataEmptyState
        icon={<ClipboardList className="w-8 h-8 text-primary" />}
        title="No marketing plan yet"
        description="Create your first AI-powered marketing plan to start growing your real estate business with targeted strategies."
        action={{
          label: "Generate Marketing Plan",
          onClick: () => router.push("/marketing-plan"),
          variant: "ai",
        }}
      />
    );
  }

  return <MarketingPlanContent />;
}
```

## Brand Audit Page - No Audit Run

```tsx
import { FirstTimeUseEmptyState } from "@/components/ui/empty-states";
import { Search } from "lucide-react";

export function BrandAuditPage() {
  const [hasAudit, setHasAudit] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = async () => {
    setIsRunning(true);
    // Run audit logic
    await runBrandAudit();
    setHasAudit(true);
    setIsRunning(false);
  };

  if (!hasAudit && !isRunning) {
    return (
      <FirstTimeUseEmptyState
        icon={<Search className="w-8 h-8 text-primary" />}
        title="Discover Your Online Presence"
        description="Run a comprehensive brand audit to analyze your NAP consistency, review distribution, and online reputation across major platforms."
        action={{
          label: "Run Brand Audit",
          onClick: handleRunAudit,
          variant: "ai",
        }}
        secondaryAction={{
          label: "Learn More",
          onClick: () => window.open("/docs/brand-audit", "_blank"),
        }}
      />
    );
  }

  if (isRunning) {
    return <AILoader message="Analyzing your brand presence..." />;
  }

  return <BrandAuditResults />;
}
```

## Content Engine - No Content History

```tsx
import { EmptyState } from "@/components/ui/empty-states";
import { FileText } from "lucide-react";

export function ContentHistorySection() {
  const contentHistory = []; // Fetch from database

  if (contentHistory.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-8 h-8 text-primary" />}
        title="No content generated yet"
        description="Your generated content will appear here. Start creating blog posts, social media content, or video scripts to build your content library."
        action={{
          label: "Create Content",
          onClick: () => scrollToContentForm(),
        }}
      />
    );
  }

  return <ContentHistoryList items={contentHistory} />;
}
```

## Search Results - No Matches

```tsx
import { NoResultsEmptyState } from "@/components/ui/empty-states";
import { Search } from "lucide-react";

export function SearchResults({ query, results }: SearchResultsProps) {
  if (results.length === 0 && query) {
    return (
      <NoResultsEmptyState
        icon={<Search className="w-8 h-8 text-muted-foreground" />}
        searchTerm={query}
        onClearSearch={() => setQuery("")}
      />
    );
  }

  return <ResultsList results={results} />;
}
```

## Knowledge Base - No Reports

```tsx
import { FirstTimeUseEmptyState } from "@/components/ui/empty-states";
import { BookOpen } from "lucide-react";

export function KnowledgeBasePage() {
  const reports = useReports();

  if (reports.length === 0) {
    return (
      <FirstTimeUseEmptyState
        icon={<BookOpen className="w-8 h-8 text-primary" />}
        title="Build Your Knowledge Base"
        description="Create research reports, market analyses, and property insights to build a comprehensive knowledge base for your real estate business."
        action={{
          label: "Create First Report",
          onClick: () => router.push("/research-agent"),
          variant: "ai",
        }}
        secondaryAction={{
          label: "Import Existing Reports",
          onClick: () => setShowImportDialog(true),
        }}
      />
    );
  }

  return <ReportsList reports={reports} />;
}
```

## Projects Page - No Projects

```tsx
import { NoDataEmptyState } from "@/components/ui/empty-states";
import { FolderPlus } from "lucide-react";

export function ProjectsPage() {
  const projects = useProjects();

  if (projects.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <NoDataEmptyState
          icon={<FolderPlus className="w-8 h-8 text-primary" />}
          title="No projects yet"
          description="Organize your marketing campaigns, listings, and content into projects for better management and collaboration."
          action={{
            label: "Create Project",
            onClick: () => setShowCreateDialog(true),
          }}
        />
      </div>
    );
  }

  return <ProjectsGrid projects={projects} />;
}
```

## Integrations Page - No Integrations

```tsx
import { EmptyState } from "@/components/ui/empty-states";
import { Plug } from "lucide-react";

export function IntegrationsPage() {
  const activeIntegrations = useIntegrations();

  if (activeIntegrations.length === 0) {
    return (
      <EmptyState
        icon={<Plug className="w-8 h-8 text-primary" />}
        title="No integrations connected"
        description="Connect your favorite tools and platforms to streamline your workflow. Integrate with Google My Business, social media platforms, and more."
        action={{
          label: "Browse Integrations",
          onClick: () => scrollToIntegrationsList(),
        }}
      />
    );
  }

  return <IntegrationsList integrations={activeIntegrations} />;
}
```

## Filtered List - No Results

```tsx
import { NoResultsEmptyState } from "@/components/ui/empty-states";
import { Filter } from "lucide-react";

export function FilteredContentList({ filters, items }: FilteredListProps) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (items.length === 0 && hasActiveFilters) {
    return (
      <NoResultsEmptyState
        icon={<Filter className="w-8 h-8 text-muted-foreground" />}
        onClearSearch={() => clearAllFilters()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <NoDataEmptyState
        icon={<FileText className="w-8 h-8 text-primary" />}
        title="No items found"
        description="Start by creating your first item."
        action={{
          label: "Create Item",
          onClick: handleCreate,
        }}
      />
    );
  }

  return <ItemsList items={items} />;
}
```

## Responsive Usage

The empty states are fully responsive and work well on all screen sizes:

```tsx
// Mobile-optimized empty state
<EmptyState
  variant="subtle"
  icon={<Icon className="w-6 h-6 text-primary" />}
  title="Short Title"
  description="Concise description for mobile."
  action={{
    label: "Action",
    onClick: handleAction,
  }}
  className="py-6" // Reduced padding for mobile
/>
```

## With Loading States

Combine with loading states for complete user feedback:

```tsx
export function DataSection() {
  const { data, isLoading, error } = useData();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-8 h-8 text-destructive" />}
        title="Failed to load data"
        description={error.message}
        action={{
          label: "Try Again",
          onClick: refetch,
        }}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <NoDataEmptyState
        icon={<FileText className="w-8 h-8 text-primary" />}
        action={{
          label: "Create Item",
          onClick: handleCreate,
        }}
      />
    );
  }

  return <DataDisplay data={data} />;
}
```

## Best Practices

1. **Choose the right variant**:

   - Use `NoDataEmptyState` for features with no data
   - Use `NoResultsEmptyState` for search/filter results
   - Use `FirstTimeUseEmptyState` for onboarding and first-time use

2. **Provide clear actions**:

   - Always include an action button when possible
   - Use descriptive button labels ("Generate Plan" vs "Click Here")
   - Use appropriate button variants (ai, default, outline)

3. **Write helpful descriptions**:

   - Explain what the feature does
   - Guide users on what to do next
   - Keep it concise but informative

4. **Use appropriate icons**:

   - Choose icons that represent the feature
   - Use consistent icon sizes (w-8 h-8 for default)
   - Apply appropriate colors (text-primary, text-muted-foreground)

5. **Consider context**:
   - Use prominent variant for important first-time experiences
   - Use subtle variant for inline or secondary empty states
   - Adjust padding for different layouts
