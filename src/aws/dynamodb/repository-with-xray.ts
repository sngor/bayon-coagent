/**
 * Enhanced DynamoDB Repository with X-Ray Tracing
 * 
 * This module extends the existing DynamoDB repository with comprehensive X-Ray tracing
 * for distributed tracing across the microservices architecture.
 */

import { DynamoDBRepository } from './repository';
import { traceDatabaseOperation } from '@/aws/xray/utils';
import { tracer } from '@/aws/xray/tracer';
import { addServiceDependency, addBusinessMetrics } from '@/aws/xray/service-map';
import {
    DynamoDBItem,
    DynamoDBKey,
    EntityType,
    QueryOptions,
    QueryResult,
    BatchResult,
    UpdateOptions,
} from './types';

/**
 * Enhanced DynamoDB repository with X-Ray tracing
 */
export class TracedDynamoDBRepository extends DynamoDBRepository {
    /**
     * Get item with X-Ray tracing
     */
    async getItem<T extends DynamoDBItem>(
        pk: string,
        sk: string,
        options: {
            userId?: string;
            requestId?: string;
            consistentRead?: boolean;
        } = {}
    ): Promise<T | null> {
        return traceDatabaseOperation(
            'getItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'getItem');
                tracer.addAnnotation('dynamodb.consistent_read', options.consistentRead || false);
                tracer.addMetadata('dynamodb.keys', { pk, sk });

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'getItem'
                );

                const startTime = Date.now();
                const result = await super.getItem<T>(pk, sk, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.item_found', result !== null);

                if (result) {
                    tracer.addMetadata('dynamodb.item_size', JSON.stringify(result).length);
                }

                // Add business metrics
                addBusinessMetrics({
                    databaseReads: 1,
                });

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.partition_key': pk,
                    'dynamodb.sort_key': sk,
                },
            }
        );
    }

    /**
     * Put item with X-Ray tracing
     */
    async putItem<T extends DynamoDBItem>(
        item: T,
        options: {
            userId?: string;
            requestId?: string;
            conditionExpression?: string;
        } = {}
    ): Promise<void> {
        return traceDatabaseOperation(
            'putItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'putItem');
                tracer.addAnnotation('dynamodb.has_condition', !!options.conditionExpression);
                tracer.addMetadata('dynamodb.item_type', item.EntityType);
                tracer.addMetadata('dynamodb.item_size', JSON.stringify(item).length);

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'putItem'
                );

                const startTime = Date.now();
                await super.putItem(item, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);

                // Add business metrics
                addBusinessMetrics({
                    databaseWrites: 1,
                    itemsCreated: 1,
                });
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.entity_type': item.EntityType,
                    'dynamodb.partition_key': item.PK,
                    'dynamodb.sort_key': item.SK,
                },
            }
        );
    }

    /**
     * Update item with X-Ray tracing
     */
    async updateItem<T extends DynamoDBItem>(
        pk: string,
        sk: string,
        updates: Partial<T>,
        options: UpdateOptions & {
            userId?: string;
            requestId?: string;
        } = {}
    ): Promise<T> {
        return traceDatabaseOperation(
            'updateItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'updateItem');
                tracer.addAnnotation('dynamodb.update_fields_count', Object.keys(updates).length);
                tracer.addMetadata('dynamodb.update_fields', Object.keys(updates));

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'updateItem'
                );

                const startTime = Date.now();
                const result = await super.updateItem<T>(pk, sk, updates, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.updated_item_size', JSON.stringify(result).length);

                // Add business metrics
                addBusinessMetrics({
                    databaseWrites: 1,
                    itemsUpdated: 1,
                });

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.partition_key': pk,
                    'dynamodb.sort_key': sk,
                    'dynamodb.update_type': options.returnValues || 'ALL_NEW',
                },
            }
        );
    }

    /**
     * Delete item with X-Ray tracing
     */
    async deleteItem(
        pk: string,
        sk: string,
        options: {
            userId?: string;
            requestId?: string;
            conditionExpression?: string;
        } = {}
    ): Promise<void> {
        return traceDatabaseOperation(
            'deleteItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'deleteItem');
                tracer.addAnnotation('dynamodb.has_condition', !!options.conditionExpression);

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'deleteItem'
                );

                const startTime = Date.now();
                await super.deleteItem(pk, sk, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);

                // Add business metrics
                addBusinessMetrics({
                    databaseWrites: 1,
                    itemsDeleted: 1,
                });
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.partition_key': pk,
                    'dynamodb.sort_key': sk,
                },
            }
        );
    }

    /**
     * Query items with X-Ray tracing
     */
    async queryItems<T extends DynamoDBItem>(
        pk: string,
        options: QueryOptions & {
            userId?: string;
            requestId?: string;
        } = {}
    ): Promise<QueryResult<T>> {
        return traceDatabaseOperation(
            'query',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'query');
                tracer.addAnnotation('dynamodb.index_name', options.indexName || 'primary');
                tracer.addAnnotation('dynamodb.has_filter', !!options.filterExpression);
                tracer.addAnnotation('dynamodb.limit', options.limit || 'unlimited');

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'query'
                );

                const startTime = Date.now();
                const result = await super.queryItems<T>(pk, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.items_returned', result.items.length);
                tracer.addMetadata('dynamodb.has_more_items', !!result.lastEvaluatedKey);
                tracer.addMetadata('dynamodb.consumed_capacity', result.consumedCapacity);

                // Calculate response size
                const responseSize = JSON.stringify(result.items).length;
                tracer.addMetadata('dynamodb.response_size', responseSize);

                // Add business metrics
                addBusinessMetrics({
                    databaseReads: 1,
                    itemsRetrieved: result.items.length,
                });

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.partition_key': pk,
                    'dynamodb.index': options.indexName,
                    'dynamodb.sort_key_condition': options.sortKeyCondition,
                },
            }
        );
    }

    /**
     * Batch get items with X-Ray tracing
     */
    async batchGetItems<T extends DynamoDBItem>(
        keys: DynamoDBKey[],
        options: {
            userId?: string;
            requestId?: string;
            consistentRead?: boolean;
        } = {}
    ): Promise<BatchResult<T>> {
        return traceDatabaseOperation(
            'batchGetItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'batchGetItem');
                tracer.addAnnotation('dynamodb.batch_size', keys.length);
                tracer.addAnnotation('dynamodb.consistent_read', options.consistentRead || false);

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'batchGetItem'
                );

                const startTime = Date.now();
                const result = await super.batchGetItems<T>(keys, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.items_requested', keys.length);
                tracer.addMetadata('dynamodb.items_returned', result.items.length);
                tracer.addMetadata('dynamodb.unprocessed_keys', result.unprocessedKeys?.length || 0);

                // Add business metrics
                addBusinessMetrics({
                    databaseReads: 1,
                    batchOperations: 1,
                    itemsRetrieved: result.items.length,
                });

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.batch_size': keys.length,
                    'dynamodb.keys': keys.map(k => ({ pk: k.PK, sk: k.SK })),
                },
            }
        );
    }

    /**
     * Batch write items with X-Ray tracing
     */
    async batchWriteItems<T extends DynamoDBItem>(
        items: T[],
        options: {
            userId?: string;
            requestId?: string;
        } = {}
    ): Promise<BatchResult<T>> {
        return traceDatabaseOperation(
            'batchWriteItem',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'batchWriteItem');
                tracer.addAnnotation('dynamodb.batch_size', items.length);

                // Analyze batch composition
                const entityTypes = [...new Set(items.map(item => item.EntityType))];
                tracer.addMetadata('dynamodb.entity_types', entityTypes);
                tracer.addMetadata('dynamodb.batch_composition',
                    entityTypes.map(type => ({
                        type,
                        count: items.filter(item => item.EntityType === type).length
                    }))
                );

                // Add service dependency
                addServiceDependency(
                    'application',
                    'dynamodb',
                    'database',
                    'batchWriteItem'
                );

                const startTime = Date.now();
                const result = await super.batchWriteItems<T>(items, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.items_requested', items.length);
                tracer.addMetadata('dynamodb.items_processed', items.length - (result.unprocessedItems?.length || 0));
                tracer.addMetadata('dynamodb.unprocessed_items', result.unprocessedItems?.length || 0);

                // Calculate batch efficiency
                const efficiency = ((items.length - (result.unprocessedItems?.length || 0)) / items.length) * 100;
                tracer.addMetadata('dynamodb.batch_efficiency', efficiency);

                // Add business metrics
                addBusinessMetrics({
                    databaseWrites: 1,
                    batchOperations: 1,
                    itemsCreated: items.length - (result.unprocessedItems?.length || 0),
                });

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.batch_size': items.length,
                    'dynamodb.entity_types': [...new Set(items.map(item => item.EntityType))],
                },
            }
        );
    }

    /**
     * Query by entity type with X-Ray tracing
     */
    async queryByEntityType<T extends DynamoDBItem>(
        entityType: EntityType,
        options: QueryOptions & {
            userId?: string;
            requestId?: string;
        } = {}
    ): Promise<QueryResult<T>> {
        return traceDatabaseOperation(
            'queryByEntityType',
            this.getTableName(),
            async () => {
                // Add operation context
                tracer.addAnnotation('dynamodb.operation', 'queryByEntityType');
                tracer.addAnnotation('dynamodb.entity_type', entityType);
                tracer.addAnnotation('dynamodb.index_name', 'EntityTypeIndex');

                const startTime = Date.now();
                const result = await super.queryByEntityType<T>(entityType, options);
                const duration = Date.now() - startTime;

                // Add performance metrics
                tracer.addMetadata('dynamodb.response_time', duration);
                tracer.addMetadata('dynamodb.items_returned', result.items.length);

                // Add business metrics based on entity type
                const businessMetrics: any = {
                    databaseReads: 1,
                    itemsRetrieved: result.items.length,
                };

                // Add entity-specific metrics
                switch (entityType) {
                    case 'USER':
                        businessMetrics.usersQueried = result.items.length;
                        break;
                    case 'CONTENT':
                        businessMetrics.contentItemsQueried = result.items.length;
                        break;
                    case 'REPORT':
                        businessMetrics.reportsQueried = result.items.length;
                        break;
                }

                addBusinessMetrics(businessMetrics);

                return result;
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                metadata: {
                    'dynamodb.table': this.getTableName(),
                    'dynamodb.entity_type': entityType,
                    'dynamodb.index': 'EntityTypeIndex',
                },
            }
        );
    }

    // Helper method to get table name (accessing private property)
    private getTableName(): string {
        return (this as any).tableName;
    }
}

/**
 * Create a traced DynamoDB repository instance
 */
export function createTracedRepository(): TracedDynamoDBRepository {
    return new TracedDynamoDBRepository();
}

/**
 * Default traced repository instance
 */
export const tracedRepository = createTracedRepository();