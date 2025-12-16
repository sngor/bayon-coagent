/**
 * Report Generation Service
 * 
 * Compiles data from multiple sources to generate comprehensive reports.
 * Implements Property 22: Multi-source report compilation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for report generation
interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream';
    endpoint?: string;
    credentials?: Record<string, string>;
    active: boolean;
    lastSync?: string;
}

interface ReportRequest {
    reportId: string;
    userId: string;
    reportType: string;
    sources: DataSource[];
    parameters: Record<string, any>;
    requestedAt: string;
}

interface ReportResult {
    reportId: string;
    data: Record<string, any>;
    sourcesUsed: string[];
    generatedAt: string;
    compilationTimeMs: number;
    dataFreshness: Record<string, string>;
    completeness: number;
}

interface SourceData {
    sourceId: string;
    sourceName: string;
    data: any;
    retrievedAt: string;
    success: boolean;
    error?: string;
}

// Multi-source data compiler
class MultiSourceCompiler {
    private readonly maxConcurrentSources = 10;
    private readonly sourceTimeout = 30000; // 30 seconds

    async compileReport(request: ReportRequest): Promise<ReportResult> {
        const startTime = Date.now();
        const activeSources = request.sources.filter(source => source.active);

        try {
            // Retrieve data from all active sources concurrently
            const sourceResults = await this.retrieveFromAllSources(activeSources, request.parameters);

            // Compile successful results
            const compiledData = this.compileSourceData(sourceResults, request.reportType);

            // Calculate metrics
            const successfulSources = sourceResults.filter(result => result.success);
            const sourcesUsed = successfulSources.map(result => result.sourceName);
            const dataFreshness = this.calculateDataFreshness(successfulSources, activeSources);
            const completeness = activeSources.length > 0
                ? (successfulSources.length / activeSources.length) * 100
                : 0;

            const endTime = Date.now();
            const compilationTimeMs = Math.max(1, endTime - startTime);

            return {
                reportId: request.reportId,
                data: compiledData,
                sourcesUsed,
                generatedAt: new Date().toISOString(),
                compilationTimeMs,
                dataFreshness,
                completeness,
            };

        } catch (error) {
            const endTime = Date.now();
            const compilationTimeMs = Math.max(1, endTime - startTime);

            console.error('Report compilation error:', error);

            return {
                reportId: request.reportId,
                data: { error: 'Compilation failed' },
                sourcesUsed: [],
                generatedAt: new Date().toISOString(),
                compilationTimeMs,
                dataFreshness: {},
                completeness: 0,
            };
        }
    }

    private async retrieveFromAllSources(
        sources: DataSource[],
        parameters: Record<string, any>
    ): Promise<SourceData[]> {
        // Limit concurrent source retrievals
        const chunks = this.chunkArray(sources, this.maxConcurrentSources);
        const allResults: SourceData[] = [];

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(source =>
                this.retrieveFromSource(source, parameters)
            );

            const chunkResults = await Promise.allSettled(chunkPromises);

            chunkResults.forEach((result, index) => {
                const source = chunk[index];
                if (result.status === 'fulfilled') {
                    allResults.push(result.value);
                } else {
                    allResults.push({
                        sourceId: source.id,
                        sourceName: source.name,
                        data: null,
                        retrievedAt: new Date().toISOString(),
                        success: false,
                        error: result.reason?.message || 'Unknown error',
                    });
                }
            });
        }

        return allResults;
    }

    private async retrieveFromSource(
        source: DataSource,
        parameters: Record<string, any>
    ): Promise<SourceData> {
        const startTime = Date.now();

        try {
            // Set timeout for source retrieval
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Source timeout')), this.sourceTimeout);
            });

            const dataPromise = this.fetchSourceData(source, parameters);
            const data = await Promise.race([dataPromise, timeoutPromise]);

            return {
                sourceId: source.id,
                sourceName: source.name,
                data,
                retrievedAt: new Date().toISOString(),
                success: true,
            };

        } catch (error) {
            return {
                sourceId: source.id,
                sourceName: source.name,
                data: null,
                retrievedAt: new Date().toISOString(),
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async fetchSourceData(source: DataSource, parameters: Record<string, any>): Promise<any> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

        // Simulate occasional source failures (10% failure rate)
        if (Math.random() < 0.1) {
            throw new Error(`Source ${source.name} temporarily unavailable`);
        }

        // Generate mock data based on source type
        switch (source.type) {
            case 'database':
                return this.generateDatabaseData(source, parameters);
            case 'api':
                return this.generateApiData(source, parameters);
            case 'file':
                return this.generateFileData(source, parameters);
            case 'stream':
                return this.generateStreamData(source, parameters);
            default:
                return { data: 'unknown source type' };
        }
    }

    private generateDatabaseData(source: DataSource, parameters: Record<string, any>): any {
        return {
            type: 'database',
            source: source.name,
            records: Math.floor(Math.random() * 1000) + 100,
            lastUpdated: source.lastSync || new Date().toISOString(),
            query: parameters.query || 'SELECT * FROM table',
            executionTime: Math.random() * 500 + 100,
            tables: ['users', 'content', 'analytics', 'reports'],
        };
    }

    private generateApiData(source: DataSource, parameters: Record<string, any>): any {
        return {
            type: 'api',
            source: source.name,
            endpoint: source.endpoint || 'https://api.example.com',
            responseTime: Math.random() * 500 + 100,
            dataPoints: Math.floor(Math.random() * 500) + 50,
            rateLimit: {
                remaining: Math.floor(Math.random() * 1000),
                resetTime: new Date(Date.now() + 3600000).toISOString(),
            },
        };
    }

    private generateFileData(source: DataSource, parameters: Record<string, any>): any {
        return {
            type: 'file',
            source: source.name,
            fileName: `${source.name.toLowerCase().replace(/\s+/g, '_')}.csv`,
            size: Math.floor(Math.random() * 10000000) + 1000000,
            rows: Math.floor(Math.random() * 50000) + 10000,
            lastModified: source.lastSync || new Date().toISOString(),
            format: 'CSV',
        };
    }

    private generateStreamData(source: DataSource, parameters: Record<string, any>): any {
        return {
            type: 'stream',
            source: source.name,
            streamName: source.name,
            messagesProcessed: Math.floor(Math.random() * 10000) + 1000,
            latency: Math.random() * 100 + 10,
            throughput: Math.floor(Math.random() * 1000) + 100,
            lastMessage: new Date().toISOString(),
        };
    }

    private compileSourceData(sourceResults: SourceData[], reportType: string): Record<string, any> {
        const compiledData: Record<string, any> = {
            reportType,
            compiledAt: new Date().toISOString(),
            sources: {},
            summary: {},
        };

        // Add data from each successful source
        const successfulResults = sourceResults.filter(result => result.success);

        successfulResults.forEach(result => {
            compiledData.sources[result.sourceName] = result.data;
        });

        // Generate report-specific summary
        compiledData.summary = this.generateReportSummary(successfulResults, reportType);

        // Add metadata
        compiledData.metadata = {
            totalSources: sourceResults.length,
            successfulSources: successfulResults.length,
            failedSources: sourceResults.length - successfulResults.length,
            dataQuality: this.assessDataQuality(successfulResults),
        };

        return compiledData;
    }

    private generateReportSummary(results: SourceData[], reportType: string): any {
        const summary: any = {
            reportType,
            totalDataPoints: 0,
            averageResponseTime: 0,
            dataSourceTypes: new Set(),
        };

        let totalResponseTime = 0;
        let responseTimeCount = 0;

        results.forEach(result => {
            if (result.data) {
                // Aggregate data points
                if (result.data.records) {
                    summary.totalDataPoints += result.data.records;
                }
                if (result.data.dataPoints) {
                    summary.totalDataPoints += result.data.dataPoints;
                }
                if (result.data.rows) {
                    summary.totalDataPoints += result.data.rows;
                }
                if (result.data.messagesProcessed) {
                    summary.totalDataPoints += result.data.messagesProcessed;
                }

                // Track response times
                if (result.data.responseTime) {
                    totalResponseTime += result.data.responseTime;
                    responseTimeCount++;
                }
                if (result.data.executionTime) {
                    totalResponseTime += result.data.executionTime;
                    responseTimeCount++;
                }

                // Track source types
                if (result.data.type) {
                    summary.dataSourceTypes.add(result.data.type);
                }
            }
        });

        summary.averageResponseTime = responseTimeCount > 0
            ? totalResponseTime / responseTimeCount
            : 0;
        summary.dataSourceTypes = Array.from(summary.dataSourceTypes);

        return summary;
    }

    private assessDataQuality(results: SourceData[]): string {
        if (results.length === 0) {
            return 'no-data';
        }

        const qualityScore = results.length / (results.length + 1); // Simple quality metric

        if (qualityScore >= 0.9) {
            return 'excellent';
        } else if (qualityScore >= 0.7) {
            return 'good';
        } else if (qualityScore >= 0.5) {
            return 'fair';
        } else {
            return 'poor';
        }
    }

    private calculateDataFreshness(
        successfulResults: SourceData[],
        allSources: DataSource[]
    ): Record<string, string> {
        const freshness: Record<string, string> = {};

        successfulResults.forEach(result => {
            const source = allSources.find(s => s.name === result.sourceName);
            freshness[result.sourceName] = source?.lastSync || result.retrievedAt;
        });

        return freshness;
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

// Global compiler instance
const compiler = new MultiSourceCompiler();

/**
 * Report Generation Service Lambda Handler
 * 
 * Compiles data from multiple sources to generate reports
 */
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        // Parse request body
        const requestBody: ReportRequest = JSON.parse(event.body || '{}');

        // Validate request
        if (!requestBody.reportId || !requestBody.userId || !requestBody.reportType) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'reportId, userId, and reportType are required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'report-generation-service',
                        retryable: false,
                    },
                }),
            };
        }

        if (!requestBody.sources || !Array.isArray(requestBody.sources)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'sources array is required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'report-generation-service',
                        retryable: false,
                    },
                }),
            };
        }

        // Compile report from multiple sources
        const result = await compiler.compileReport(requestBody);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                message: 'Report compiled successfully',
                data: result,
            }),
        };

    } catch (error) {
        console.error('Report generation service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'INTERNAL_ERROR',
                    message: 'Failed to generate report',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'report-generation-service',
                    retryable: true,
                },
            }),
        };
    }
};

// Export for testing
export { MultiSourceCompiler, DataSource, ReportRequest, ReportResult };