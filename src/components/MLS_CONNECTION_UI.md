# MLS Connection UI Implementation

## Overview

The MLS Connection UI component provides a comprehensive interface for managing MLS provider connections in the Settings hub. This implementation fulfills task 18 of the MLS Social Integration spec.

## Requirements Coverage

### Requirement 1.1: MLS Connection Initiation

- ✅ Provider selection dropdown with FlexMLS, CRMLS, and BrightMLS
- ✅ Credential input form with username, password, and optional MLS ID
- ✅ Connection dialog with validation

### Requirement 1.2: Secure Credential Storage

- ✅ Credentials are sent to server actions for secure storage
- ✅ Tokens are encrypted and stored in DynamoDB via repository methods

### Requirement 1.3: Authentication Error Handling

- ✅ Clear error messages displayed via toast notifications
- ✅ Form validation with inline error messages
- ✅ Retry functionality available

### Requirement 1.4: Agent Information Display

- ✅ Agent ID displayed in connection details
- ✅ Brokerage ID displayed in connection details
- ✅ Connection status badge (Connected/Expired)

### Requirement 1.5: Connection Management

- ✅ Disconnect functionality with confirmation
- ✅ Last sync time display
- ✅ Sync history with timestamps and status
- ✅ Manual sync trigger button

## Component Structure

### Main Component: `MLSConnection`

Located at: `src/components/mls-connection.tsx`

**Features:**

- Connection status display
- Provider selection and authentication
- Connection details (Agent ID, Brokerage ID, dates)
- Sync history tracking
- Manual sync trigger
- Disconnect functionality
- Connection tips and guidance

### Server Actions

Located at: `src/app/mls-actions.ts`

**New Actions Added:**

1. `connectMLSAction(credentials)` - Establishes MLS connection
2. `getMLSConnectionsAction(userId)` - Retrieves user's MLS connections
3. `disconnectMLSAction(userId, connectionId)` - Disconnects from MLS
4. `getMLSSyncHistoryAction(userId)` - Gets sync history

## Integration

The component is integrated into the Settings page under the "Integrations" tab:

```tsx
// src/app/(app)/settings/page.tsx
import { MLSConnection } from "@/components/mls-connection";

// In the Integrations tab:
<TabsContent value="integrations" className="space-y-6">
  {/* Other integrations */}
  <MLSConnection />
  <SocialMediaConnections />
</TabsContent>;
```

## User Flow

1. **Initial State**: User sees "No MLS Connection" card with "Connect MLS" button
2. **Connection Dialog**: Click opens dialog with provider selection and credential form
3. **Authentication**: Submit credentials to establish connection
4. **Connected State**: Shows connection details, sync button, and disconnect option
5. **Sync**: Manual sync button triggers listing import
6. **Disconnect**: Removes connection and clears stored credentials

## UI Components Used

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Layout
- `Button` - Actions (Connect, Sync, Disconnect)
- `Badge` - Status indicators
- `Alert`, `AlertDescription` - Error/warning messages
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` - Connection modal
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` - Provider dropdown
- `Input` - Credential fields
- `Label` - Form labels

## State Management

The component manages the following state:

- `connection` - Current MLS connection object
- `isLoading` - Initial load state
- `isConnecting` - Connection in progress
- `isDisconnecting` - Disconnection in progress
- `isSyncing` - Sync in progress
- `showConnectDialog` - Dialog visibility
- `syncHistory` - Array of sync events
- Form fields: `selectedProvider`, `username`, `password`, `mlsId`
- `formErrors` - Validation errors

## Error Handling

- Form validation before submission
- Toast notifications for success/error states
- Inline error messages for form fields
- Expired token detection and warning
- Network error handling with user-friendly messages

## Security Considerations

- Passwords are never stored in component state after submission
- Credentials are transmitted securely to server actions
- Server actions handle encryption and secure storage
- Token expiration is checked and displayed to user

## Future Enhancements

- Real-time sync status updates
- Detailed sync history with listing counts
- Multiple MLS connection support
- Automatic token refresh
- Connection health monitoring

## Testing

To test the MLS connection UI:

1. Navigate to Settings → Integrations tab
2. Click "Connect MLS" button
3. Select a provider (FlexMLS, CRMLS, or BrightMLS)
4. Enter test credentials
5. Verify connection success/failure handling
6. Test sync functionality
7. Test disconnect functionality

## Dependencies

- `@/aws/auth` - User authentication
- `@/hooks/use-toast` - Toast notifications
- `@/integrations/mls/types` - MLS type definitions
- `@/app/mls-actions` - Server actions for MLS operations
- `lucide-react` - Icons
- `@/components/ui/*` - UI components

## Notes

- The sync history currently returns mock data (TODO: implement actual tracking)
- Token refresh is not yet implemented (tokens expire and require reconnection)
- Only one MLS connection per user is currently supported
- Automatic sync every 15 minutes is handled by a separate cron job (not in this component)
