# DynamoDB Index Optimization for Market Intelligence Alerts

## Overview

This document outlines the DynamoDB index strategy for optimizing alert queries and improving performance.

## Current Table Structure

### Main Table

- **Table Name**: `bayon-coagent-dev` (or production equivalent)
- **Partition Key**: `PK` (String)
- **Sort Key**: `SK` (String)

### Alert Records Structure

```
PK: USER#<userId>
SK: ALERT#<timestamp>#<alertId>
EntityType: Alert
Data: <Alert object>
GSI1PK: ALERT#<userId>#<alertType>
GSI1SK: <timestamp>
```

## Required Global Secondary Indexes (GSI)

### GSI1 - Alert Type Index

**Purpose**: Optimize queries by alert type

- **Index Name**: `GSI1`
- **Partition Key**: `GSI1PK` (String)
- **Sort Key**: `GSI1SK` (String)
- **Projection**: `ALL`

**Key Pattern**:

- `GSI1PK`: `ALERT#<userId>#<alertType>`
- `GSI1SK`: `<timestamp>` (for sorting by creation time)

**Use Cases**:

- Query alerts by specific type (e.g., all life-event-lead alerts)
- Parallel queries for multiple types
- Type-specific pagination

### GSI2 - Alert Status Index (Optional)

**Purpose**: Optimize queries by alert status

- **Index Name**: `GSI2`
- **Partition Key**: `GSI2PK` (String)
- **Sort Key**: `GSI2SK` (String)
- **Projection**: `ALL`

**Key Pattern**:

- `GSI2PK`: `ALERT#<userId>#<status>`
- `GSI2SK`: `<timestamp>`

**Use Cases**:

- Query unread alerts efficiently
- Status-specific filtering
- Dashboard statistics

## Query Optimization Strategies

### 1. Single Type Queries

**Best Performance**: Use GSI1 with specific alert type

```typescript
// Query: Get all life-event-lead alerts for user
GSI1PK = "ALERT#user123#life-event-lead";
// Sort by GSI1SK (timestamp) descending
```

### 2. Multiple Type Queries

**Strategy**: Parallel queries on GSI1

```typescript
// Query: Get competitor alerts (new-listing, price-reduction, withdrawal)
// Execute 3 parallel queries:
// 1. GSI1PK = "ALERT#user123#competitor-new-listing"
// 2. GSI1PK = "ALERT#user123#competitor-price-reduction"
// 3. GSI1PK = "ALERT#user123#competitor-withdrawal"
// Merge and sort results client-side
```

### 3. Status-Based Queries

**With GSI2**: Direct query by status

```typescript
// Query: Get all unread alerts
GSI2PK = "ALERT#user123#unread";
```

**Without GSI2**: Main table query with filter

```typescript
// Query main table with filter expression
PK = "USER#user123" AND begins_with(SK, "ALERT#")
FilterExpression: "Data.status = :status"
```

### 4. Mixed Filters

**Strategy**: Use most selective index + filter expression

```typescript
// Query: Unread life-event-lead alerts
// Use GSI1 (type) + filter on status
GSI1PK = "ALERT#user123#life-event-lead";
FilterExpression: "Data.status = :status";
```

## Performance Characteristics

### Query Costs (Relative)

1. **GSI1 Single Type**: 1 RCU per query
2. **GSI1 Parallel Types**: N RCUs (N = number of types)
3. **Main Table + Filter**: 2-5 RCUs (depends on filter selectivity)
4. **GSI2 Status**: 1 RCU per query

### Latency Estimates

1. **GSI1 Single Type**: ~50ms
2. **GSI1 Parallel Types**: ~75ms (parallel execution)
3. **Main Table + Filter**: ~100ms
4. **Full Table Scan**: ~200ms+ (avoid)

## Cache Strategy

### Cache Keys

```typescript
// Format: alerts:<userId>:<base64(filters)>:<base64(options)>
"alerts:user123:eyJ0eXBlcyI6WyJsaWZlLWV2ZW50LWxlYWQiXX0=:eyJsaW1pdCI6MjB9";
```

### TTL Strategy

- **Real-time queries**: 2-5 minutes
- **Historical queries**: 15-30 minutes
- **Search queries**: 2 minutes
- **Statistics**: 5-10 minutes

## Implementation Status

### ✅ Implemented

- [x] GSI1 for alert type queries
- [x] Query optimization logic
- [x] Parallel query execution
- [x] Result merging and sorting
- [x] In-memory caching
- [x] Performance monitoring

### 🔄 In Progress

- [ ] GSI2 for status queries (optional optimization)
- [ ] Query result pagination cursors
- [ ] Advanced cache invalidation

### 📋 Future Optimizations

- [ ] Composite sort keys for multi-dimensional sorting
- [ ] Sparse indexes for specific query patterns
- [ ] Read replicas for read-heavy workloads
- [ ] DynamoDB Accelerator (DAX) for microsecond latency

## Monitoring and Metrics

### Key Metrics to Track

1. **Query Latency**: P50, P95, P99 response times
2. **Cache Hit Rate**: Percentage of queries served from cache
3. **RCU Consumption**: Read capacity units consumed per query type
4. **Error Rate**: Failed queries per query type
5. **Query Distribution**: Usage patterns by query type

### CloudWatch Alarms

- High latency (>200ms P95)
- Low cache hit rate (<70%)
- High error rate (>5%)
- RCU throttling

## Best Practices

### Query Design

1. **Use the most selective index** for your primary filter
2. **Minimize filter expressions** on non-key attributes
3. **Batch related queries** when possible
4. **Implement pagination** for large result sets
5. **Cache frequently accessed data**

### Index Design

1. **Keep projections minimal** to reduce storage costs
2. **Use sparse indexes** for optional attributes
3. **Consider query patterns** when designing keys
4. **Monitor index usage** and remove unused indexes

### Application Design

1. **Implement circuit breakers** for external dependencies
2. **Use exponential backoff** for retries
3. **Gracefully degrade** when indexes are unavailable
4. **Monitor performance metrics** continuously

## Cost Optimization

### Storage Costs

- Main table: ~$0.25/GB/month
- GSI storage: ~$0.25/GB/month per index
- Estimated monthly cost: $5-20 for typical usage

### Request Costs

- Read requests: $0.25 per million RCUs
- Write requests: $1.25 per million WCUs
- Estimated monthly cost: $10-50 for typical usage

### Optimization Tips

1. Use projection type `KEYS_ONLY` when possible
2. Implement efficient pagination to reduce over-fetching
3. Cache frequently accessed data
4. Use batch operations for bulk updates
5. Monitor and optimize query patterns regularly
