# Billing API Documentation

## Overview

The Billing API provides comprehensive billing management capabilities for super administrators, including metrics, analytics, search, and promotion management.

## Authentication

All billing endpoints require super admin authentication. Include the user's access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### GET /api/admin/billing/analytics

Retrieves comprehensive billing analytics data.

**Query Parameters:**

- `timeRange` (optional): Time range for analytics. Options: `7d`, `30d`, `90d`, `1y`. Default: `30d`

**Response:**

```json
{
  "success": true,
  "data": {
    "revenueGrowth": {
      "current": 125000,
      "previous": 110000,
      "percentageChange": 13.6
    },
    "subscriptionGrowth": {
      "newSubscriptions": 45,
      "canceledSubscriptions": 12,
      "netGrowth": 33
    },
    "paymentMetrics": {
      "successRate": 94.2,
      "failureRate": 5.8,
      "retrySuccessRate": 67.3
    },
    "trends": [
      {
        "date": "2024-12-01",
        "revenue": 4200,
        "subscriptions": 156,
        "churn": 2.1
      }
    ]
  },
  "meta": {
    "timeRange": "30d",
    "generatedAt": "2024-12-10T10:30:00Z",
    "requestedBy": "user_123"
  }
}
```

### GET /api/admin/promotions

Manages promotional campaigns and seasonal suggestions.

**Query Parameters:**

- `action`: Required. Options: `seasonal-suggestions`, `active`

**Response for `seasonal-suggestions`:**

```json
{
  "success": true,
  "suggestions": [
    {
      "season": "spring_buying",
      "title": "Spring Home Buying Season",
      "description": "Target agents preparing for the busy spring market",
      "suggestedDiscount": 25,
      "targetMonths": [3, 4, 5],
      "marketingMessage": "Spring into success with our seasonal agent discount!"
    }
  ]
}
```

### POST /api/admin/promotions

Creates or manages promotional campaigns.

**Request Body for creating seasonal promotion:**

```json
{
  "action": "create-seasonal",
  "seasonType": "spring_buying",
  "customDiscount": 30
}
```

**Response:**

```json
{
  "success": true,
  "campaign": {
    "id": "campaign_1702123456789",
    "name": "Spring Home Buying Season",
    "couponId": "coupon_abc123",
    "discountValue": 30,
    "isActive": true
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional error details
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Rate Limiting

Billing API endpoints are rate limited to prevent abuse:

- 100 requests per minute per user
- 1000 requests per hour per user

## Caching

Analytics data is cached for performance:

- Dashboard metrics: 5 minutes
- Analytics data: 15 minutes
- Search results: 2 minutes

## Real Estate Context

The billing system is specifically designed for real estate agent platforms:

### Seasonal Promotions

- **Spring Buying Season** (March-May): Peak market activity
- **Summer Peak** (June-August): Maximum listing activity
- **Fall Market** (September-November): Opportunity capture
- **Winter Planning** (December-February): Annual planning and renewals

### Agent-Specific Metrics

- **ARPU**: Average Revenue Per User (real estate agent)
- **LTV**: Customer Lifetime Value for agent subscriptions
- **Churn Rate**: Agent subscription cancellation rate
- **Conversion Rate**: Trial to paid agent conversion

### Integration Points

- **Stripe**: Payment processing and subscription management
- **AWS DynamoDB**: User profile and subscription data storage
- **CloudWatch**: Billing metrics and alerting

## Examples

### Get 90-day analytics

```bash
curl -X GET "https://api.example.com/api/admin/billing/analytics?timeRange=90d" \
  -H "Authorization: Bearer <token>"
```

### Create spring promotion

```bash
curl -X POST "https://api.example.com/api/admin/promotions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-seasonal",
    "seasonType": "spring_buying",
    "customDiscount": 25
  }'
```

### Get seasonal suggestions

```bash
curl -X GET "https://api.example.com/api/admin/promotions?action=seasonal-suggestions" \
  -H "Authorization: Bearer <token>"
```
