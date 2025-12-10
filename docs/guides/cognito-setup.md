# Cognito User Pool Client Configuration

## Current Production Settings

### User Pool
- **User Pool ID**: `us-west-2_ALOcJxQDd`
- **Region**: `us-west-2`

### User Pool Client
- **Client Name**: `bayon-coagent-web-v2-production`
- **Client ID**: `1vnmp9v58opg04o480fokp0sct`

### Authentication Flows (ExplicitAuthFlows)
- ✅ `ALLOW_USER_PASSWORD_AUTH` - Username/password authentication
- ✅ `ALLOW_USER_SRP_AUTH` - Secure Remote Password (recommended)
- ✅ `ALLOW_REFRESH_TOKEN_AUTH` - Token refresh

### Token Validity
- **Access Token**: 60 minutes
- **ID Token**: 60 minutes
- **Refresh Token**: 30 days

### OAuth Configuration
**Allowed OAuth Flows:**
- `code` (Authorization Code Grant)

**Allowed OAuth Scopes:**
- `email`
- `openid`
- `profile`

**Callback URLs:**
- `http://localhost:3000/oauth/callback` (Development)
- `https://bayoncoagent.app/oauth/callback` (Production)
- `https://dev.d2en4qzqmti675.amplifyapp.com/oauth/callback` (Staging)

**Logout URLs:**
- `http://localhost:3000` (Development)
- `https://bayoncoagent.app` (Production)
- `https://dev.d2en4qzqmti675.amplifyapp.com` (Staging)

## Quick Commands

### View Client Configuration
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct \
  --region us-west-2
```

### Update Auth Flows
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct \
  --region us-west-2 \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH
```

### Add New Callback URL
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct \
  --region us-west-2 \
  --callback-urls \
    "http://localhost:3000/oauth/callback" \
    "https://bayoncoagent.app/oauth/callback" \
    "https://dev.d2en4qzqmti675.amplifyapp.com/oauth/callback" \
    "https://your-new-url.com/oauth/callback"
```

## Environment Variables

### Production (AWS Amplify)
```
NEXT_PUBLIC_USER_POOL_ID=us-west-2_ALOcJxQDd
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
NEXT_PUBLIC_REGION=us-west-2
NEXT_PUBLIC_IDENTITY_POOL_ID=us-west-2:dedcf50e-9038-43bd-b11a-6e3651dc9c8d
```

### Local Development (.env.local)
```
COGNITO_USER_POOL_ID=us-west-2_ALOcJxQDd
COGNITO_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
AWS_REGION=us-west-2

# OR use NEXT_PUBLIC_ prefix (works both ways)
NEXT_PUBLIC_USER_POOL_ID=us-west-2_ALOcJxQDd
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
NEXT_PUBLIC_REGION=us-west-2
```

## Troubleshooting

### Error: "clientId validation failed"
**Cause**: Environment variables not set correctly  
**Fix**: Ensure `NEXT_PUBLIC_USER_POOL_CLIENT_ID` is set in Amplify or `COGNITO_CLIENT_ID` locally

### Error: "USER_PASSWORD_AUTH flow not enabled"
**Cause**: Auth flow not enabled in Cognito client  
**Fix**: Run the update command to enable `ALLOW_USER_PASSWORD_AUTH`

### Error: "NotAuthorizedException"
**Possible causes**:
1. Incorrect credentials
2. User not confirmed
3. User doesn't exist

### Error: "Invalid redirect URI"
**Cause**: Callback URL not in allowed list  
**Fix**: Add the URL to callback URLs using the update command

## Security Best Practices

1. **Use SRP Auth Flow**: `ALLOW_USER_SRP_AUTH` is more secure than direct password auth
2. **Enable Token Revocation**: Already enabled (`EnableTokenRevocation: true`)
3. **Prevent User Existence Errors**: Already enabled (`PreventUserExistenceErrors: ENABLED`)
4. **Use HTTPS**: All production URLs should use HTTPS
5. **Limit Callback URLs**: Only add trusted domains
6. **Regular Token Rotation**: 60-minute access tokens encourage regular refresh

## Monitoring

### Check Recent Sign-ins
```bash
aws cognito-idp admin-list-user-auth-events \
  --user-pool-id us-west-2_ALOcJxQDd \
  --username <user-email> \
  --region us-west-2
```

### List Users
```bash
aws cognito-idp list-users \
  --user-pool-id us-west-2_ALOcJxQDd \
  --region us-west-2
```

## Related Documentation
- [AWS Cognito User Pool Client](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Authentication Flows](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [OAuth 2.0 Grants](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
