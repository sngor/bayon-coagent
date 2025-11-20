# Component Refactoring Checklist

This checklist helps you refactor existing components to use standardized shared components.

## Quick Wins - High Impact Refactoring

### Priority 1: AI Generation Forms

These forms have the most duplication and benefit most from standardization.

- [ ] `life-event-predictor-form.tsx` → Use `AIFormWrapper` + `useAIGeneration`
- [ ] `investment-opportunity-identification-form.tsx` → Use `AIFormWrapper` + `useAIGeneration`
- [ ] `listing-description-generator-form.tsx` → Use `AIFormWrapper` + `useAIGeneration`
- [ ] Any other AI generation forms in `/src/app/(app)` routes

**Estimated savings:** ~200 lines of code per form, consistent UX

### Priority 2: Data Tables

Replace custom table implementations with `DataTable`.

- [ ] Content lists in `/library/content`
- [ ] Report lists in `/library/reports`
- [ ] Competitor lists in `/brand/competitors`
- [ ] Any custom table implementations

**Estimated savings:** ~150 lines per table, automatic mobile responsiveness

### Priority 3: Status Displays

Replace custom status badges with `StatusBadge`.

- [ ] Content status displays
- [ ] Report status displays
- [ ] Connection status displays
- [ ] Any custom status indicators

**Estimated savings:** ~20 lines per usage, consistent styling

### Priority 4: Confirmation Dialogs

Replace custom confirmation dialogs with `ConfirmationDialog`.

- [ ] Delete confirmations
- [ ] Disconnect confirmations
- [ ] Any destructive action confirmations

**Estimated savings:** ~50 lines per dialog, consistent UX

## Refactoring Process

### Step 1: Identify Component Type

Determine which shared component to use:

```
AI Generation Form → AIFormWrapper + useAIGeneration
Data Table → DataTable
Status Display → StatusBadge
Confirmation → ConfirmationDialog
Multi-section Form → FormSection + FormSectionGroup
Action Buttons → ActionButtons
```

### Step 2: Create Refactored Version

Create a new file with `-refactored.tsx` suffix:

```bash
# Example
src/components/my-component/my-form.tsx
src/components/my-component/my-form-refactored.tsx
```

### Step 3: Implement Using Shared Components

Follow the patterns in `standardization-guide.md`:

```tsx
// Before: 100+ lines of boilerplate
function OldForm() {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  // ... 80 more lines
}

// After: Clean and simple
function NewForm() {
  const { output, isLoading, error, generate, copied, copyToClipboard } =
    useAIGeneration({ onGenerate: myAction });

  return <AIFormWrapper {...props} />;
}
```

### Step 4: Test Functionality

- [ ] Form submission works
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Success toasts appear
- [ ] Copy/save functionality works
- [ ] Mobile view is responsive

### Step 5: Update Imports

Update the page/route to use the refactored component:

```tsx
// Before
import { MyForm } from "@/components/my-component/my-form";

// After
import { MyForm } from "@/components/my-component/my-form-refactored";
```

### Step 6: Verify and Clean Up

- [ ] Test in development
- [ ] Check for TypeScript errors
- [ ] Verify no console errors
- [ ] Test on mobile
- [ ] Delete old component file
- [ ] Rename refactored file (remove `-refactored` suffix)

## Component-Specific Guides

### Refactoring AI Forms

**Before:**

```tsx
function MyAIForm() {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAction(data);
      setOutput(result.data);
      toast({ title: "Success" });
    } catch (err) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* fields */}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : null}
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
          {output && (
            <Button onClick={copyToClipboard}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : output ? (
            <Textarea value={output} />
          ) : (
            <div>Empty</div>
          )}
          {error && <div>{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
```

**After:**

```tsx
import { AIFormWrapper, useAIGeneration } from "@/components/shared";

function MyAIForm() {
  const { output, isLoading, error, generate, copied, copyToClipboard } =
    useAIGeneration({
      onGenerate: async (data) => {
        const result = await generateAction(data);
        return result.data;
      },
    });

  return (
    <AIFormWrapper
      formTitle="Input"
      formContent={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate(formData);
          }}
        >
          {/* fields */}
          <Button type="submit">Generate</Button>
        </form>
      }
      outputTitle="Output"
      output={output || ""}
      isLoading={isLoading}
      error={error}
      onCopy={() => copyToClipboard(output || "")}
      copied={copied}
    />
  );
}
```

**Lines saved:** ~80 lines

### Refactoring Data Tables

**Before:**

