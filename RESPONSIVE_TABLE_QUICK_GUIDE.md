# Responsive Tables - Quick Start Guide

## TL;DR

Two ways to make tables mobile-friendly:

1. **Scrollable** - Table scrolls horizontally on mobile (best for 3-6 columns)
2. **Cards** - Table becomes cards on mobile (best for 7+ columns)

## Quick Examples

### Option 1: Scrollable Table (Recommended for most cases)

```tsx
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

<ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[150px]">Name</TableHead>
        <TableHead className="whitespace-nowrap">Email</TableHead>
        <TableHead className="text-center whitespace-nowrap">Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="whitespace-nowrap">John Doe</TableCell>
        <TableCell>john@example.com</TableCell>
        <TableCell className="text-center">Active</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</ResponsiveTableWrapper>;
```

### Option 2: Card-Based Layout

```tsx
import { ResponsiveTableCards } from "@/components/ui/responsive-table";

<ResponsiveTableCards
  data={users}
  columns={[
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (value) => <Badge>{value}</Badge>,
    },
  ]}
  keyExtractor={(user) => user.id}
  breakpoint="md"
/>;
```

## Key Classes to Remember

### For Scrollable Tables

- `min-w-[150px]` - Set minimum column width
- `whitespace-nowrap` - Prevent text wrapping
- `text-center` - Center align content
- `text-right` - Right align content

### Example Cell Styling

```tsx
// Text that shouldn't wrap
<TableCell className="whitespace-nowrap">
  Long text here
</TableCell>

// Column with minimum width
<TableHead className="min-w-[200px]">
  Address
</TableHead>

// Centered content
<TableCell className="text-center font-semibold">
  123
</TableCell>

// Right-aligned actions
<TableCell className="text-right whitespace-nowrap">
  <Button size="sm">Edit</Button>
</TableCell>
```

## When to Use Which Approach

### Use Scrollable Tables When:

- ✅ 3-6 columns
- ✅ Mostly numbers or short text
- ✅ Users need to compare across rows
- ✅ Table structure is important

### Use Card Layout When:

- ✅ 7+ columns
- ✅ Complex cell content (images, multiple lines)
- ✅ Each row is a distinct item
- ✅ Vertical reading is more natural

## Common Patterns

### Pattern 1: Simple Data Table

```tsx
<ResponsiveTableWrapper mobileLayout="scroll">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[120px]">Name</TableHead>
        <TableHead className="text-center">Count</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="whitespace-nowrap">{item.name}</TableCell>
          <TableCell className="text-center">{item.count}</TableCell>
          <TableCell className="text-right">
            <Button size="sm">View</Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTableWrapper>
```

### Pattern 2: Table with Status Badges

```tsx
<ResponsiveTableWrapper mobileLayout="scroll">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[150px]">Agent</TableHead>
        <TableHead className="text-center whitespace-nowrap">Reviews</TableHead>
        <TableHead className="text-center whitespace-nowrap">Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {agents.map((agent) => (
        <TableRow key={agent.id}>
          <TableCell>
            <div className="font-medium whitespace-nowrap">{agent.name}</div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {agent.agency}
            </div>
          </TableCell>
          <TableCell className="text-center font-semibold">
            {agent.reviews}
          </TableCell>
          <TableCell className="text-center">
            <Badge
              variant={agent.status === "Active" ? "default" : "secondary"}
            >
              {agent.status}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTableWrapper>
```

### Pattern 3: Table with Icons

```tsx
<ResponsiveTableWrapper mobileLayout="scroll">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-[150px]">Name</TableHead>
        <TableHead className="text-center whitespace-nowrap">Rating</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="whitespace-nowrap">{item.name}</TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">{item.rating}</span>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTableWrapper>
```

## Props Reference

### ResponsiveTableWrapper

| Prop                  | Type                   | Default    | Description                  |
| --------------------- | ---------------------- | ---------- | ---------------------------- |
| `mobileLayout`        | `"scroll" \| "cards"`  | `"scroll"` | Layout mode for mobile       |
| `showScrollIndicator` | `boolean`              | `true`     | Show scroll shadows and hint |
| `breakpoint`          | `"sm" \| "md" \| "lg"` | `"md"`     | Breakpoint for mobile layout |

### ResponsiveTableCards

| Prop            | Type                            | Required | Description                |
| --------------- | ------------------------------- | -------- | -------------------------- |
| `data`          | `T[]`                           | ✅       | Array of data items        |
| `columns`       | `Column[]`                      | ✅       | Column definitions         |
| `keyExtractor`  | `(item: T) => string \| number` | ✅       | Unique key for each item   |
| `breakpoint`    | `"sm" \| "md" \| "lg"`          | ❌       | Breakpoint (default: "md") |
| `cardClassName` | `string`                        | ❌       | Additional card classes    |
| `onCardClick`   | `(item: T) => void`             | ❌       | Click handler              |

## Troubleshooting

### Table overflows on mobile

- ✅ Add `min-w-[...]` to columns
- ✅ Add `whitespace-nowrap` to cells
- ✅ Ensure `ResponsiveTableWrapper` is used

### Text wraps in cells

- ✅ Add `whitespace-nowrap` class to `TableCell`
- ✅ Consider reducing text length on mobile

### Scroll indicators don't show

- ✅ Set `showScrollIndicator={true}`
- ✅ Ensure table content is wider than container

### Cards don't show on mobile

- ✅ Use `ResponsiveTableCards` component
- ✅ Check breakpoint setting
- ✅ Verify viewport width is below breakpoint

## Demo Page

See live examples at: `/responsive-table-demo`

## Need Help?

Check the full documentation: `RESPONSIVE_TABLE_IMPLEMENTATION.md`
