/**
 * Migration Utility Functions
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write JSON file
 */
export function writeJsonFile(filePath: string, data: any): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read JSON file
 */
export function readJsonFile<T = any>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Progress tracker
 */
export class ProgressTracker {
  private total: number;
  private current: number = 0;
  private errors: number = 0;
  private startTime: number;
  private lastLogTime: number = 0;
  private logInterval: number = 1000; // Log every second

  constructor(total: number, private label: string = 'Progress') {
    this.total = total;
    this.startTime = Date.now();
  }

  increment(success: boolean = true): void {
    this.current++;
    if (!success) {
      this.errors++;
    }
    
    const now = Date.now();
    if (now - this.lastLogTime >= this.logInterval) {
      this.log();
      this.lastLogTime = now;
    }
  }

  log(): void {
    const percentage = ((this.current / this.total) * 100).toFixed(1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.current / elapsed;
    const remaining = (this.total - this.current) / rate;
    
    console.log(
      `${this.label}: ${this.current}/${this.total} (${percentage}%) | ` +
      `${rate.toFixed(1)} items/s | ` +
      `ETA: ${formatTime(remaining)} | ` +
      `Errors: ${this.errors}`
    );
  }

  finish(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(
      `\n${this.label} Complete: ${this.current}/${this.total} in ${formatTime(elapsed)} | ` +
      `Errors: ${this.errors}`
    );
  }

  getStats() {
    return {
      total: this.total,
      current: this.current,
      errors: this.errors,
      percentage: (this.current / this.total) * 100,
    };
  }
}

/**
 * Format time in seconds to human readable
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

/**
 * Error logger
 */
export class ErrorLogger {
  private errors: Array<{
    timestamp: string;
    operation: string;
    error: string;
    data?: any;
  }> = [];

  constructor(private filePath: string) {
    // Load existing errors if file exists
    if (fileExists(filePath)) {
      try {
        this.errors = readJsonFile(filePath);
      } catch (e) {
        console.warn('Could not load existing error log:', e);
      }
    }
  }

  log(operation: string, error: Error | string, data?: any): void {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      error: error instanceof Error ? error.message : error,
      data,
    };
    
    this.errors.push(errorEntry);
    console.error(`ERROR [${operation}]:`, error);
    
    // Write to file
    this.save();
  }

  save(): void {
    writeJsonFile(this.filePath, this.errors);
  }

  getErrors() {
    return this.errors;
  }

  clear(): void {
    this.errors = [];
    this.save();
  }
}

/**
 * Batch processor
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }
  
  return results;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
export function sanitizeForLog(data: any): any {
  const sanitized = deepClone(data);
  
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey'];
  
  function sanitizeObject(obj: any): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
  
  sanitizeObject(sanitized);
  return sanitized;
}
