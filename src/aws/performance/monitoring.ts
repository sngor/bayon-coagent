/**
 * Performance Monitoring Utilities
 * 
 * Provides tools for monitoring and profiling application performance:
 * - Request timing and profiling
 * - Hot path identification
 * - Performance metrics collection
 * - Bottleneck detection
 */

/**
 * Performance metric data
 */
export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Performance profile for a specific operation
 */
export interface PerformanceProfile {
    operation: string;
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
}

/**
 * Performance monitor for tracking operation timings
 */
export class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric[]>;
    private activeTimers: Map<string, number>;
    private maxMetricsPerOperation: number;

    constructor(maxMetricsPerOperation: number = 1000) {
        this.metrics = new Map();
        this.activeTimers = new Map();
        this.maxMetricsPerOperation = maxMetricsPerOperation;
    }

    /**
     * Starts timing an operation
     */
    start(operationId: string): void {
        this.activeTimers.set(operationId, Date.now());
    }

    /**
     * Ends timing an operation and records the metric
     */
    end(operationId: string, operationName: string, metadata?: Record<string, any>): void {
        const startTime = this.activeTimers.get(operationId);
        if (!startTime) {
            console.warn(`No start time found for operation: ${operationId}`);
            return;
        }

        const duration = Date.now() - startTime;
        this.activeTimers.delete(operationId);

        const metric: PerformanceMetric = {
            name: operationName,
            duration,
            timestamp: Date.now(),
            metadata,
        };

        this.recordMetric(operationName, metric);
    }

    /**
     * Measures an async operation
     */
    async measure<T>(
        operationName: string,
        operation: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;

            this.recordMetric(operationName, {
                name: operationName,
                duration,
                timestamp: Date.now(),
                metadata,
            });

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordMetric(operationName, {
                name: operationName,
                duration,
                timestamp: Date.now(),
                metadata: { ...metadata, error: true },
            });
            throw error;
        }
    }

    /**
     * Measures a synchronous operation
     */
    measureSync<T>(
        operationName: string,
        operation: () => T,
        metadata?: Record<string, any>
    ): T {
        const startTime = Date.now();
        try {
            const result = operation();
            const duration = Date.now() - startTime;

            this.recordMetric(operationName, {
                name: operationName,
                duration,
                timestamp: Date.now(),
                metadata,
            });

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordMetric(operationName, {
                name: operationName,
                duration,
                timestamp: Date.now(),
                metadata: { ...metadata, error: true },
            });
            throw error;
        }
    }

    /**
     * Gets performance profile for an operation
     */
    getProfile(operationName: string): PerformanceProfile | null {
        const metrics = this.metrics.get(operationName);
        if (!metrics || metrics.length === 0) {
            return null;
        }

        const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
        const count = durations.length;
        const totalDuration = durations.reduce((sum, d) => sum + d, 0);

        return {
            operation: operationName,
            count,
            totalDuration,
            averageDuration: totalDuration / count,
            minDuration: durations[0],
            maxDuration: durations[count - 1],
            p50: this.percentile(durations, 0.5),
            p95: this.percentile(durations, 0.95),
            p99: this.percentile(durations, 0.99),
        };
    }

    /**
     * Gets all performance profiles
     */
    getAllProfiles(): PerformanceProfile[] {
        const profiles: PerformanceProfile[] = [];

        for (const operationName of this.metrics.keys()) {
            const profile = this.getProfile(operationName);
            if (profile) {
                profiles.push(profile);
            }
        }

        return profiles.sort((a, b) => b.totalDuration - a.totalDuration);
    }

    /**
     * Identifies hot paths (operations taking the most time)
     */
    getHotPaths(limit: number = 10): PerformanceProfile[] {
        return this.getAllProfiles()
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, limit);
    }

    /**
     * Identifies slow operations (high average duration)
     */
    getSlowOperations(limit: number = 10): PerformanceProfile[] {
        return this.getAllProfiles()
            .sort((a, b) => b.averageDuration - a.averageDuration)
            .slice(0, limit);
    }

    /**
     * Identifies bottlenecks (operations with high p99)
     */
    getBottlenecks(limit: number = 10): PerformanceProfile[] {
        return this.getAllProfiles()
            .sort((a, b) => b.p99 - a.p99)
            .slice(0, limit);
    }

    /**
     * Gets raw metrics for an operation
     */
    getMetrics(operationName: string): PerformanceMetric[] {
        return this.metrics.get(operationName) || [];
    }

    /**
     * Clears all metrics
     */
    clear(): void {
        this.metrics.clear();
        this.activeTimers.clear();
    }

    /**
     * Clears metrics for a specific operation
     */
    clearOperation(operationName: string): void {
        this.metrics.delete(operationName);
    }

    /**
     * Exports metrics as JSON
     */
    export(): string {
        const data = {
            profiles: this.getAllProfiles(),
            timestamp: Date.now(),
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Records a metric
     */
    private recordMetric(operationName: string, metric: PerformanceMetric): void {
        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, []);
        }

        const metrics = this.metrics.get(operationName)!;
        metrics.push(metric);

        // Limit metrics per operation to prevent memory issues
        if (metrics.length > this.maxMetricsPerOperation) {
            metrics.shift();
        }
    }

    /**
     * Calculates percentile from sorted array
     */
    private percentile(sortedArray: number[], p: number): number {
        if (sortedArray.length === 0) {
            return 0;
        }

        const index = Math.ceil(sortedArray.length * p) - 1;
        return sortedArray[Math.max(0, index)];
    }
}

