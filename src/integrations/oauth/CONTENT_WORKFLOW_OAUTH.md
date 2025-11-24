# Content Workflow OAuth Integration

Enhanced OAuth 2.0 integration for content workflow features including scheduling, analytics, and performance tracking.

## Overview

This enhanced OAuth integration extends the existing social media connections to support:

- **Scheduling**: Post content at optimal times across platforms
- **Analytics**: Access comprehensive engagement metrics and insights
- **Performance Tracking**: Monitor ROI and content effectiveness
- **A/B Testing**: Compare content variations with statistical analysis

## Enhanced Scopes

### Facebook

- `pages_manage_posts` - Schedule and publish posts
- `pages_show_list` - Access Facebook pages
- `public_profile` - Basic profile information
- `pages_read_engagement` - Read engagement metrics
- `read_insights` - Access Facebook Insights data
- `pages_read_user_content` - Read page content for analytics
- `business_management` - Access business account data

### Instagram

- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Schedule and publish content
- `pages_show_list` - Access connected pages
- `pages_read_engagement` - Read engagement metrics
- `instagram_manage_insights` - Access Instagram Insights
- `read_insights` - Read insights data
- `business_management` - Access business account data

### LinkedIn

- `w_member_social` - Post on behalf of member
- `r_basicprofile` - Read basic profile
- `w_organization_social` - Post on behalf of organization
- `r_organization_social` - Read organization posts
- `r_organization_admin` - Access organization admin data
- `rw_organization_admin` - Manage organization settings
- `r_analytics` - Access LinkedIn Analytics
- `r_organization_followers_statistics` - Read follower statistics
- `r_organization_lookup` - Look up organization data

### Twitter

- `tweet.read` - Read tweets
- `tweet.write` - Post tweets
- `users.read` - Read user information
- `offline.access` - Maintain access when offline
- `tweet.moderate.write` - Moderate tweets
- `follows.read` - Read follow relationships
- `follows.write` - Manage follows
- `space.read` - Access Twitter Spaces
- `mute.read` - Read mute settings
- `mute.write` - Manage mute settings
- `block.read` - Read block settings
- `block.write` - Manage block settings

## Available Analytics Metrics

### Facebook

- Post impressions (total and unique)
- Engaged users
- Post clicks
- Reactions (like, love, wow, haha, sorry, anger)
- Comments and shares
- Video views (total and unique)

### Instagram

- Impressions and reach
- Engagement metrics
- Likes, comments, shares, saves
- Video views
- Profile visits
- Website clicks

### LinkedIn

- Impressions and clicks
- Reactions, comments, shares
- Follows and engagement
- Video views
- Unique impressions
- Click-through rate

### Twitter

- Impression count
- Like, reply, retweet, quote counts
- Bookmark count
- URL link clicks
- User profile clicks
- Public metrics

## Usage

### Server Actions

```typescript
import {
  initiateContentWorkflowConnection,
  validateAnalyticsAccess,
  getConnectionStatus,
  getAllConnectionStatuses,
  refreshConnectionToken,
  disconnectContentWorkflowConnection,
} from "@/app/content-workflow-oauth-actions";

// Initiate connection with analytics scopes
const result = await initiateContentWorkflowConnection({
  platform: "facebook",
});

// Validate analytics access
const validation = await validateAnalyticsAccess({
  platform: "facebook",
});

// Get connection status
const status = await getConnectionStatus({
  platform: "facebook",
});
```

### OAuth Connection Manager

```typescript
import { getOAuthConnectionManager } from "@/integrations/oauth";

const manager = getOAuthConnectionManager();

// Validate analytics access
const analyticsValidation = await manager.validateAnalyticsAccess(
  userId,
  "facebook"
);

// Get connection for analytics
const connection = await manager.getConnectionForAnalytics(userId, "facebook");
```

## API Endpoints

### Analytics API Endpoints

- **Facebook**: `https://graph.facebook.com/v18.0`
- **Instagram**: `https://graph.facebook.com/v18.0`
- **LinkedIn**: `https://api.linkedin.com/v2`
- **Twitter**: `https://api.twitter.com/2`

### OAuth Callback Routes

- **Facebook**: `/api/oauth/facebook/callback`
- **Instagram**: `/api/oauth/instagram/callback`
- **LinkedIn**: `/api/oauth/linkedin/callback`
- **Twitter**: `/api/oauth/twitter/callback`

## Enhanced Callback Handling

All callback routes now include:

1. **Analytics Validation**: Verify analytics access after connection
2. **Metrics Information**: Report available metrics to the user
3. **Error Handling**: Detailed error reporting for analytics issues
4. **Success Feedback**: Clear indication of analytics capabilities

