# Subscription System

The Bayon CoAgent subscription system provides a comprehensive freemium model with 7-day professional trials, automated notifications, and seamless upgrade flows.

## Overview

The subscription system supports:

- **Freemium Model**: Free tier with limited features
- **7-Day Professional Trials**: Full access to premium features
- **Automated Trial Management**: Email notifications and expiry handling
- **Stripe Integration**: Secure payment processing via EventBridge
- **Usage Tracking**: Monthly limits and feature gates

## Architecture

### Components

1. **Frontend**: React components for subscription management
2. **API Routes**: Next.js API routes for subscription operations
3. **Lambda Functions**: Automated background processing
4. **EventBridge**: Event-driven architecture for Stripe integration
5. **DynamoDB**: Subscription data storage
6. **AWS SES**: Email notification delivery

### Data Flow

```
User Signs Up → 7-Day Trial Starts → Daily Trial Check → Email Notifications → Trial Expires → Free Tier
                                                     ↓
                                              User Upgrades → Stripe Payment → EventBridge → Update Subscription
```

## Trial Notifications System

### Lambda Function: `trial-notifications.ts`

**Purpose**: Automated trial expiry notifications and subscription management

**Schedule**: Daily at 12:00 PM UTC (`cron(0 12 * * ? *)`)

**Process Flow**:

1. **Scan Subscriptions**: Query DynamoDB for users with active trials
2. **Calculate Days Remaining**: Determine trial expiry timeline
3. **Send Notifications**: 
   - 3-day warning with upgrade encouragement
   - 1-day final warning with urgency messaging
4. **Handle Expired Trials**: Update subscription status to free tier
5. **Return Summary**: Processing results for monitoring

### Email Templates

**3-Day Warning Email**:
- Professional HTML design with responsive layout
- Clear trial expiry date and remaining time
- Prominent upgrade call-to-action button
- Feature benefits reminder
- Support contact information

**1-Day Final Warning**:
- Urgent messaging with countdown
- Last chance upgrade opportunity
- Feature access timeline explanation
- Direct upgrade link with user context

### Configuration

**Environment Variables**:
```bash
DYNAMODB_TABLE_NAME=BayonCoAgent-{Environment}
SES_REGION=us-west-2
FROM_EMAIL=noreply@bayoncoagent.app
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

**IAM Permissions**:
- DynamoDB: Scan, Query, UpdateItem
- SES: SendEmail, SendRawEmail
- CloudWatch: Logs and metrics

**Dead Letter Queue**: Failed notifications are sent to DLQ for retry processing

## Subscription States

### Trial States
- `trial_active`: 7-day trial in progress
- `trial_expired`: Trial ended, grace period
- `trial_converted`: Upgraded to paid plan

### Subscription States
- `free`: Free tier with limited features
- `professional`: Paid subscription with full access
- `cancelled`: Cancelled subscription with access until period end

## Feature Gates

Premium features are gated based on subscription status:

```typescript
// Example feature gate check
const canAccessFeature = user.subscriptionStatus === 'professional' || 
                        (user.subscriptionStatus === 'trial_active' && !isTrialExpired);
```

### Free Tier Limitations
- Limited AI generations per month
- Reduced storage capacity
- Basic support only
- Watermarked exports

### Professional Features
- Unlimited AI generations
- Full storage capacity
- Priority support
- White-label exports
- Advanced analytics

## Monitoring and Alerts

### CloudWatch Metrics
- Trial notification success/failure rates
- Email delivery metrics
- Subscription conversion rates
- Feature usage by tier

### Alarms
- High notification failure rate
- SES bounce/complaint rates
- Lambda function errors
- DynamoDB throttling

## API Endpoints

### Subscription Management
- `GET /api/subscription/status` - Current subscription status
- `POST /api/subscription/upgrade` - Initiate upgrade flow
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/usage` - Current usage metrics

### Admin Endpoints
- `GET /api/admin/subscription-analytics` - Business metrics
- `POST /api/admin/subscription/extend-trial` - Extend user trial
- `GET /api/admin/subscription/notifications` - Notification history

## Testing

### Local Testing
```bash
# Test trial notification function locally
npm run test:trial-notifications

# Verify email templates
npm run test:email-templates

# Check subscription status
npm run test:subscription-status
```

### Production Monitoring
```bash
# Check Lambda function logs
aws logs tail /aws/lambda/bayon-coagent-trial-notifications-production --follow

# Monitor SES metrics
aws ses get-send-statistics

# View subscription analytics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://bayoncoagent.app/api/admin/subscription-analytics
```

## Deployment

The trial notifications system is automatically deployed as part of the main infrastructure:

```bash
# Deploy with SAM
npm run sam:deploy:prod

# Verify deployment
npm run verify:trial-notifications
```

### Manual Configuration

If deploying manually, ensure:

1. **SES Configuration**: Verify sending domain and email addresses
2. **EventBridge Rule**: Confirm daily schedule is active
3. **DynamoDB Access**: Validate table permissions
4. **Environment Variables**: Set all required variables

## Troubleshooting

### Common Issues

**Notifications Not Sending**:
- Check SES sending limits and reputation
- Verify FROM_EMAIL is verified in SES
- Review Lambda function logs for errors

**Incorrect Trial Calculations**:
- Validate DynamoDB trial data format
- Check timezone handling in date calculations
- Verify subscription status updates

**High Bounce Rates**:
- Review email template formatting
- Check recipient email validation
- Monitor SES reputation metrics

### Debug Commands

```bash
# Check SES sending quota
aws ses get-send-quota

# View recent Lambda invocations
aws lambda get-function --function-name bayon-coagent-trial-notifications-production

# Query trial subscriptions
aws dynamodb scan --table-name BayonCoAgent-production \
  --filter-expression "begins_with(SK, :sk)" \
  --expression-attribute-values '{":sk":{"S":"SUBSCRIPTION"}}'
```

## Future Enhancements

### Planned Features
- **Personalized Notifications**: Custom messaging based on user behavior
- **A/B Testing**: Email template optimization
- **Advanced Segmentation**: Targeted campaigns by user type
- **Integration Webhooks**: Third-party notification systems
- **SMS Notifications**: Multi-channel communication

### Performance Optimizations
- **Batch Processing**: Group notifications for efficiency
- **Caching**: Reduce DynamoDB queries
- **Rate Limiting**: Respect SES sending limits
- **Retry Logic**: Exponential backoff for failures

## Security Considerations

- **Email Validation**: Prevent spam and abuse
- **Rate Limiting**: Protect against notification flooding
- **Data Privacy**: Comply with email marketing regulations
- **Access Control**: Secure admin endpoints
- **Audit Logging**: Track all subscription changes

## Related Documentation

- [Stripe Integration](./stripe-integration.md)
- [Email Service](./email-service.md)
- [Lambda Functions](../lambda/README.md)
- [Deployment Guide](../deployment/deployment.md)
- [Monitoring Guide](../deployment/monitoring.md)