# DynamoDB React Hooks

React hooks for accessing DynamoDB data with real-time updates via polling. These hooks provide an interface similar to Firebase's `useDoc` and `useCollection` hooks, making migration easier.

## Features

- **Real-time updates**: Optional polling mechanism for detecting data changes
- **Caching**: Built-in caching layer to reduce redundant API calls
- **Loading states**: Automatic loading and error state management
- **Pagination**: Support for loading more items with `loadMore()`
- **Type-safe**: Full TypeScript support with generics
- **Memoization**: Requires memoized parameters to prevent infinite loops

## Hooks

### `useItem<T>`

Fetches and optionally polls a single DynamoDB item.

**Parameters:**

- `pk: string | null | undefined` - Partition key (must be memoized)
- `sk: string | null | undefined` - Sort key (must be memoized)
- `options?: UseItemOptions` - Configuration options

**Options:**

- `enablePolling?: boolean` - Enable polling for real-time updates (default: `false`)
- `pollingInterval?: number` - Polling interval in milliseconds (default: `5000`)
- `fetchOnMount?: boolean` - Fetch immediately on mount (default: `true`)
- `enableCache?: boolean` - Enable caching (default: `true`)
- `cacheTTL?: number` - Cache TTL in milliseconds (default: `30000`)

**Returns:**

- `data: WithId<T> | null` - Item data with ID field
- `isLoading: boolean` - Loading state
- `error: DynamoDBError | Error | null` - Error object
- `refetch: () => Promise<void>` - Manual refetch function

**Example:**

```tsx
import { useItem } from "@/aws/dynamodb";
import { useMemo } from "react";

function UserProfile({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const sk = useMemo(() => "PROFILE", []);

  const { data, isLoading, error } = useItem<UserProfile>(pk, sk);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Not found</div>;

  return <div>{data.name}</div>;
}
```

**With polling:**

```tsx
const { data, isLoading, error } = useItem<AgentProfile>(pk, sk, {
  enablePolling: true,
  pollingInterval: 3000, // Poll every 3 seconds
});
```

### `useQuery<T>`

Queries DynamoDB items with optional polling and pagination.

**Parameters:**

- `pk: string | null | undefined` - Partition key (must be memoized)
- `skPrefix?: string | null | undefined` - Optional sort key prefix for filtering (must be memoized)
- `config?: UseQueryConfig` - Configuration options

**Options:**

- `enablePolling?: boolean` - Enable polling for real-time updates (default: `false`)
- `pollingInterval?: number` - Polling interval in milliseconds (default: `5000`)
- `fetchOnMount?: boolean` - Fetch immediately on mount (default: `true`)
- `autoLoadAll?: boolean` - Automatically load all items (default: `false`)
- `enableCache?: boolean` - Enable caching (default: `true`)
- `cacheTTL?: number` - Cache TTL in milliseconds (default: `30000`)
- `limit?: number` - Maximum number of items per query
- `scanIndexForward?: boolean` - Scan direction (default: `true`)
- `filterExpression?: string` - DynamoDB filter expression
- `expressionAttributeValues?: Record<string, any>` - Expression attribute values
- `expressionAttributeNames?: Record<string, string>` - Expression attribute names

**Returns:**

- `data: WithId<T>[] | null` - Array of items with ID fields
- `isLoading: boolean` - Loading state
- `error: DynamoDBError | Error | null` - Error object
- `refetch: () => Promise<void>` - Manual refetch function
- `hasMore: boolean` - Whether more items are available
- `loadMore: () => Promise<void>` - Load more items (pagination)

**Example:**

```tsx
import { useQuery } from "@/aws/dynamodb";
import { useMemo } from "react";

function SavedContentList({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const skPrefix = useMemo(() => "CONTENT#", []);

  const { data, isLoading, error, hasMore, loadMore } = useQuery<SavedContent>(
    pk,
    skPrefix,
    { limit: 20 }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No content</div>;

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

**With polling:**

```tsx
const { data, isLoading, error } = useQuery<Project>(pk, skPrefix, {
  enablePolling: true,
  pollingInterval: 5000, // Poll every 5 seconds
  limit: 20,
});
```

## Important Notes

### Memoization Required

**You MUST memoize the `pk` and `skPrefix` parameters using `useMemo`** to prevent infinite loops. The hooks will throw an error if you forget.

```tsx
// ✅ CORRECT
const pk = useMemo(() => `USER#${userId}`, [userId]);
const sk = useMemo(() => "PROFILE", []);
const { data } = useItem(pk, sk);

// ❌ WRONG - Will cause infinite loop
const { data } = useItem(`USER#${userId}`, "PROFILE");
```

### Caching

Both hooks include a built-in caching layer that:

- Reduces redundant API calls
- Improves performance
- Has a default TTL of 30 seconds
- Can be disabled or configured per hook

The cache is automatically invalidated when:

- The TTL expires
- You call `refetch()`
- The component unmounts

### Polling vs Real-time

Unlike Firebase's real-time listeners, these hooks use polling to detect changes. This means:

- Changes are detected at the polling interval (default 5 seconds)
- More frequent polling = more API calls = higher costs
- Consider using longer intervals (10-30 seconds) for non-critical data
- Disable polling for static data

### ID Extraction

Both hooks automatically add an `id` field to each item by extracting it from the sort key:

- `"AGENT#main"` → `id: "main"`
- `"CONTENT#abc123"` → `id: "abc123"`
- If no `#` is found, the entire SK is used as the ID

## Migration from Firebase

### useDoc → useItem

```tsx
// Firebase
import { useDoc } from "@/firebase/firestore/use-doc";
const docRef = useMemo(
  () => doc(db, "users", userId, "profile", "main"),
  [userId]
);
const { data, isLoading, error } = useDoc(docRef);

// DynamoDB
import { useItem } from "@/aws/dynamodb";
const pk = useMemo(() => `USER#${userId}`, [userId]);
const sk = useMemo(() => "PROFILE", []);
const { data, isLoading, error } = useItem(pk, sk);
```

### useCollection → useQuery

```tsx
// Firebase
import { useCollection } from "@/firebase/firestore/use-collection";
const collectionRef = useMemo(
  () => collection(db, "users", userId, "content"),
  [userId]
);
const { data, isLoading, error } = useCollection(collectionRef);

// DynamoDB
import { useQuery } from "@/aws/dynamodb";
const pk = useMemo(() => `USER#${userId}`, [userId]);
const skPrefix = useMemo(() => "CONTENT#", []);
const { data, isLoading, error } = useQuery(pk, skPrefix);
```

## Performance Tips

1. **Use caching**: Keep `enableCache: true` (default) for frequently accessed data
2. **Adjust polling intervals**: Use longer intervals for non-critical data
3. **Disable polling**: Turn off polling for static data
4. **Use pagination**: Set `limit` to avoid loading too much data at once
5. **Memoize dependencies**: Always memoize `pk`, `sk`, and `skPrefix` parameters

## Error Handling

Both hooks return DynamoDB-specific errors that include:

- `code`: Error code (e.g., 'ItemNotFound', 'ValidationException')
- `statusCode`: HTTP status code
- `retryable`: Whether the error is retryable
- `message`: Human-readable error message

```tsx
const { data, error } = useItem(pk, sk);

if (error) {
  if (error instanceof DynamoDBError) {
    console.log("Error code:", error.code);
    console.log("Retryable:", error.retryable);
  }
  // Handle error
}
```