### Callback Response Parameters

Success responses include:

- `success=platform_connected` - Connection successful
- `platform=platform_name` - Connected platform
- `analytics=enabled|limited` - Analytics access status
- `metrics=count` - Number of available metrics
- `analytics_error=message` - Analytics error details (if any)

## Token Management

### Automatic Refresh

Tokens are automatically refreshed when:

- Token expires within 5 minutes
- Analytics API calls fail due to expired tokens
- User requests token refresh

### Analytics-Specific Validation

The system validates:

- Token has required analytics scopes
- API endpoints are accessible
- Metrics can be retrieved
- Rate limits are respected

## Error Handling

### Common Errors

1. **Insufficient Scopes**: User didn't grant analytics permissions
2. **Token Expired**: Access token needs refresh
3. **API Rate Limits**: Too many requests to platform APIs
4. **Platform Errors**: Social media platform API issues

### Error Recovery

- Automatic token refresh for expired tokens
- Exponential backoff for rate limit errors
- Clear user messaging for scope issues
- Fallback to basic functionality when analytics unavailable

## Security Considerations

### Token Storage

- Tokens encrypted at rest in DynamoDB
- Automatic token rotation
- Secure token transmission
- Audit logging for token access

### Scope Validation

- Verify required scopes before API calls
- Graceful degradation for missing scopes
- User notification of limited functionality
- Re-authorization prompts when needed

## Testing

### Analytics Validation Tests

```typescript
// Test analytics access
const validation = await manager.validateAnalyticsAccess(userId, "facebook");
expect(validation.hasAccess).toBe(true);
expect(validation.availableMetrics).toContain("post_impressions");

// Test connection for analytics
const connection = await manager.getConnectionForAnalytics(userId, "facebook");
expect(connection).toBeTruthy();
expect(connection.scope).toContain("read_insights");
```

### Integration Tests

- OAuth flow with analytics scopes
- Token refresh with analytics validation
- API access with enhanced permissions
- Error handling for analytics failures

## Monitoring

### CloudWatch Metrics

- OAuth connection success/failure rates
- Analytics validation success rates
- Token refresh frequency
- API call success rates by platform

### Alerts

- High OAuth failure rates
- Analytics access issues
- Token refresh failures
- API rate limit violations

## Enhanced Features (Implemented)

### Security Enhancements

- **AWS KMS Token Encryption**: Production-ready token encryption using AWS KMS
- **Distributed State Storage**: DynamoDB-based OAuth state storage for production scalability
- **Enhanced Error Handling**: Comprehensive error handling with specific error messages
- **Connection Health Monitoring**: Real-time health scoring and issue detection

### Monitoring and Analytics

- **Health Status API**: Comprehensive health monitoring for all platform connections
- **Performance Metrics**: API call duration and success rate tracking
- **Proactive Alerts**: Automatic detection of token expiration and connection issues
- **Analytics Validation**: Real-time validation of analytics API access

### Enhanced Methods

```typescript
// Get comprehensive health status
const healthStatus = await getAnalyticsHealthStatus();

// Enhanced disconnect by connection ID
await manager.disconnect(connectionId);

// Disconnect by user and platform
await manager.disconnectByUserAndPlatform(userId, platform);
```

## Future Enhancements

### Planned Features

- Real-time analytics webhooks
- Advanced metrics aggregation
- Cross-platform analytics comparison
- Predictive analytics insights

### Additional Platforms

- TikTok analytics integration
- Pinterest analytics support
- YouTube analytics access
- Snapchat analytics integration

## Requirements Validation

This implementation satisfies:

- **Requirement 8.1**: OAuth integration with analytics API permissions
- **Enhanced Security**: Secure token storage and refresh mechanisms
- **Comprehensive Coverage**: All major social media platforms
- **Error Resilience**: Robust error handling and recovery
- **User Experience**: Clear feedback and status reporting

## Migration Guide

### From Basic OAuth

1. Update OAuth scopes in environment variables
2. Re-authorize existing connections for analytics access
3. Update client code to use new analytics methods
4. Test analytics validation and token refresh

### Environment Variables

```env
# Existing variables remain the same
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# New variables for enhanced features
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Enhanced security and scalability (optional)
KMS_KEY_ID=your_kms_key_id_for_token_encryption
USE_DYNAMODB_STATE_STORAGE=true  # Use DynamoDB for OAuth state storage in production
AWS_REGION=us-east-1  # AWS region for KMS and DynamoDB
```

## Support

For issues with OAuth integration:

1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure platform apps have required permissions
4. Test with OAuth debugging tools
5. Review platform-specific documentation for scope changes