```tsx
function MyTable() {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const isMobile = useMobile();

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return sortDir === "asc"
          ? aVal > bVal
            ? 1
            : -1
          : aVal < bVal
          ? 1
          : -1;
      })
    : data;

  const filteredData = search
    ? sortedData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      )
    : sortedData;

  if (isMobile) {
    return (
      <div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
        {filteredData.map((item) => (
          <Card key={item.id}>{/* mobile card view */}</Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("name")}>Name</TableHead>
            <TableHead onClick={() => handleSort("status")}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**After:**

```tsx
import { DataTable, StatusBadge } from "@/components/shared";

function MyTable() {
  return (
    <DataTable
      data={data}
      columns={[
        { key: "name", label: "Name", sortable: true },
        {
          key: "status",
          label: "Status",
          render: (item) => <StatusBadge status={item.status} />,
        },
      ]}
      actions={[
        { label: "Edit", onClick: handleEdit },
        { label: "Delete", onClick: handleDelete, variant: "destructive" },
      ]}
      searchable
    />
  );
}
```

**Lines saved:** ~100 lines

### Refactoring Form Sections

**Before:**

```tsx
function MyForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
          <CardDescription>Your details</CardDescription>
        </CardHeader>
        <CardContent>{/* fields */}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Info</CardTitle>
          <CardDescription>Your business</CardDescription>
        </CardHeader>
        <CardContent>{/* fields */}</CardContent>
      </Card>
    </div>
  );
}
```

**After:**

```tsx
import { FormSection, FormSectionGroup } from "@/components/shared";
import { User, Building } from "lucide-react";

function MyForm() {
  return (
    <FormSectionGroup title="Profile">
      <FormSection
        title="Personal Info"
        description="Your details"
        icon={<User className="h-5 w-5" />}
      >
        {/* fields */}
      </FormSection>

      <FormSection
        title="Business Info"
        description="Your business"
        icon={<Building className="h-5 w-5" />}
      >
        {/* fields */}
      </FormSection>
    </FormSectionGroup>
  );
}
```

**Lines saved:** ~30 lines

## Testing Checklist

After refactoring, verify:

### Functionality

- [ ] All features work as before
- [ ] Form validation works
- [ ] Error handling works
- [ ] Success states work
- [ ] Loading states display

### UI/UX

- [ ] Layout matches design
- [ ] Spacing is consistent
- [ ] Colors are correct
- [ ] Icons display properly
- [ ] Animations work

### Responsive

- [ ] Desktop view works
- [ ] Tablet view works
- [ ] Mobile view works
- [ ] Touch interactions work

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus states visible
- [ ] ARIA labels present

### Performance

- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Fast load times
- [ ] Smooth animations

## Rollout Strategy

### Phase 1: New Features (Week 1)

- Use shared components for all new features
- Build muscle memory with new patterns
- Gather feedback

### Phase 2: High-Traffic Pages (Week 2-3)

- Refactor most-used AI forms
- Refactor main data tables
- Monitor for issues

### Phase 3: Remaining Components (Week 4-6)

- Refactor remaining forms
- Refactor remaining tables
- Clean up old code

### Phase 4: Documentation (Week 7)

- Update all examples
- Create video tutorials
- Share best practices

## Metrics to Track

- **Lines of code reduced:** Target 30% reduction
- **Component reuse:** Target 80% using shared components
- **Bug reports:** Should decrease with standardization
- **Development time:** Should decrease for new features
- **Consistency score:** Visual consistency across app

## Common Issues and Solutions

### Issue: Custom styling needed

**Solution:** Use `className` prop to extend styles

```tsx
<AIFormWrapper className="custom-spacing" />
```

### Issue: Need custom behavior

**Solution:** Extend the component or use composition

```tsx
function CustomWrapper(props) {
  return <AIFormWrapper {...props} customProp={value} />;
}
```

### Issue: TypeScript errors

**Solution:** Import and use provided types

```tsx
import type { DataTableColumn } from "@/components/shared";
```

### Issue: Breaking changes

**Solution:** Keep old component until fully tested

```tsx
// Keep both during transition
my - form.tsx; // old
my - form - new.tsx; // new
```

## Success Criteria

Refactoring is successful when:

1. ✅ All functionality works as before
2. ✅ Code is more maintainable
3. ✅ UI is more consistent
4. ✅ Development is faster
5. ✅ Fewer bugs reported
6. ✅ Team prefers new patterns

## Resources

- [Standardization Guide](./standardization-guide.md)
- [Component Library](./component-library.md)
- [Example Refactored Form](../src/components/life-event-predictor/life-event-predictor-form-refactored.tsx)
