/**
 * CloudWatch Logs Integration
 * 
 * Provides direct integration with AWS CloudWatch Logs for production logging.
 * This is optional - by default, logs go to stdout and are captured by Lambda/ECS.
 */

import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { getConfig, getAWSCredentials } from '../config';
import type { LogEntry } from './logger';

export interface CloudWatchConfig {
  logGroupName: string;
  logStreamName: string;
  region: string;
}

/**
 * CloudWatch Logs client for direct log publishing
 */
export class CloudWatchLogger {
  private client: CloudWatchLogsClient;
  private config: CloudWatchConfig;
  private sequenceToken?: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: CloudWatchConfig) {
    this.config = config;
    const awsConfig = getConfig();
    const credentials = getAWSCredentials();

    this.client = new CloudWatchLogsClient({
      region: config.region || awsConfig.region,
      credentials: credentials.accessKeyId
        ? {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey!,
          }
        : undefined,
    });

    // Auto-flush logs every 5 seconds
    this.startAutoFlush();
  }

  /**
   * Initialize the log stream (create if it doesn't exist)
   */
  async initialize(): Promise<void> {
    try {
      // Check if log stream exists
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: this.config.logGroupName,
        logStreamNamePrefix: this.config.logStreamName,
      });

      const response = await this.client.send(describeCommand);
      const stream = response.logStreams?.find(
        (s) => s.logStreamName === this.config.logStreamName
      );

      if (stream) {
        this.sequenceToken = stream.uploadSequenceToken;
      } else {
        // Create log stream
        const createCommand = new CreateLogStreamCommand({
          logGroupName: this.config.logGroupName,
          logStreamName: this.config.logStreamName,
        });
        await this.client.send(createCommand);
      }
    } catch (error) {
      console.error('Failed to initialize CloudWatch log stream:', error);
      throw error;
    }
  }

  /**
   * Add a log entry to the buffer
   */
  log(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Flush if buffer is getting large
    if (this.logBuffer.length >= 100) {
      this.flush().catch((error) => {
        console.error('Failed to flush logs to CloudWatch:', error);
      });
    }
  }

  /**
   * Flush buffered logs to CloudWatch
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const command = new PutLogEventsCommand({
        logGroupName: this.config.logGroupName,
        logStreamName: this.config.logStreamName,
        logEvents: logsToSend.map((entry) => ({
          timestamp: new Date(entry.timestamp).getTime(),
          message: JSON.stringify(entry),
        })),
        sequenceToken: this.sequenceToken,
      });

      const response = await this.client.send(command);
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      // Put logs back in buffer on failure
      this.logBuffer.unshift(...logsToSend);
      throw error;
    }
  }

  /**
   * Start auto-flush interval
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Auto-flush failed:', error);
      });
    }, 5000);
  }

  /**
   * Stop auto-flush and flush remaining logs
   */
  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

/**
 * Create a CloudWatch logger instance
 */
export function createCloudWatchLogger(
  config: CloudWatchConfig
): CloudWatchLogger {
  return new CloudWatchLogger(config);
}
