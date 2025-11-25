# CMA Report Visual Reference

## Component Layout

The CMA Report component displays information in the following order:

### 1. Price Recommendation Callout (Top Priority)

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Price Recommendation                                 │
│ Based on comparative market analysis                    │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐         │
│  │   Low    │  │ Recommended  │  │   High   │         │
│  │$1,220,000│  │  $1,285,000  │  │$1,350,000│         │
│  └──────────┘  └──────────────┘  └──────────┘         │
│                                                          │
│  Average Price per Sq Ft: $695                          │
│  Estimated Value: $1,285,750 (based on 1,850 sq ft)    │
└─────────────────────────────────────────────────────────┘
```

### 2. Market Statistics Cards (3 Columns)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 📈 Median    │  │ 📅 Days on   │  │ 🏠 Inventory │
│    Price     │  │    Market    │  │    Level     │
│              │  │              │  │              │
│ $1,280,000   │  │      28      │  │     LOW      │
│ Market median│  │ Average days │  │Seller's mkt  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3. Subject Property Details

```
┌─────────────────────────────────────────────────────────┐
│ 📍 Subject Property                                      │
│                                                          │
│ 123 Main Street, San Francisco, CA 94102                │
│                                                          │
│ 🛏️ 3 beds  │  🛁 2 baths  │  📐 1,850 sq ft  │  📅 2015│
└─────────────────────────────────────────────────────────┘
```

### 4. Property Comparison Table

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Comparable Properties                                                     │
│ 5 comparable properties used in this analysis                            │
│                                                                           │
│ Address              │ Sold Price │ $/Sq Ft │ Beds │ Baths │ Sq Ft │... │
│──────────────────────┼────────────┼─────────┼──────┼───────┼───────┼────│
│ 456 Oak Ave, SF, CA  │ $1,250,000 │   $694  │  3   │   2   │ 1,800 │... │
│ 789 Pine St, SF, CA  │ $1,320,000 │   $695  │  3   │  2.5  │ 1,900 │... │
│ 321 Elm Dr, SF, CA   │ $1,180,000 │   $674  │  3   │   2   │ 1,750 │... │
│ ...                  │    ...     │   ...   │ ...  │  ...  │  ...  │... │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5. Price Trends Chart (Line Chart)

```
┌─────────────────────────────────────────────────────────┐
│ Price Trends                                             │
│ Historical sale prices of comparable properties          │
│                                                          │
│ $1.4M ┤                                        ●         │
│       │                              ●                   │
│ $1.3M ┤                    ●                             │
│       │          ●                                       │
│ $1.2M ┤    ●                                             │
│       │                                                  │
│ $1.1M └────┬────┬────┬────┬────┬────┬────┬────         │
│          Jan  Feb  Mar  Apr  May  Jun  Jul  Aug         │
│                                                          │
│ ─── Sale Price                                          │
└─────────────────────────────────────────────────────────┘
```

### 6. Price per Sq Ft Comparison (Bar Chart)

```
┌─────────────────────────────────────────────────────────┐
│ Price per Square Foot Comparison                         │
│ Comparing value across comparable properties             │
│                                                          │
│ $700 ┤     ███                                           │
│      │     ███     ███                                   │
│ $690 ┤     ███     ███     ███                           │
│      │     ███     ███     ███     ███                   │
│ $680 ┤     ███     ███     ███     ███     ███           │
│      │     ███     ███     ███     ███     ███           │
│ $670 └─────┴───────┴───────┴───────┴───────┴───         │
│          Comp 1  Comp 2  Comp 3  Comp 4  Comp 5         │
│                                                          │
│ ■ Price per Sq Ft                                       │
└─────────────────────────────────────────────────────────┘
```

### 7. Property Locations Map

```
┌─────────────────────────────────────────────────────────┐
│ Property Locations                                       │
│ Subject property and comparable properties on map        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │         ●  ○                                     │   │
│  │      ○        ○                                  │   │
│  │                                                  │   │
│  │   ○              ●                               │   │
│  │                     ○                            │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ● Subject Property: 123 Main St                        │
│  ○ 5 Comparable Properties                              │
└─────────────────────────────────────────────────────────┘
```

### 8. Agent Notes (Optional)

```
┌─────────────────────────────────────────────────────────┐
│ Agent Notes                                              │
│                                                          │
│ Based on the current market analysis, this property     │
│ is well-positioned in a highly desirable neighborhood.  │
│ The recent comparable sales show strong demand with     │
│ properties selling quickly.                              │
│                                                          │
│ Key factors supporting the recommended price range:     │
│ • Recent renovations and modern finishes                │
│ • Excellent location with walkability to amenities      │
│ • Low inventory creating competitive market conditions  │
│ • Strong buyer demand in this price range               │
└─────────────────────────────────────────────────────────┘
```

### 9. Call to Action

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│         Questions About This Report?                     │
│                                                          │
│  Contact your agent to discuss this analysis and        │
│  next steps                                              │
│                                                          │
│         ┌──────────────────────────┐                    │
│         │  Discuss This Report     │                    │
│         └──────────────────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Color Scheme

### Primary Elements

- **Agent Branding Color**: Used for primary buttons, chart lines, subject property marker
- **Default**: `#3b82f6` (blue)

### Market Statistics

- **Median Price**: Blue (`#2563eb`)
- **Days on Market**: Amber (`#d97706`)
- **Inventory Level**:
  - Low: Red (`#ef4444`) - Seller's market
  - Medium: Amber (`#f59e0b`) - Balanced market
  - High: Green (`#10b981`) - Buyer's market

### Charts

- **Line Chart**: Agent's primary color with 2px stroke
- **Bar Chart**: Agent's primary color with 80% opacity
- **Grid Lines**: Light gray (`#e5e7eb`)
- **Tooltips**: White background with subtle border

### Map Markers

- **Subject Property**: Agent's primary color, larger marker
- **Comparables**: Gray (`#9ca3af`), smaller markers

## Responsive Behavior

### Desktop (≥1024px)

- 3-column grid for market statistics
- Full-width table with all columns visible
- Charts at 100% width with optimal height
- Side-by-side layout for property details

### Tablet (768px - 1023px)

- 3-column grid maintained for statistics
- Table with horizontal scroll
- Charts remain full-width
- Stacked layout for some elements

### Mobile (<768px)

- Single column layout
- Statistics cards stack vertically
- Table with horizontal scroll
- Charts scale to container width
- Touch-optimized interactions

## Interactive Features

### Charts

- **Hover**: Display detailed tooltips with property information
- **Responsive**: Automatically adjust to container size
- **Accessible**: Keyboard navigation support

### Table

- **Hover**: Row highlighting for better readability
- **Scroll**: Horizontal scroll on mobile devices
- **Sort**: (Future enhancement) Click headers to sort

### Map

- **Zoom**: Pinch to zoom on mobile, scroll wheel on desktop
- **Pan**: Drag to move around the map
- **Markers**: Click to view property details
- **Info Windows**: Display property information on marker click

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for interactive elements
- Color contrast compliance (WCAG AA)
- Keyboard navigation support
- Screen reader friendly descriptions

## Print Optimization

The component is designed to be print-friendly:

- Page breaks avoided within sections
- Charts render at appropriate sizes
- Colors optimized for both screen and print
- Margins and padding adjusted for print layout