/**
 * Global performance monitor instance
 */
let globalMonitor: PerformanceMonitor | null = null;

/**
 * Gets the global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
    if (!globalMonitor) {
        globalMonitor = new PerformanceMonitor();
    }
    return globalMonitor;
}

/**
 * Resets the global performance monitor
 */
export function resetPerformanceMonitor(): void {
    globalMonitor = null;
}

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(operationName?: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const name = operationName || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            const monitor = getPerformanceMonitor();
            return monitor.measure(name, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}

/**
 * Request profiler for tracking request lifecycle
 */
export class RequestProfiler {
    private requestId: string;
    private monitor: PerformanceMonitor;
    private phases: Map<string, number>;

    constructor(requestId: string, monitor?: PerformanceMonitor) {
        this.requestId = requestId;
        this.monitor = monitor || getPerformanceMonitor();
        this.phases = new Map();
    }

    /**
     * Marks the start of a phase
     */
    startPhase(phaseName: string): void {
        this.phases.set(phaseName, Date.now());
    }

    /**
     * Marks the end of a phase
     */
    endPhase(phaseName: string, metadata?: Record<string, any>): void {
        const startTime = this.phases.get(phaseName);
        if (!startTime) {
            console.warn(`No start time found for phase: ${phaseName}`);
            return;
        }

        const duration = Date.now() - startTime;
        this.monitor.recordMetric(`${this.requestId}.${phaseName}`, {
            name: `${this.requestId}.${phaseName}`,
            duration,
            timestamp: Date.now(),
            metadata,
        } as any);

        this.phases.delete(phaseName);
    }

    /**
     * Gets the profile for this request
     */
    getProfile(): Record<string, PerformanceProfile | null> {
        const profile: Record<string, PerformanceProfile | null> = {};

        for (const phaseName of this.phases.keys()) {
            profile[phaseName] = this.monitor.getProfile(`${this.requestId}.${phaseName}`);
        }

        return profile;
    }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
    private snapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }>;
    private maxSnapshots: number;

    constructor(maxSnapshots: number = 100) {
        this.snapshots = [];
        this.maxSnapshots = maxSnapshots;
    }

    /**
     * Takes a memory snapshot
     */
    snapshot(): NodeJS.MemoryUsage {
        const usage = process.memoryUsage();
        this.snapshots.push({
            timestamp: Date.now(),
            usage,
        });

        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }

        return usage;
    }

    /**
     * Gets memory usage statistics
     */
    getStats(): {
        current: NodeJS.MemoryUsage;
        average: NodeJS.MemoryUsage;
        peak: NodeJS.MemoryUsage;
    } {
        if (this.snapshots.length === 0) {
            const current = process.memoryUsage();
            return { current, average: current, peak: current };
        }

        const current = this.snapshots[this.snapshots.length - 1].usage;

        const average: NodeJS.MemoryUsage = {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0,
        };

        const peak: NodeJS.MemoryUsage = {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0,
        };

        for (const snapshot of this.snapshots) {
            average.rss += snapshot.usage.rss;
            average.heapTotal += snapshot.usage.heapTotal;
            average.heapUsed += snapshot.usage.heapUsed;
            average.external += snapshot.usage.external;
            average.arrayBuffers += snapshot.usage.arrayBuffers;

            peak.rss = Math.max(peak.rss, snapshot.usage.rss);
            peak.heapTotal = Math.max(peak.heapTotal, snapshot.usage.heapTotal);
            peak.heapUsed = Math.max(peak.heapUsed, snapshot.usage.heapUsed);
            peak.external = Math.max(peak.external, snapshot.usage.external);
            peak.arrayBuffers = Math.max(peak.arrayBuffers, snapshot.usage.arrayBuffers);
        }

        const count = this.snapshots.length;
        average.rss /= count;
        average.heapTotal /= count;
        average.heapUsed /= count;
        average.external /= count;
        average.arrayBuffers /= count;

        return { current, average, peak };
    }

    /**
     * Clears all snapshots
     */
    clear(): void {
        this.snapshots = [];
    }
}
