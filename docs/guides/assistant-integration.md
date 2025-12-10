# Assistant Page Integration Guide

## Summary

I've started integrating server-side chat history into the assistant page. Here's what's been done and what remains.

## Changes Made ✅

### 1. Added Imports

```typescript
import { useChatHistory } from "@/hooks/use-chat-history";
import {
  migrateChatHistoryToServer,
  hasLocalChatHistory,
  getLocalChatHistoryCount,
} from "@/lib/migrate-chat-history";
import { toast } from "@/hooks/use-toast";
import { Cloud, HardDrive } from "lucide-react";
```

### 2. Replaced State with Hook

```typescript
// OLD: Local state
const [chatHistory, setChatHistory] = useState([]);

// NEW: Server-side hook
const {
  sessions: chatHistory,
  currentSession,
  isLoading: isLoadingHistory,
  saveSession,
  loadSession,
  updateTitle,
  deleteSession,
  deleteAllSessions,
} = useChatHistory();
```

### 3. Added Migration Logic

```typescript
// Check for localStorage data
useEffect(() => {
  if (user?.id && hasLocalChatHistory(user.id)) {
    setShowMigrationPrompt(true);
  }
}, [user?.id]);

// Handle migration
const handleMigration = async () => {
  const result = await migrateChatHistoryToServer(user.id);
  if (result.success) {
    toast({ title: "Migration Complete!" });
    window.location.reload();
  }
};
```

## Remaining Changes Needed

### 1. Update handleNewChat

```typescript
// OLD
const handleNewChat = () => {
  setChatHistory((prev) => [newHistoryItem, ...prev]);
};

// NEW
const handleNewChat = async () => {
  if (currentChatId && chatMessages.length > 0) {
    // Save to server
    await saveSession(
      currentChatId,
      `Chat ${new Date().toLocaleDateString()}`,
      chatMessages.map((msg) => ({
        role: msg.role === "ai" ? "assistant" : msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))
    );
  }

  // Start new chat
  const newChatId = `chat-${Date.now()}`;
  setCurrentChatId(newChatId);
  setChatMessages([]);
  setChatKey((prev) => prev + 1);
  setActiveTab("chat");
};
```

### 2. Update handleLoadChat

```typescript
// OLD
const handleLoadChat = (chatId: string) => {
  const chat = chatHistory.find((c) => c.id === chatId);
  setChatMessages(chat.messages);
};

// NEW
const handleLoadChat = async (chatId: string) => {
  const session = await loadSession(chatId);
  if (session) {
    setCurrentChatId(session.id);
    setChatMessages(session.messages);
    setChatKey((prev) => prev + 1);
    setActiveTab("chat");
  }
};
```

### 3. Update handleDeleteChat

```typescript
// OLD
const handleDeleteChat = (chatId: string) => {
  setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
};

// NEW
const handleDeleteChat = async (chatId: string) => {
  await deleteSession(chatId);
  // Hook automatically updates sessions state
};
```

### 4. Update handleClearHistory

```typescript
// OLD
const handleClearHistory = () => {
  setChatHistory([]);
  localStorage.removeItem(`chat-history-${user.id}`);
};

// NEW
const handleClearHistory = async () => {
  await deleteAllSessions();
  // Hook automatically updates sessions state
};
```

### 5. Update handleRenameChat

```typescript
// OLD
const handleRenameChat = (chatId: string, newTitle: string) => {
  setChatHistory((prev) =>
    prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
  );
};

// NEW
const handleRenameChat = async (chatId: string, newTitle: string) => {
  await updateTitle(chatId, newTitle);
  // Hook automatically updates sessions state
};
```

### 6. Add Migration Prompt UI

```typescript
{
  showMigrationPrompt && (
    <Alert className="mb-4">
      <Cloud className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">Upgrade to Cloud Storage</p>
          <p className="text-sm text-muted-foreground">
            You have {getLocalChatHistoryCount(user.id)} chat sessions stored
            locally. Migrate them to cloud storage for access across all your
            devices.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMigrationPrompt(false)}
          >
            Later
          </Button>
          <Button size="sm" onClick={handleMigration} disabled={isMigrating}>
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Cloud className="mr-2 h-4 w-4" />
                Migrate Now
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

## Testing Checklist

### Before Migration

- [ ] Verify localStorage chat history loads
- [ ] Verify new chats work
- [ ] Verify chat history displays

### After Integration

- [ ] Migration prompt appears for users with localStorage data
- [ ] Migration successfully moves data to DynamoDB
- [ ] New chats save to server
- [ ] Loading chats works from server
- [ ] Renaming chats updates server
- [ ] Deleting chats removes from server
- [ ] Clear history removes all from server
- [ ] Chat history syncs across devices

## Migration Flow

1. **User opens assistant page**
2. **Check for localStorage data**
   - If found: Show migration prompt
   - If not: Use server data normally
3. **User clicks "Migrate Now"**
   - Read localStorage data
   - Save each session to DynamoDB
   - Clear localStorage
   - Reload page
4. **Future sessions**
   - All saves go to DynamoDB
   - All loads come from DynamoDB
   - Cross-device sync works

## Benefits After Integration

✅ **Cross-Device Sync** - Access chats from any device
✅ **Never Lost** - Survives cache clears
✅ **Searchable** - Can add search later
✅ **Analytics** - Can track usage
✅ **Backup** - Automatic DynamoDB backup

## Files Modified

- `src/app/(app)/assistant/page.tsx` - Partially updated
  - ✅ Imports added
  - ✅ Hook integrated
  - ✅ Migration logic added
  - ⏳ Handler functions need updating
  - ⏳ UI needs migration prompt

## Next Steps

1. **Complete handler function updates** (30 minutes)

   - handleNewChat
   - handleLoadChat
   - handleDeleteChat
   - handleClearHistory
   - handleRenameChat

2. **Add migration prompt UI** (15 minutes)

   - Alert component
   - Migration button
   - Progress state

3. **Test thoroughly** (30 minutes)

   - Test with localStorage data
   - Test migration
   - Test new chats
   - Test cross-device

4. **Deploy** (5 minutes)
   - Push changes
   - Monitor for issues

**Total Time**: ~1.5 hours to complete

## Quick Complete Script

Want me to finish the integration? I can:

1. Update all handler functions
2. Add migration prompt UI
3. Test the changes
4. Create a deployment checklist

Just say "complete the assistant integration" and I'll finish it!
