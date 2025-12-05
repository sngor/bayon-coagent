# Component Usage Examples

Comprehensive examples demonstrating how to use components from the Bayon Coagent design system in real-world scenarios.

## Table of Contents

- [Page Layouts](#page-layouts)
- [Forms](#forms)
- [Data Display](#data-display)
- [Loading States](#loading-states)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Common Patterns](#common-patterns)

---

## Page Layouts

### Standard Page

A typical page with header, sections, and content.

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function StandardPage() {
  return (
    <ContentWrapper maxWidth="default">
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="My Page"
          description="This is a standard page layout"
          icon={Home}
          actions={
            <div className="flex gap-2">
              <Button variant="outline">Secondary</Button>
              <Button>Primary Action</Button>
            </div>
          }
          variant="default"
        />

        {/* Main Content Section */}
        <SectionContainer
          title="Main Content"
          description="Primary content area"
          headerAction={<Button variant="ghost">View All</Button>}
          variant="elevated"
        >
          <GridLayout columns={3} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Card 1</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Card 2</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Card 3</CardTitle>
              </CardHeader>
              <CardContent>Content here</CardContent>
            </Card>
          </GridLayout>
        </SectionContainer>

        {/* Secondary Section */}
        <SectionContainer title="Additional Information" variant="bordered">
          <p className="text-muted-foreground">Additional content goes here</p>
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

### Hub Page

A hub page with larger header and multiple sections.

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HubPage() {
  return (
    <ContentWrapper maxWidth="wide">
      <div className="space-y-8">
        {/* Hub Header */}
        <PageHeader
          title="Content Studio"
          description="Create AI-powered content for your real estate business"
          icon={Wand2}
          actions={
            <div className="flex gap-2">
              <Button variant="outline">Templates</Button>
              <Button>New Content</Button>
            </div>
          }
          variant="hub"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Studio" }]}
        />

        {/* Quick Actions */}
        <GridLayout columns={4} gap="md">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Blog Post</h3>
              <p className="text-sm text-muted-foreground">Write a blog post</p>
            </CardContent>
          </Card>
          {/* More quick action cards... */}
        </GridLayout>

        {/* Recent Content */}
        <SectionContainer
          title="Recent Content"
          description="Your recently created content"
          headerAction={<Button variant="ghost">View All</Button>}
          variant="elevated"
        >
          {/* Content list */}
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

### Dashboard Layout

A dashboard with metrics and data visualizations.

```tsx
import {
  ContentWrapper,
  PageHeader,
  GridLayout,
  SectionContainer,
} from "@/components/layouts";
import { BarChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <ContentWrapper maxWidth="wide">
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your activity"
          icon={BarChart}
          variant="default"
        />

        {/* Metric Cards */}
        <GridLayout columns={4} gap="md">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          {/* More metric cards... */}
        </GridLayout>

        {/* Charts */}
        <GridLayout columns={2} gap="lg">
          <SectionContainer title="Activity Over Time" variant="elevated">
            {/* Chart component */}
          </SectionContainer>
          <SectionContainer title="Content by Type" variant="elevated">
            {/* Chart component */}
          </SectionContainer>
        </GridLayout>

        {/* Recent Activity */}
        <SectionContainer
          title="Recent Activity"
          headerAction={<Button variant="ghost">View All</Button>}
          variant="elevated"
        >
          {/* Activity list */}
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

---

## Forms

### Simple Form

A basic form with validation and submission.

```tsx
"use client";

import { useState } from "react";
import { StandardFormField, FormActions } from "@/components/standard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionContainer } from "@/components/layouts";

export default function SimpleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit form data
      await submitData();
    } catch (error) {
      setErrors({ general: "Failed to submit form" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form or navigate away
  };

  return (
    <SectionContainer title="Contact Form" variant="elevated">
      <form onSubmit={handleSubmit} className="space-y-6">
        <StandardFormField label="Name" id="name" error={errors.name} required>
          <Input id="name" placeholder="Enter your name" />
        </StandardFormField>

        <StandardFormField
          label="Email"
          id="email"
          error={errors.email}
          helpText="We'll never share your email"
          required
        >
          <Input type="email" id="email" placeholder="you@example.com" />
        </StandardFormField>

        <StandardFormField
          label="Message"
          id="message"
          error={errors.message}
          required
        >
          <Textarea id="message" placeholder="Your message" rows={4} />
        </StandardFormField>

        <FormActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="Send Message"
          isSubmitting={isSubmitting}
          submitLoadingText="Sending..."
        />
      </form>
    </SectionContainer>
  );
}
```

### Multi-Step Form

A form with multiple steps and navigation.

```tsx
"use client";

import { useState } from "react";
import {
  StandardFormField,
  BackButton,
  NextButton,
  SubmitButton,
} from "@/components/standard";
import { Input } from "@/components/ui/input";
import { SectionContainer } from "@/components/layouts";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Submit form
    setIsSubmitting(false);
  };

  return (
    <SectionContainer title={`Step ${step} of 3`} variant="elevated">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <StandardFormField label="Name" id="name" required>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </StandardFormField>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <>
            <StandardFormField label="Email" id="email" required>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </StandardFormField>
            <StandardFormField label="Phone" id="phone">
              <Input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </StandardFormField>
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-muted-foreground">{formData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground">{formData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-muted-foreground">{formData.phone || "N/A"}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 && <BackButton onClick={handleBack} />}

          <div className="flex gap-3 ml-auto">
            {step < 3 ? (
              <NextButton onClick={handleNext} />
            ) : (
              <SubmitButton loading={isSubmitting} />
            )}
          </div>
        </div>
      </form>
    </SectionContainer>
  );
}
```

---

## Data Display

### Data Table with Virtual Scrolling

Display large datasets efficiently.

```tsx
"use client";

import { VirtualList } from "@/components/performance";
import { StandardEmptyState } from "@/components/standard";
import { SectionContainer } from "@/components/layouts";
import { FileText } from "lucide-react";

interface DataItem {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function DataTable({ items }: { items: DataItem[] }) {
  return (
    <SectionContainer title="Data Table" variant="elevated">
      <VirtualList
        items={items}
        itemHeight={80}
        renderItem={(item, index) => (
          <div className="p-4 border-b hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{item.date}</span>
            </div>
          </div>
        )}
        height={600}
        overscan={3}
        emptyState={
          <StandardEmptyState
            icon={FileText}
            title="No Data"
            description="No items to display"
          />
        }
        getItemKey={(item) => item.id}
      />
    </SectionContainer>
  );
}
```

### Card Grid with Lazy Loading

Display cards with lazy-loaded images.

```tsx
import { GridLayout } from "@/components/layouts";
import { OptimizedImage } from "@/components/performance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CardItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export default function CardGrid({ items }: { items: CardItem[] }) {
  return (
    <GridLayout columns={3} gap="lg">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <OptimizedImage
            src={item.image}
            alt={item.title}
            width={400}
            height={300}
            aspectRatio="4/3"
            className="w-full"
          />
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </GridLayout>
  );
}
```

---

## Loading States

### Page Loading

Show loading state while fetching data.

```tsx
"use client";

import { useState, useEffect } from "react";
import { StandardLoadingState } from "@/components/standard";
import { ContentWrapper, PageHeader } from "@/components/layouts";

export default function PageWithLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <ContentWrapper maxWidth="default">
        <StandardLoadingState
          variant="spinner"
          size="lg"
          text="Loading page..."
          fullScreen
        />
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper maxWidth="default">
      <PageHeader title="My Page" />
      {/* Page content */}
    </ContentWrapper>
  );
}
```

### Section Loading

Show loading state for a specific section.

```tsx
"use client";

import { useState, useEffect } from "react";
import { StandardLoadingState } from "@/components/standard";
import { SectionContainer } from "@/components/layouts";

export default function SectionWithLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  return (
    <SectionContainer title="Section Title" variant="elevated">
      {isLoading ? (
        <StandardLoadingState variant="skeleton" size="md" />
      ) : (
        <div>{/* Section content */}</div>
      )}
    </SectionContainer>
  );
}
```

### Button Loading

Show loading state on button click.

```tsx
"use client";

import { useState } from "react";
import { SaveButton } from "@/components/standard";

export default function ButtonWithLoading() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SaveButton
      onClick={handleSave}
      loading={isSaving}
      loadingText="Saving..."
    />
  );
}
```

---

## Error Handling

### Page Error

Display error state for entire page.

```tsx
"use client";

import { StandardErrorDisplay } from "@/components/standard";
import { ContentWrapper } from "@/components/layouts";

export default function PageError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ContentWrapper maxWidth="default">
      <div className="flex items-center justify-center min-h-[400px]">
        <StandardErrorDisplay
          title="Something went wrong"
          message={error.message || "An unexpected error occurred"}
          variant="error"
          action={{ label: "Try Again", onClick: reset }}
        />
      </div>
    </ContentWrapper>
  );
}
```

### Section Error

Display error state for a specific section.

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  StandardErrorDisplay,
  StandardLoadingState,
} from "@/components/standard";
import { SectionContainer } from "@/components/layouts";

export default function SectionWithError() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SectionContainer title="Section Title" variant="elevated">
      {isLoading ? (
        <StandardLoadingState variant="skeleton" />
      ) : error ? (
        <StandardErrorDisplay
          title="Failed to Load"
          message={error.message}
          variant="error"
          action={{ label: "Retry", onClick: loadData }}
        />
      ) : (
        <div>{/* Section content */}</div>
      )}
    </SectionContainer>
  );
}
```

