# Microservices Architecture API Reference

This document provides comprehensive API documentation for the microservices architecture enhancement services.

## Table of Contents

- [Feature Categorization Service](#feature-categorization-service)
- [Service Boundary Optimization Service](#service-boundary-optimization-service)
- [Advanced Monitoring Service](#advanced-monitoring-service)
- [Common Types](#common-types)
- [Error Handling](#error-handling)
- [Authentication](#authentication)

## Feature Categorization Service

The Feature Categorization Service analyzes existing features and categorizes them by their suitability for microservices architecture extraction.

### Base URL

```
/api/microservices/categorization
```

### Endpoints

#### Categorize Single Feature

```http
POST /api/microservices/categorization
```

**Request Body:**

```json
{
  "featureId": "string",
  "name": "string",
  "description": "string",
  "computationalRequirements": {
    "cpuIntensive": boolean,
    "memoryUsage": "low" | "medium" | "high",
    "ioOperations": "minimal" | "moderate" | "heavy",
    "processingTime": "fast" | "medium" | "slow",
    "concurrencyNeeds": number
  },
  "dataDependencies": [
    {
      "dependencyId": "string",
      "type": "database" | "external_api" | "file_system" | "cache" | "message_queue",
      "frequency": "rare" | "occasional" | "frequent" | "constant",
      "criticality": "low" | "medium" | "high",
      "dataVolume": "small" | "medium" | "large"
    }
  ],
  "integrationPoints": [
    {
      "integrationId": "string",
      "type": "rest_api" | "graphql" | "websocket" | "message_queue" | "database" | "file_system",
      "direction": "inbound" | "outbound" | "bidirectional",
      "protocol": "string",
      "frequency": "low" | "medium" | "high",
      "latencyRequirement": "relaxed" | "moderate" | "strict"
    }
  ],
  "currentImplementation": {
    "currentLocation": "monolith" | "microservice" | "lambda" | "container",
    "codeComplexity": "simple" | "moderate" | "complex",
    "testCoverage": number,
    "maintainabilityScore": number,
    "performanceMetrics": {
      "averageResponseTime": number,
      "throughput": number,
      "errorRate": number,
      "resourceUtilization": number
    }
  },
  "scalabilityNeeds": {
    "loadPattern": "steady" | "spiky" | "seasonal" | "unpredictable",
    "growthProjection": "stable" | "linear" | "exponential",
    "resourceBottlenecks": ["string"],
    "scalingStrategy": "horizontal" | "vertical" | "hybrid"
  }
}
```

**Response:**

```json
{
  "featureId": "string",
  "priority": "high" | "medium" | "low",
  "reasoning": ["string"],
  "score": number,
  "recommendedAction": "extract_immediately" | "extract_later" | "keep_in_monolith" | "refactor_first",
  "estimatedEffort": "low" | "medium" | "high",
  "riskLevel": "low" | "medium" | "high",
  "extractionPlan": {
    "phases": [
      {
        "phaseId": "string",
        "name": "string",
        "description": "string",
        "tasks": ["string"],
        "dependencies": ["string"],
        "estimatedDuration": "string"
      }
    ],
    "estimatedDuration": "string",
    "requiredResources": ["string"],
    "riskMitigation": ["string"],
    "successMetrics": ["string"]
  }
}
```

#### Categorize Multiple Features (Batch)

```http
POST /api/microservices/categorization
```

**Request Body:** Array of feature analysis objects (same structure as single feature)

**Response:**

```json
{
  "results": [
    // Array of categorization results (same structure as single feature response)
  ]
}
```

## Service Boundary Optimization Service

The Service Boundary Optimization Service analyzes and optimizes service boundaries to minimize cross-service dependencies while maintaining clear domain separation.

### Base URL

```
/api/microservices/boundary-optimization
```

### Endpoints

#### Optimize Service Boundaries

```http
POST /api/microservices/boundary-optimization
```

**Request Body:**

```json
[
  {
    "boundaryId": "string",
    "name": "string",
    "domain": "string",
    "features": ["string"],
    "responsibilities": ["string"],
    "interfaces": [
      {
        "interfaceId": "string",
        "type": "rest" | "graphql" | "grpc" | "message_queue" | "event_stream",
        "operations": [
          {
            "operationId": "string",
            "name": "string",
            "method": "string",
            "inputSchema": {},
            "outputSchema": {},
            "errorCodes": ["string"]
          }
        ],
        "versioningStrategy": "none" | "url" | "header" | "content_negotiation"
      }
    ],
    "dependencies": [
      {
        "dependencyId": "string",
        "targetService": "string",
        "type": "synchronous" | "asynchronous" | "event_driven",
        "criticality": "low" | "medium" | "high",
        "fallbackStrategy": "fail_fast" | "graceful_degradation" | "circuit_breaker" | "retry"
      }
    ],
    "dataOwnership": ["string"]
  }
]
```

**Response:**

```json
{
  "originalBoundaries": [
    // Array of original service boundaries
  ],
  "optimizedBoundaries": [
    // Array of optimized service boundaries (same structure as input)
  ],
  "optimizationMetrics": {
    "cohesionScore": number,
    "couplingScore": number,
    "complexityReduction": number,
    "performanceImpact": number,
    "maintainabilityImprovement": number,
    "domainAlignmentScore": number
  },
  "recommendations": [
    {
      "type": "merge_services" | "split_service" | "extract_feature" | "consolidate_data" | "redesign_interface",
      "affectedServices": ["string"],
      "reasoning": "string",
      "priority": "high" | "medium" | "low",
      "estimatedImpact": "positive" | "neutral" | "negative",
      "implementationComplexity": "low" | "medium" | "high",
      "estimatedEffort": "string"
    }
  ],
  "migrationPlan": {
    "phases": [
      {
        "phaseId": "string",
        "name": "string",
        "description": "string",
        "recommendations": ["string"],
        "estimatedDuration": "string",
        "prerequisites": ["string"],
        "deliverables": ["string"]
      }
    ],
    "totalDuration": "string",
    "riskAssessment": {
      "overallRisk": "low" | "medium" | "high",
      "riskFactors": [
        {
          "factor": "string",
          "impact": "low" | "medium" | "high",
          "probability": "low" | "medium" | "high",
          "mitigation": "string"
        }
      ],
      "mitigationStrategies": ["string"]
    },
    "rollbackStrategy": ["string"]
  }
}
```

#### Analyze Service Health

```http
GET /api/microservices/boundary-optimization/health
```

**Request Body:** Array of service boundaries (same structure as optimization endpoint)

**Response:**

```json
{
  "metrics": [
    {
      "cohesionScore": number,
      "couplingScore": number,
      "complexityScore": number,
      "maintainabilityScore": number,
      "performanceScore": number
    }
  ]
}
```

## Advanced Monitoring Service

The Advanced Monitoring Service provides comprehensive monitoring, alerting, and observability for microservices architecture.

### Base URL

```
/api/microservices/monitoring
```

### Endpoints

#### Configure Monitoring

```http
POST /api/microservices/monitoring/configure
```

**Request Body:**

```json
{
  "serviceId": "string",
  "serviceName": "string",
  "environment": "dev" | "staging" | "prod",
  "metrics": [
    {
      "metricId": "string",
      "name": "string",
      "type": "counter" | "gauge" | "histogram" | "summary",
      "description": "string",
      "labels": ["string"],
      "thresholds": [
        {
          "level": "warning" | "critical",
          "operator": "gt" | "lt" | "eq" | "gte" | "lte",
          "value": number,
          "duration": "string"
        }
      ],
      "aggregation": {
        "window": "string",
        "function": "avg" | "sum" | "min" | "max" | "p50" | "p95" | "p99",
        "groupBy": ["string"]
      }
    }
  ],
  "alerts": [
    {
      "alertId": "string",
      "name": "string",
      "description": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "conditions": [
        {
          "metricId": "string",
          "operator": "gt" | "lt" | "eq" | "gte" | "lte",
          "threshold": number,
          "duration": "string",
          "aggregation": "string"
        }
      ],
      "actions": [
        {
          "type": "email" | "sms" | "slack" | "webhook" | "auto_scale" | "restart_service",
          "target": "string",
          "parameters": {},
          "delay": "string"
        }
      ],
      "suppressionRules": [
        {
          "ruleId": "string",
          "condition": "string",
          "duration": "string",
          "reason": "string"
        }
      ],
      "escalationPolicy": {
        "levels": [
          {
            "level": number,
            "actions": [
              // Same structure as actions above
            ],
            "condition": "string"
          }
        ],
        "maxEscalations": number,
        "escalationInterval": "string"
      }
    }
  ],
  "healthChecks": [
    {
      "checkId": "string",
      "name": "string",
      "type": "http" | "tcp" | "database" | "custom",
      "endpoint": "string",
      "interval": "string",
      "timeout": "string",
      "retries": number,
      "expectedResponse": {
        "statusCode": number,
        "body": "string",
        "headers": {},
        "responseTime": number
      },
      "dependencies": ["string"]
    }
  ],
  "dashboards": [
    {
      "dashboardId": "string",
      "name": "string",
      "description": "string",
      "panels": [
        {
          "panelId": "string",
          "title": "string",
          "type": "graph" | "table" | "stat" | "heatmap" | "logs",
          "metrics": ["string"],
          "visualization": {
            "chartType": "line" | "bar" | "pie" | "scatter",
            "colors": ["string"],
            "axes": {
              "xAxis": {
                "label": "string",
                "scale": "linear" | "log",
                "min": number,
                "max": number
              },
              "yAxis": {
                "label": "string",
                "scale": "linear" | "log",
                "min": number,
                "max": number
              }
            },
            "legend": {
              "show": boolean,
              "position": "top" | "bottom" | "left" | "right"
            }
          },
          "position": {
            "x": number,
            "y": number,
            "width": number,
            "height": number
          }
        }
      ],
      "refreshInterval": "string",
      "timeRange": "string"
    }
  ]
}
```

**Response:**

```json
{
  "message": "Monitoring configured successfully"
}
```

#### Ingest Metrics

```http
POST /api/microservices/monitoring/{serviceId}/metrics
```

**Request Body:**

```json
[
  {
    "metricId": "string",
    "value": number,
    "labels": {},
    "timestamp": "string"
  }
]
```

**Response:**

```json
{
  "message": "Metrics ingested successfully"
}
```

#### Get Health Status

```http
GET /api/microservices/monitoring/{serviceId}/health
```

**Response:**

```json
{
  "overall": "healthy" | "degraded" | "unhealthy",
  "checks": [
    {
      "checkId": "string",
      "status": "pass" | "fail" | "warn",
      "responseTime": number,
      "message": "string",
      "lastCheck": "string"
    }
  ],
  "dependencies": [
    {
      "serviceId": "string",
      "status": "available" | "degraded" | "unavailable",
      "responseTime": number,
      "lastCheck": "string"
    }
  ]
}
```

#### Get Monitoring Data

```http
GET /api/microservices/monitoring/{serviceId}/data?timeRange={timeRange}
```

**Query Parameters:**

- `timeRange` (optional): Time range for metrics (e.g., "1h", "24h", "7d")

**Response:**

```json
{
  "timestamp": "string",
  "serviceId": "string",
  "metrics": [
    {
      "metricId": "string",
      "value": number,
      "labels": {},
      "timestamp": "string"
    }
  ],
  "healthStatus": {
    // Same structure as health status endpoint
  },
  "alerts": [
    {
      "alertId": "string",
      "status": "firing" | "resolved" | "suppressed",
      "severity": "low" | "medium" | "high" | "critical",
      "startTime": "string",
      "resolvedTime": "string",
      "message": "string",
      "affectedServices": ["string"],
      "escalationLevel": number
    }
  ]
}
```

#### Generate Reports

```http
GET /api/microservices/monitoring/{serviceId}/report?type={reportType}
```

**Query Parameters:**

- `type`: Report type ("sla", "performance", "availability")

**Response (SLA Report):**

```json
{
  "reportType": "sla",
  "serviceId": "string",
  "period": "string",
  "availability": number,
  "responseTime": {
    "average": number,
    "p95": number,
    "p99": number
  },
  "errorRate": number,
  "slaCompliance": boolean
}
```

**Response (Performance Report):**

```json
{
  "reportType": "performance",
  "serviceId": "string",
  "period": "string",
  "throughput": number,
  "latency": {
    "average": number,
    "p50": number,
    "p95": number,
    "p99": number
  },
  "resourceUtilization": {
    "cpu": number,
    "memory": number,
    "network": number
  }
}
```

**Response (Availability Report):**

```json
{
  "reportType": "availability",
  "serviceId": "string",
  "period": "string",
  "uptime": number,
  "incidents": number,
  "mttr": number,
  "mtbf": number
}
```

## Common Types

### Error Response

```json
{
  "error": "string",
  "message": "string",
  "timestamp": "string",
  "path": "string"
}
```

### Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order ("asc" or "desc")

**Response:**

```json
{
  "data": [],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint",
  "traceId": "trace-id-for-debugging"
}
```

## Authentication

All API endpoints require authentication using JWT tokens.

### Headers

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Token Format

JWT tokens should include the following claims:

- `sub`: User ID
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp
- `scope`: Permissions scope

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Default**: 100 requests per minute per user
- **Monitoring endpoints**: 1000 requests per minute per service
- **Batch operations**: 10 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Versioning

API versioning is handled through URL paths:

```
/api/v1/microservices/...
```

Current version: `v1`

## SDK and Client Libraries

Official SDKs are available for:

- JavaScript/TypeScript
- Python
- Java
- Go

Example usage (TypeScript):

```typescript
import { MicroservicesClient } from "@bayon/microservices-sdk";

const client = new MicroservicesClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.bayon.com",
});

const result = await client.categorization.categorizeFeature(featureAnalysis);
```

## Support

For API support and questions:

- Documentation: [https://docs.bayon.com/microservices](https://docs.bayon.com/microservices)
- Support: [support@bayon.com](mailto:support@bayon.com)
- GitHub: [https://github.com/bayon/microservices-api](https://github.com/bayon/microservices-api)
