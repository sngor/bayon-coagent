# AgentStrands API Documentation

This directory contains REST API endpoints for the AgentStrands enhancement features including feedback collection, opportunity management, analytics, and collaborative editing.

## Table of Contents

- [Feedback API](#feedback-api)
- [Opportunities API](#opportunities-api)
- [Analytics API](#analytics-api)
- [Editing Sessions API](#editing-sessions-api)

---

## Feedback API

### Submit Feedback

**Endpoint:** `POST /api/agentstrands/feedback`

Submit user feedback for strand-generated content.

**Request Body:**

```json
{
  "taskId": "string (required)",
  "strandId": "string (required)",
  "feedbackType": "rating | edit | engagement (required)",
  "rating": "number (1-5, required for rating type)",
  "edits": {
    "sectionsModified": ["string"],
    "changeType": "addition | deletion | modification",
    "editDuration": "number",
    "timestamp": "string"
  },
  "engagement": {
    "views": "number",
    "clicks": "number",
    "shares": "number",
    "conversions": "number",
    "timeOnPage": "number (optional)"
  },
  "metadata": "object (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "feedbackId": "string",
  "message": "Feedback recorded successfully"
}
```

### Retrieve Feedback

**Endpoint:** `GET /api/agentstrands/feedback`

Retrieve feedback records with optional filters.

**Query Parameters:**

- `taskId` (optional): Filter by task ID
- `strandId` (optional): Filter by strand ID
- `feedbackType` (optional): Filter by feedback type (rating, edit, engagement)
- `limit` (optional): Maximum number of records (default: 50)

**Response:**

```json
{
  "feedbackRecords": [
    {
      "id": "string",
      "userId": "string",
      "taskId": "string",
      "strandId": "string",
      "feedbackType": "string",
      "rating": "number (optional)",
      "edits": "object (optional)",
      "engagement": "object (optional)",
      "timestamp": "string",
      "metadata": "object"
    }
  ],
  "count": "number"
}
```

---

## Opportunities API

### Get Opportunities

**Endpoint:** `GET /api/agentstrands/opportunities`

Retrieve opportunities for the current user.

**Query Parameters:**

- `status` (optional): Filter by status (new, viewed, acted-on, dismissed)
- `type` (optional): Filter by type (trend, gap, timing, competitive)
- `limit` (optional): Maximum number of records (default: 50)

**Response:**

```json
{
  "opportunities": [
    {
      "id": "string",
      "userId": "string",
      "opportunity": {
        "id": "string",
        "type": "trend | gap | timing | competitive",
        "title": "string",
        "description": "string",
        "potentialImpact": "number",
        "confidence": "number",
        "supportingData": ["any"],
        "expiresAt": "string (optional)"
      },
      "status": "new | viewed | acted-on | dismissed",
      "suggestions": ["object"],
      "createdAt": "string",
      "expiresAt": "string (optional)",
      "outcome": {
        "action": "string",
        "result": "string",
        "impact": "number"
      }
    }
  ],
  "count": "number"
}
```

### Create Opportunity

**Endpoint:** `POST /api/agentstrands/opportunities`

Create a new opportunity record.

**Request Body:**

```json
{
  "opportunity": {
    "type": "trend | gap | timing | competitive (required)",
    "title": "string (required)",
    "description": "string",
    "potentialImpact": "number",
    "confidence": "number",
    "supportingData": ["any"]
  },
  "suggestions": ["object (optional)"],
  "expiresAt": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "opportunityId": "string",
  "opportunity": "object"
}
```

### Update Opportunity

**Endpoint:** `PATCH /api/agentstrands/opportunities`

Update opportunity status or outcome.

**Request Body:**

```json
{
  "opportunityId": "string (required)",
  "status": "new | viewed | acted-on | dismissed (optional)",
  "outcome": {
    "action": "string",
    "result": "string",
    "impact": "number"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Opportunity updated successfully"
}
```

---

## Analytics API

### Performance Analytics

**Endpoint:** `GET /api/agentstrands/analytics/performance`

Retrieve performance analytics for strands.

**Query Parameters:**

- `strandId` (optional): Filter by specific strand
- `timeframe` (optional): Time range (1h, 24h, 7d, 30d, 90d) (default: 7d)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**

```json
{
  "analytics": [
    {
      "strandId": "string",
      "totalTasks": "number",
      "totalRatings": "number",
      "avgRating": "number",
      "edits": "number",
      "engagements": "number"
    }
  ],
  "timeframe": "string",
  "count": "number"
}
```

### Record Performance Metrics

**Endpoint:** `POST /api/agentstrands/analytics/performance`

Record performance metrics for a strand.

**Request Body:**

```json
{
  "strandId": "string (required)",
  "metrics": {
    "executionTime": "number (required)",
    "tokenUsage": "number (required)",
    "cost": "number (required)",
    "successRate": "number (required)",
    "userSatisfaction": "number (required)",
    "qualityScore": "number (required)"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Performance metrics recorded successfully"
}
```

### Cost Analytics

**Endpoint:** `GET /api/agentstrands/analytics/cost`

Retrieve cost analytics by dimension.

**Query Parameters:**

- `dimension` (optional): Aggregation dimension (strand, user, task-type) (default: user)
- `timeframe` (optional): Time range (1h, 24h, 7d, 30d, 90d) (default: 30d)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**

```json
{
  "dimension": "string",
  "timeframe": "string",
  "breakdown": [
    {
      "dimension": "string",
      "totalCost": "number",
      "totalTokens": "number",
      "operationCount": "number",
      "operations": [
        {
          "timestamp": "string",
          "cost": "number",
          "tokens": "number",
          "operation": "string"
        }
      ]
    }
  ],
  "totals": {
    "totalCost": "number",
    "totalTokens": "number",
    "totalOperations": "number"
  }
}
```

### Record Cost

**Endpoint:** `POST /api/agentstrands/analytics/cost`

Record a cost operation.

**Request Body:**

```json
{
  "strandId": "string (optional)",
  "taskType": "string (optional)",
  "operation": "string (required)",
  "tokenUsage": "number (required)",
  "cost": "number (required)",
  "metadata": "object (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "costId": "string",
  "message": "Cost recorded successfully"
}
```

---

## Editing Sessions API

### Start Editing Session

**Endpoint:** `POST /api/agentstrands/editing/session`

Start a new editing session.

**Request Body:**

```json
{
  "contentId": "string (required)",
  "initialContent": "string (required)",
  "metadata": "object (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "sessionId": "string",
    "contentId": "string",
    "userId": "string",
    "versions": [
      {
        "versionNumber": 1,
        "content": "string",
        "timestamp": "string",
        "changes": "string"
      }
    ],
    "currentVersion": 1,
    "startedAt": "string",
    "lastActivityAt": "string",
    "status": "active",
    "metadata": "object"
  }
}
```

### Get Editing Session

**Endpoint:** `GET /api/agentstrands/editing/session`

Retrieve an editing session.

**Query Parameters:**

- `sessionId` (required): Session ID

**Response:**

```json
{
  "session": {
    "sessionId": "string",
    "contentId": "string",
    "userId": "string",
    "versions": ["array"],
    "currentVersion": "number",
    "startedAt": "string",
    "lastActivityAt": "string",
    "status": "string",
    "metadata": "object"
  }
}
```

### Update Editing Session

**Endpoint:** `PATCH /api/agentstrands/editing/session`

Update an editing session (add version, rollback, or change status).

**Request Body (Add Version):**

```json
{
  "sessionId": "string (required)",
  "action": "add-version",
  "content": "string (required)",
  "changes": "string (optional)"
}
```

**Request Body (Rollback):**

```json
{
  "sessionId": "string (required)",
  "action": "rollback",
  "targetVersion": "number (required)"
}
```

**Request Body (Update Status):**

```json
{
  "sessionId": "string (required)",
  "action": "update-status",
  "status": "active | completed | abandoned (required)"
}
```

**Response (Add Version):**

```json
{
  "success": true,
  "version": {
    "versionNumber": "number",
    "content": "string",
    "timestamp": "string",
    "changes": "string"
  }
}
```

**Response (Rollback):**

```json
{
  "success": true,
  "currentVersion": "number",
  "content": "string"
}
```

**Response (Update Status):**

```json
{
  "success": true,
  "status": "string"
}
```

### Delete Editing Session

**Endpoint:** `DELETE /api/agentstrands/editing/session`

Delete an editing session.

**Query Parameters:**

- `sessionId` (required): Session ID

**Response:**

```json
{
  "success": true,
  "message": "Editing session deleted successfully"
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

All endpoints require authentication. The current user is retrieved from the session using `getCurrentUserServer()`.

---

## Data Storage

All data is stored in DynamoDB using the following key patterns:

- **Feedback:** `PK: USER#${userId}`, `SK: FEEDBACK#${taskId}#${timestamp}`
- **Opportunities:** `PK: USER#${userId}`, `SK: OPPORTUNITY#${opportunityId}`
- **Performance:** `PK: STRAND#${strandId}`, `SK: PERF#${timestamp}`
- **Cost:** `PK: USER#${userId}`, `SK: COST#${timestamp}`
- **Editing Sessions:** `PK: USER#${userId}`, `SK: EDITING#${sessionId}`

---

## Usage Examples

### Submit Rating Feedback

```typescript
const response = await fetch("/api/agentstrands/feedback", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    taskId: "task-123",
    strandId: "strand-456",
    feedbackType: "rating",
    rating: 5,
    metadata: { contentType: "blog-post" },
  }),
});

const data = await response.json();
console.log(data.feedbackId);
```

### Get Opportunities

```typescript
const response = await fetch(
  "/api/agentstrands/opportunities?status=new&type=trend"
);
const data = await response.json();
console.log(data.opportunities);
```

### Start Editing Session

```typescript
const response = await fetch("/api/agentstrands/editing/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contentId: "content-789",
    initialContent: "Original content here...",
    metadata: { contentType: "listing-description" },
  }),
});

const data = await response.json();
console.log(data.session.sessionId);
```

### Get Cost Analytics

```typescript
const response = await fetch(
  "/api/agentstrands/analytics/cost?dimension=strand&timeframe=30d"
);
const data = await response.json();
console.log(data.breakdown);
```
