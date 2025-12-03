# Quick Share Functionality

The Quick Share feature enables real estate agents to instantly share property information with clients through multiple channels including QR codes, SMS, email, and social media.

## Features

### 1. QR Code Generation

- Generate scannable QR codes for properties
- Customizable size and colors
- Download QR codes as PNG images
- Tracking URLs embedded in QR codes

### 2. SMS Sharing

- Formatted SMS messages with property highlights
- Includes key details: address, price, beds, baths, sqft
- Tracking links for engagement metrics
- Mobile-optimized message format

### 3. Email Sharing

- Professional email templates
- Formatted subject lines and body content
- Agent branding and personalization
- Tracking links for engagement

### 4. Social Media Sharing

- Web Share API integration
- One-tap sharing to multiple platforms
- Custom messages and property details
- Works on mobile devices with native share sheet

### 5. Engagement Tracking

- Track views and clicks for each share
- Real-time metrics dashboard
- Historical share data
- Engagement analytics

## Components

### `QuickShareInterface`

Main UI component for creating and managing shares.

**Props:**

- `propertyId` (string): Unique property identifier
- `propertyData` (object, optional): Property information
  - `address` (string)
  - `price` (string)
  - `beds` (number)
  - `baths` (number)
  - `sqft` (number)
  - `description` (string)
  - `imageUrl` (string)
- `onClose` (function, optional): Callback when closing the interface

**Usage:**

```tsx
import { QuickShareInterface } from "@/components/mobile/quick-share-interface";

<QuickShareInterface
  propertyId="property-123"
  propertyData={{
    address: "123 Main St",
    price: "500,000",
    beds: 3,
    baths: 2,
    sqft: 1500,
    description: "Beautiful home...",
  }}
/>;
```

## Server Actions

### `sharePropertyAction`

Creates a new property share and generates tracking information.

**Parameters:**

- `propertyId` (string): Property ID
- `method` ('qr' | 'sms' | 'email' | 'social'): Share method
- `recipient` (string, optional): Recipient contact info
- `customMessage` (string, optional): Custom message
- `propertyData` (object, optional): Property details

**Returns:**

```typescript
{
  success: boolean;
  data: {
    shareId: string;
    trackingUrl: string;
    qrCodeDataUrl?: string;
    smsMessage?: string;
    emailSubject?: string;
    emailBody?: string;
  };
}
```

### `trackShareEngagementAction`

Tracks view and click events for shares.

**Parameters:**

- `shareId` (string): Share ID
- `eventType` ('view' | 'click'): Event type

### `getShareMetricsAction`

Retrieves engagement metrics for a share.

**Parameters:**

- `shareId` (string): Share ID

**Returns:**

```typescript
{
  success: boolean;
  data: {
    shareId: string;
    views: number;
    clicks: number;
    lastViewed?: number;
    createdAt: string;
  };
}
```

### `getUserSharesAction`

Gets all shares for the current user.

**Parameters:**

- `limit` (number, optional): Maximum number of shares to return (default: 50)

## Utility Functions

### `generatePropertyQR`

Generates a QR code data URL for a property.

```typescript
const qrCodeDataUrl = await generatePropertyQR(propertyId, userId, {
  width: 400,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
});
```

### `formatSMSMessage`

Formats property data into an SMS message.

```typescript
const smsMessage = formatSMSMessage(propertyData, trackingUrl);
```

### `formatEmailMessage`

Formats property data into email subject and body.

```typescript
const { subject, body } = formatEmailMessage(
  propertyData,
  trackingUrl,
  agentName
);
```

### `shareViaWebAPI`

Shares content using the Web Share API.

```typescript
const success = await shareViaWebAPI({
  title: "Property Title",
  text: "Check out this property!",
  url: trackingUrl,
});
```

### `isWebShareSupported`

Checks if the Web Share API is available.

```typescript
if (isWebShareSupported()) {
  // Show social share option
}
```

## Data Models

### PropertyShare

Stored in DynamoDB with the following structure:

```typescript
{
  PK: `USER#${userId}`,
  SK: `SHARE#${shareId}`,
  EntityType: 'PropertyShare',
  Data: {
    id: string;
    userId: string;
    propertyId: string;
    method: 'qr' | 'sms' | 'email' | 'social';
    recipient?: string;
    trackingUrl: string;
    qrCodeUrl?: string;
    views: number;
    clicks: number;
    lastViewed?: number;
    createdAt: string;
    expiresAt: string;
  }
}
```

## Mobile-Optimized Share View

The `/share/[shareId]` route provides a mobile-optimized view for shared properties:

- Responsive design optimized for mobile devices
- Large touch targets (44px minimum)
- Single-column layout
- Property details with images
- Call-to-action buttons (Call, Email, Schedule)
- Automatic engagement tracking

## Demo

Visit `/mobile/quick-share-demo` to see the Quick Share functionality in action with sample property data.

## Requirements Validated

This implementation validates the following requirements from the mobile-agent-features spec:

- **3.1**: QR code generation for properties ✓
- **3.2**: Mobile-optimized property share view ✓
- **3.3**: Web Share API integration ✓
- **3.4**: SMS formatting with property highlights and tracking links ✓
- **3.5**: Engagement tracking system in DynamoDB ✓

## Browser Support

- **QR Code Generation**: All modern browsers
- **Web Share API**: Mobile Safari (iOS 12.2+), Chrome for Android (61+)
- **Clipboard API**: All modern browsers
- **Fallback**: Manual copy/paste for unsupported browsers

## Security Considerations

- Share links expire after 90 days
- Tracking URLs are unique per share
- No sensitive data exposed in QR codes
- Server-side validation of all share operations
- Authentication required for creating shares

## Performance

- QR codes generated on-demand
- Efficient DynamoDB queries with proper indexing
- Minimal client-side JavaScript
- Optimized images for mobile viewing
- Progressive enhancement for Web Share API