---

## Performance Optimization

### Lazy Load Heavy Component

Defer loading of heavy components.

```tsx
import { LazyComponent } from "@/components/performance";
import { StandardLoadingState } from "@/components/standard";
import { SectionContainer } from "@/components/layouts";

export default function PageWithLazyComponent() {
  return (
    <SectionContainer title="Chart" variant="elevated">
      <LazyComponent
        loader={() => import("./HeavyChart")}
        fallback={<StandardLoadingState variant="skeleton" size="lg" />}
        props={{ data: chartData }}
        errorMessage="Failed to load chart"
      />
    </SectionContainer>
  );
}
```

### Optimized Image Gallery

Display images with proper optimization.

```tsx
import { GridLayout } from "@/components/layouts";
import { OptimizedImage } from "@/components/performance";

interface Image {
  id: string;
  src: string;
  alt: string;
}

export default function ImageGallery({ images }: { images: Image[] }) {
  return (
    <GridLayout columns={3} gap="md">
      {images.map((image, index) => (
        <OptimizedImage
          key={image.id}
          src={image.src}
          alt={image.alt}
          width={400}
          height={300}
          aspectRatio="4/3"
          priority={index < 3} // Priority for first 3 images
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </GridLayout>
  );
}
```

---

## Common Patterns

### Empty State

Display when no data is available.

```tsx
import { StandardEmptyState } from "@/components/standard";
import { SectionContainer } from "@/components/layouts";
import { FileText } from "lucide-react";

export default function EmptyStateExample() {
  const handleCreate = () => {
    // Navigate to create page
  };

  return (
    <SectionContainer title="Content" variant="elevated">
      <StandardEmptyState
        icon={FileText}
        title="No Content Yet"
        description="Create your first piece of content to get started"
        action={{
          label: "Create Content",
          onClick: handleCreate,
          variant: "default",
        }}
      />
    </SectionContainer>
  );
}
```

### Confirmation Dialog

Confirm destructive actions.

```tsx
"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/standard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmationExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteItem();
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteButton onClick={() => setIsOpen(true)} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Search and Filter

Search and filter data.

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SectionContainer } from "@/components/layouts";

export default function SearchExample() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await searchData(query);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SectionContainer title="Search" variant="elevated">
      <div className="flex gap-2">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>
    </SectionContainer>
  );
}
```

---

## Related Documentation

- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [Component Catalog](./COMPONENT_CATALOG.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Design Tokens](./design-tokens.md)
