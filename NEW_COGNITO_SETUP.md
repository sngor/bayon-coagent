# New Cognito User Pool Setup

## After creating the new User Pool, update these files:

### 1. Update src/aws/auth/cognito-client.ts
Replace the hardcoded values with your new ones:

```typescript
// HARDCODED VALUES - NO CONFIGURATION DEPENDENCIES
const region = 'us-west-2';
const clientId = 'YOUR_NEW_CLIENT_ID';  // Replace this
const userPoolId = 'YOUR_NEW_USER_POOL_ID';  // Replace this
```

### 2. Update src/aws/config.ts
Replace in the cognito and clientCognito sections:

```typescript
cognito: {
  userPoolId: 'YOUR_NEW_USER_POOL_ID',  // Replace this
  clientId: 'YOUR_NEW_CLIENT_ID',  // Replace this
  endpoint: isLocal ? 'http://localhost:4566' : undefined,
},

clientCognito: {
  userPoolId: 'YOUR_NEW_USER_POOL_ID',  // Replace this
  clientId: 'YOUR_NEW_CLIENT_ID',  // Replace this
  endpoint: isLocal ? 'http://localhost:4566' : undefined,
},
```

### 3. Update Amplify Environment Variables
In your Amplify Console, update:

```
NEXT_PUBLIC_USER_POOL_ID=YOUR_NEW_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_NEW_CLIENT_ID
COGNITO_USER_POOL_ID=YOUR_NEW_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_NEW_CLIENT_ID
```

### 4. Update .env.production
```
COGNITO_USER_POOL_ID=YOUR_NEW_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_NEW_CLIENT_ID
NEXT_PUBLIC_USER_POOL_ID=YOUR_NEW_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_NEW_CLIENT_ID
```

## Why This Will Work

- **Fresh User Pool**: No legacy configuration issues
- **Correct Region**: Created directly in us-west-2
- **Clean Start**: No cached or conflicting settings

This should take about 10 minutes total and will definitely solve the issue.