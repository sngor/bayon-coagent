/**
 * Export Performance Optimization Utilities
 * 
 * Provides utilities for optimizing export performance to meet the
 * 10-second target for sessions with up to 100 visitors
 * Validates Requirements: 6.4
 */

import { Visitor } from './types';

/**
 * Batch size for processing visitors in chunks
 * Optimized for memory efficiency and performance
 */
const BATCH_SIZE = 50;

/**
 * Processes visitors in batches to avoid memory issues with large datasets
 * 
 * @param visitors - Array of visitors to process
 * @param processor - Function to process each batch
 * @returns Promise that resolves when all batches are processed
 */
export async function processBatches<T>(
    items: T[],
    processor: (batch: T[]) => Promise<void>
): Promise<void> {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await processor(batch);
    }
}

/**
 * Estimates export time based on visitor count
 * Used for progress indicators and user feedback
 * 
 * @param visitorCount - Number of visitors in the session
 * @returns Estimated time in milliseconds
 */
export function estimateExportTime(visitorCount: number): number {
    // Base time for PDF generation (2 seconds)
    const baseTime = 2000;

    // Additional time per visitor (50ms per visitor)
    const perVisitorTime = 50;

    // S3 upload time (1 second)
    const uploadTime = 1000;

    return baseTime + (visitorCount * perVisitorTime) + uploadTime;
}

/**
 * Checks if export should use streaming for large datasets
 * 
 * @param visitorCount - Number of visitors in the session
 * @returns True if streaming should be used
 */
export function shouldUseStreaming(visitorCount: number): boolean {
    // Use streaming for sessions with more than 100 visitors
    return visitorCount > 100;
}

/**
 * Optimizes visitor data for export by removing unnecessary fields
 * and formatting data for efficient processing
 * 
 * @param visitors - Array of visitors to optimize
 * @returns Optimized visitor data
 */
export function optimizeVisitorData(visitors: Visitor[]): Visitor[] {
    return visitors.map((visitor) => ({
        ...visitor,
        // Ensure all required fields are present
        notes: visitor.notes || '',
        followUpSentAt: visitor.followUpSentAt || undefined,
    }));
}

/**
 * Calculates progress percentage for export operations
 * 
 * @param current - Current step in the export process
 * @param total - Total steps in the export process
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(current: number, total: number): number {
    if (total === 0) return 0;
    return Math.min(Math.round((current / total) * 100), 100);
}

/**
 * Performance metrics for export operations
 */
export interface ExportMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    visitorCount: number;
    fileSize?: number;
    format: 'pdf' | 'csv';
}

/**
 * Creates a new export metrics tracker
 * 
 * @param visitorCount - Number of visitors being exported
 * @param format - Export format (pdf or csv)
 * @returns Export metrics object
 */
export function createExportMetrics(
    visitorCount: number,
    format: 'pdf' | 'csv'
): ExportMetrics {
    return {
        startTime: Date.now(),
        visitorCount,
        format,
    };
}

/**
 * Completes export metrics tracking
 * 
 * @param metrics - Export metrics object
 * @param fileSize - Size of the generated file in bytes
 * @returns Completed metrics object
 */
export function completeExportMetrics(
    metrics: ExportMetrics,
    fileSize: number
): ExportMetrics {
    const endTime = Date.now();
    return {
        ...metrics,
        endTime,
        duration: endTime - metrics.startTime,
        fileSize,
    };
}

/**
 * Logs export performance metrics for monitoring
 * 
 * @param metrics - Completed export metrics
 */
export function logExportMetrics(metrics: ExportMetrics): void {
    if (metrics.duration && metrics.fileSize) {
        console.log('[Export Performance]', {
            format: metrics.format,
            visitorCount: metrics.visitorCount,
            duration: `${metrics.duration}ms`,
            fileSize: `${(metrics.fileSize / 1024).toFixed(2)}KB`,
            meetsTarget: metrics.duration < 10000, // 10 second target
        });

        // Warn if export exceeds target time
        if (metrics.duration > 10000) {
            console.warn(
                `[Export Performance] Export exceeded 10-second target: ${metrics.duration}ms for ${metrics.visitorCount} visitors`
            );
        }
    }
}

/**
 * Validates that export meets performance requirements
 * 
 * @param metrics - Completed export metrics
 * @returns True if export meets performance requirements
 */
export function meetsPerformanceTarget(metrics: ExportMetrics): boolean {
    // For sessions with up to 100 visitors, export should complete in under 10 seconds
    if (metrics.visitorCount <= 100 && metrics.duration) {
        return metrics.duration < 10000;
    }

    // For larger sessions, allow proportionally more time
    if (metrics.duration) {
        const targetTime = 10000 + ((metrics.visitorCount - 100) * 100);
        return metrics.duration < targetTime;
    }

    return false;
}
