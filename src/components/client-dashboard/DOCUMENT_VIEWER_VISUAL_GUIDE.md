# Document Viewer Visual Guide

## Component Overview

The Document Viewer displays a list of documents shared by the agent with the client, with download and preview capabilities.

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Documents Section                                            │
│ Access important documents shared by your agent              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [📄] Contract.pdf                        [Preview] [⬇] │  │
│  │      1.0 MB • Uploaded 2 days ago                     │  │
│  │      Purchase agreement                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [🖼️] Property-Photo.jpg                  [Preview] [⬇] │  │
│  │      500.0 KB • Uploaded 1 day ago                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [📊] Market-Analysis.xlsx                        [⬇] │  │
│  │      2.5 MB • Uploaded 3 days ago                     │  │
│  │      Q4 market trends                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Document Card Components

### 1. File Icon (Left)

- **PDF**: FileText icon (📄)
- **Image**: Image icon (🖼️)
- **Spreadsheet**: FileSpreadsheet icon (📊)
- **Other**: Generic File icon (📁)
- Background color: Agent's primary color at 20% opacity
- Icon color: Agent's primary color

### 2. File Information (Center)

- **File Name**: Bold, truncated if too long
- **File Size**: Formatted (B, KB, MB)
- **Upload Date**: Relative time (e.g., "2 days ago")
- **Description** (optional): Gray text, truncated

### 3. Action Buttons (Right)

- **Preview Button** (PDFs and images only):

  - Eye icon
  - "Preview" text (hidden on mobile)
  - Outline style
  - Opens modal preview

- **Download Button** (all documents):
  - Download icon
  - "Download" text (hidden on mobile)
  - Agent's primary color background
  - White text
  - Triggers download and logs analytics

## Preview Modal

### PDF Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Contract.pdf                                    [Close]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │                                                     │    │
│  │              PDF CONTENT                            │    │
│  │              (iframe viewer)                        │    │
│  │                                                     │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Image Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Property-Photo.jpg                              [Close]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────────┐                         │
│                    │              │                         │
│                    │    IMAGE     │                         │
│                    │   CONTENT    │                         │
│                    │              │                         │
│                    └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│ Documents Section                                            │
│ Access important documents shared by your agent              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                         📁                                   │
│                                                              │
│           No documents have been shared yet.                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Loading State

```
┌─────────────────────────────────────────────────────────────┐
│ Documents Section                                            │
│ Access important documents shared by your agent              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                  Loading documents...                        │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥640px)

- Full button text visible ("Preview", "Download")
- Two-column layout for buttons
- Full file information visible

### Mobile (<640px)

- Button text hidden (icons only)
- Single-column layout
- File information stacks vertically
- Touch-optimized button sizes

## Color Scheme

### Light Mode

- Background: Gray-50 (#f9fafb)
- Card Background: White
- Text: Gray-900
- Secondary Text: Gray-600
- Border: Gray-200

### Dark Mode

- Background: Gray-900
- Card Background: Gray-800
- Text: White
- Secondary Text: Gray-400
- Border: Gray-800

### Branding

- Primary Color: Agent's configured color
- Icon Background: Primary color at 20% opacity
- Download Button: Primary color background

## Interactions

### Hover States

- Document card: Slight background color change
- Buttons: Shadow increase, slight scale

### Click States

- Download: Shows loading spinner, triggers download
- Preview: Shows loading spinner, opens modal
- Modal close: Closes preview

### Loading States

- Downloading: Spinner replaces button icon
- Button disabled during operation
- Prevents multiple simultaneous downloads

## File Type Support

### Previewable

- ✅ PDF (application/pdf)
- ✅ JPEG (image/jpeg)
- ✅ PNG (image/png)
- ✅ GIF (image/gif)
- ✅ WebP (image/webp)

### Download Only

- 📄 DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- 📊 XLSX (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- 📄 TXT (text/plain)
- 📄 Other formats

## Analytics Tracking

Every download is tracked with:

- Document ID
- Dashboard ID
- Timestamp
- File name

This data is used for:

- Agent analytics dashboard
- Email notifications to agent
- Client engagement metrics
- Popular document identification

## Accessibility

- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Readers**: Proper ARIA labels on buttons
- **Focus Indicators**: Visible focus states
- **Alt Text**: Images have descriptive alt text
- **Color Contrast**: Meets WCAG AA standards

## Error Handling

### Download Errors

- Alert message: "Failed to download document. Please try again."
- Console error logged for debugging
- Button returns to normal state

### Preview Errors

- Alert message: "Failed to preview document. Please try again."
- Console error logged for debugging
- Modal doesn't open

### Network Errors

- Graceful degradation
- User-friendly error messages
- Retry capability
