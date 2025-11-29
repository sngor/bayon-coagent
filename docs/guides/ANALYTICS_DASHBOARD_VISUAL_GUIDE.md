# Analytics Dashboard Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Overview                    [Date Range Selector ▼]  │
│  Track engagement and activity across all client dashboards     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────┐│
│  │   Users      │  │   Eye        │  │  Download    │  │ Msg ││
│  │      5       │  │     127      │  │     43       │  │  12 ││
│  │ Dashboards   │  │  Total Views │  │  Downloads   │  │Cont.││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────┐  ┌────────────────────────┐  │
│  │  Dashboard Views            │  │  Activity Distribution │  │
│  │  Top 10 most viewed         │  │  Breakdown of client   │  │
│  │                             │  │  interactions          │  │
│  │  ┌─────────────────────┐   │  │                        │  │
│  │  │ [Bar Chart]         │   │  │    ┌──────────┐        │  │
│  │  │ Client A    ████    │   │  │    │          │        │  │
│  │  │ Client B    ███     │   │  │    │ [Pie]    │        │  │
│  │  │ Client C    ██      │   │  │    │  Chart   │        │  │
│  │  │ ...                 │   │  │    │          │        │  │
│  │  └─────────────────────┘   │  │    └──────────┘        │  │
│  └─────────────────────────────┘  └────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Most Viewed Properties                                         │
│  Properties with the most client interest                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1  Property abc12345                    [12 views]     │   │
│  │  2  Property def67890                    [8 views]      │   │
│  │  3  Property ghi11121                    [6 views]      │   │
│  │  4  Property jkl31415                    [5 views]      │   │
│  │  5  Property mno16171                    [4 views]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard-Specific Analytics                                   │
│  View detailed analytics for individual dashboards              │
│                                                                  │
│  [Select a dashboard ▼]                                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  John Smith                        [View Dashboard]     │   │
│  │  john.smith@email.com                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Eye     │  │  Home    │  │ Download │  │  Msg     │      │
│  │   15     │  │    8     │  │    5     │  │   3      │      │
│  │ Views    │  │Properties│  │Documents │  │Contacts  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🕐 Last accessed 2 hours ago                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Recent Activity                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏠 Viewed property abc12345                            │   │
│  │     2 hours ago                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  📥 Downloaded document xyz98765                        │   │
│  │     5 hours ago                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  💬 property_inquiry                                    │   │
│  │     I'm interested in this property...                  │   │
│  │     1 day ago                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Section

- **Title**: "Analytics Overview"
- **Description**: Brief explanation of the page
- **Date Range Selector**: Dropdown to filter by time period
  - Last 7 Days
  - Last 30 Days
  - Last 90 Days
  - All Time

### 2. Aggregate Metrics Cards (4 cards)

**Card 1: Total Dashboards**

- Icon: Users
- Value: Number of active client dashboards
- Label: "Active client dashboards"

**Card 2: Total Views**

- Icon: Eye
- Value: Aggregate dashboard views
- Label: "Dashboard views"

**Card 3: Document Downloads**

- Icon: Download
- Value: Total downloads across all dashboards
- Label: "Files downloaded"

**Card 4: Contact Requests**

- Icon: MessageSquare
- Value: Total client inquiries
- Label: "Client inquiries"

### 3. Charts Section (2 charts side-by-side)

**Chart 1: Dashboard Views (Bar Chart)**

- Shows top 10 most viewed dashboards
- X-axis: Client names (angled for readability)
- Y-axis: View count
- Color: Blue (#3b82f6)
- Includes grid lines and tooltips

**Chart 2: Activity Distribution (Pie Chart)**

- Shows breakdown of:
  - Views
  - Downloads
  - Contacts
- Displays percentages
- Uses color palette: Blue, Purple, Pink
- Includes tooltips

### 4. Most Viewed Properties Section

- Card with list of top 5 properties
- Each item shows:
  - Rank number (1-5) in circular badge
  - Property ID (truncated to 8 characters)
  - View count
  - Badge with view count

### 5. Dashboard-Specific Analytics Section

**Dashboard Selector**

- Dropdown to select individual dashboard
- Shows client name for each option

**Selected Dashboard Info**

- Client name and email
- "View Dashboard" button to navigate to dashboard editor

**Metrics Grid (4 metrics)**

- View count
- Properties viewed
- Documents downloaded
- Contact requests

**Last Accessed**

- Shows when dashboard was last viewed
- Formatted as relative time (e.g., "2 hours ago")

**Recent Activity Timeline**

- Scrollable list of recent interactions
- Each item shows:
  - Icon (Home, Download, or MessageSquare)
  - Activity description
  - Timestamp (relative)
  - Message preview for contact requests

## Color Scheme

- **Primary**: Blue (#3b82f6)
- **Secondary**: Purple (#8b5cf6)
- **Accent 1**: Pink (#ec4899)
- **Accent 2**: Orange (#f59e0b)
- **Accent 3**: Green (#10b981)
- **Accent 4**: Indigo (#6366f1)

## Responsive Behavior

### Desktop (lg+)

- 4 metric cards in a row
- 2 charts side-by-side
- 4 dashboard metrics in a row

### Tablet (md)

- 2 metric cards per row
- 2 charts side-by-side
- 2 dashboard metrics per row

### Mobile (sm)

- 1 metric card per row
- 1 chart per row (stacked)
- 1 dashboard metric per row

## Empty States

### No Dashboards

- Icon: BarChart3
- Title: "No Dashboards Yet"
- Description: "Create your first client dashboard to start tracking analytics"
- Action: "Create Dashboard" button

### No Authentication

- Icon: Users
- Title: "Authentication Required"
- Description: "Please log in to view analytics"
- Action: "Go to Login" button

### No Data in Charts

- Centered text: "No view data available" or "No activity data available"
- Displayed in place of chart

## Loading States

- Uses StandardSkeleton with "card" variant
- Shows 6 skeleton cards while loading
- Displayed during:
  - Initial page load
  - User authentication check
  - Data fetching

## Interactions

1. **Date Range Selection**: Updates all metrics and charts
2. **Dashboard Selection**: Shows detailed analytics for selected dashboard
3. **View Dashboard Button**: Navigates to dashboard editor
4. **Chart Hover**: Shows tooltips with exact values
5. **Activity Items**: Display full information on hover

## Data Flow

```
User Loads Page
    ↓
Fetch All Dashboards
    ↓
Fetch Analytics for Each Dashboard (Parallel)
    ↓
Calculate Aggregate Metrics
    ↓
Apply Date Range Filter
    ↓
Render Charts and Metrics
    ↓
User Selects Dashboard
    ↓
Display Dashboard-Specific Analytics
```

## Performance Optimizations

1. **Parallel Fetching**: All dashboard analytics fetched simultaneously
2. **Memoization**: Aggregate calculations memoized with useMemo
3. **Client-side Filtering**: Date filtering done in browser
4. **Lazy Chart Rendering**: Charts only render when data available
5. **Efficient Data Structures**: Map used for O(1) analytics lookup

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast meets WCAG standards
- Focus indicators on interactive elements
