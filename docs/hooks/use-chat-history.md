# useChatHistory Hook

React hook for managing chat history with server-side persistence, optimistic updates, and enhanced error handling.

## Overview

The `useChatHistory` hook provides a complete interface for managing chat sessions with DynamoDB persistence. It includes features like optimistic updates, timeout protection, graceful error handling, and cross-device synchronization.

## Import

```typescript
import { useChatHistory } from '@/hooks/use-chat-history';
```

## Usage

```typescript
function ChatComponent() {
  const {
    sessions,
    currentSession,
    isLoading,
    isSaving,
    error,
    loadSessions,
    loadSession,
    saveSession,
    updateTitle,
    deleteSession,
    deleteAllSessions,
    addMessage,
    setCurrentSession,
  } = useChatHistory();

  // Load a specific chat
  const handleLoadChat = async (chatId: string) => {
    const session = await loadSession(chatId);
    if (session) {
      // Session loaded successfully
      console.log('Loaded session:', session);
    }
  };

  // Save current chat
  const handleSaveChat = async () => {
    const success = await saveSession(
      'chat-123',
      'My Chat Title',
      [
        { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() }
      ]
    );
    
    if (success) {
      console.log('Chat saved successfully');
    }
  };

  return (
    <div>
      {isLoading && <div>Loading chat history...</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="chat-list">
        {sessions.map(session => (
          <div key={session.id} onClick={() => handleLoadChat(session.id)}>
            {session.title} ({session.messageCount} messages)
          </div>
        ))}
      </div>
    </div>
  );
}
```

## API Reference

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `sessions` | `ChatSession[]` | Array of all chat sessions for the current user |
| `currentSession` | `ChatSession \| null` | Currently loaded chat session |
| `isLoading` | `boolean` | Whether sessions are being loaded |
| `isSaving` | `boolean` | Whether a save operation is in progress |
| `error` | `string \| null` | Current error message, if any |

### Methods

#### `loadSessions(): Promise<void>`
Loads all chat sessions for the current user.

- **Returns**: Promise that resolves when loading is complete
- **Side Effects**: Updates `sessions`, `isLoading`, and `error` states
- **Error Handling**: Includes timeout protection (10 seconds) and graceful error messages

#### `loadSession(chatId: string): Promise<ChatSession | null>`
Loads a specific chat session by ID.

- **Parameters**:
  - `chatId`: Unique identifier for the chat session
- **Returns**: Promise resolving to the chat session or null if failed
- **Side Effects**: Updates `currentSession` state

#### `saveSession(chatId: string, title: string, messages: ChatMessage[]): Promise<boolean>`
Saves a chat session with optimistic updates.

- **Parameters**:
  - `chatId`: Unique identifier for the chat session
  - `title`: Display title for the chat
  - `messages`: Array of chat messages
- **Returns**: Promise resolving to success boolean
- **Features**: 
  - Optimistic UI updates
  - Automatic rollback on failure
  - Session sorting by update time

#### `updateTitle(chatId: string, title: string): Promise<boolean>`
Updates the title of an existing chat session.

- **Parameters**:
  - `chatId`: Unique identifier for the chat session
  - `title`: New title for the chat
- **Returns**: Promise resolving to success boolean
- **Side Effects**: Updates both `sessions` and `currentSession` if applicable

#### `deleteSession(chatId: string): Promise<boolean>`
Deletes a specific chat session.

- **Parameters**:
  - `chatId`: Unique identifier for the chat session
- **Returns**: Promise resolving to success boolean
- **Side Effects**: Removes session from `sessions` and clears `currentSession` if it matches

#### `deleteAllSessions(): Promise<boolean>`
Deletes all chat sessions for the current user.

- **Returns**: Promise resolving to success boolean
- **Side Effects**: Clears `sessions` array and `currentSession`
- **Success Message**: Shows count of deleted sessions

#### `addMessage(message: ChatMessage): Promise<boolean>`
Adds a message to the current session.

- **Parameters**:
  - `message`: Chat message object with role, content, and timestamp
- **Returns**: Promise resolving to success boolean
- **Requirements**: Must have a `currentSession` loaded
- **Side Effects**: Updates both `currentSession` and corresponding entry in `sessions`

#### `setCurrentSession(session: ChatSession | null): void`
Manually sets the current session (for local state management).

- **Parameters**:
  - `session`: Chat session to set as current, or null to clear

## Types

### ChatSession
```typescript
interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
```

## Features

### 🔄 Optimistic Updates
The hook provides optimistic updates for better user experience:
- Sessions are updated in local state immediately
- Changes are rolled back if server operations fail
- Users see instant feedback while operations complete in background

### ⏱️ Timeout Protection
Network operations include timeout protection:
- 10-second timeout for loading operations
- User-friendly error messages for slow connections
- Graceful degradation when network is unavailable

### 🔐 Authentication Handling
Smart authentication state management:
- Automatically clears sessions when user is not authenticated
- Avoids showing authentication errors to users
- Handles loading states during authentication

### 🎯 Error Handling
Enhanced error handling and user feedback:
- Uses proper toast notifications (`showErrorToast`, `showSuccessToast`)
- Filters out technical errors from user-facing messages
- Provides actionable error messages

### 📱 Cross-Device Sync
Server-side persistence enables:
- Access to chat history from any device
- Automatic synchronization across sessions
- Persistent storage that survives cache clears

## Error Handling

The hook includes comprehensive error handling:

```typescript
// Example error scenarios handled:
// 1. Network timeouts
// 2. Authentication failures
// 3. Server errors
// 4. Invalid data formats
// 5. Connection issues

// Error messages are user-friendly:
"Loading took too long. Please check your connection and try again."
"Could not load chat sessions. Please try refreshing the page."
"Failed to save chat: [specific error]"
```

## Performance Considerations

- **Optimistic Updates**: Immediate UI feedback while server operations complete
- **Request Deduplication**: Prevents duplicate requests during rapid user actions
- **Efficient State Updates**: Minimal re-renders through careful state management
- **Memory Management**: Automatic cleanup of unused sessions

## Integration Examples

### With Assistant Page
```typescript
// In assistant page component
const {
  sessions: chatHistory,
  currentSession,
  saveSession,
  loadSession,
  deleteSession,
} = useChatHistory();

// Save chat when switching conversations
const handleNewChat = async () => {
  if (currentChatId && chatMessages.length > 0) {
    await saveSession(currentChatId, chatTitle, chatMessages);
  }
  // Start new chat...
};
```

### With Migration Logic
```typescript
// Handle migration from localStorage
const handleMigration = async () => {
  const localData = getLocalChatHistory(user.id);
  
  for (const chat of localData) {
    await saveSession(chat.id, chat.title, chat.messages);
  }
  
  clearLocalChatHistory(user.id);
  await loadSessions(); // Refresh from server
};
```

## Testing

The hook can be tested with various scenarios:

```typescript
// Test loading states
expect(result.current.isLoading).toBe(true);

// Test error handling
await act(async () => {
  // Trigger network error
});
expect(result.current.error).toContain('connection');

// Test optimistic updates
await act(async () => {
  await result.current.saveSession('test', 'Test Chat', []);
});
expect(result.current.sessions).toHaveLength(1);
```

## Dependencies

- `@/app/chat-history-actions`: Server actions for DynamoDB operations
- `@/aws/auth`: User authentication context
- `@/hooks/use-toast`: Toast notification system

## Related Documentation

- [Assistant Integration Guide](../guides/assistant-integration.md)
- [Chat History Actions](../api/chat-history-actions.md)
- [DynamoDB Schema](../architecture/database-schema.md)