/**
 * AI Operation Tracker
 * 
 * Tracks AI operation execution times and provides estimates for future operations.
 * Stores historical data in localStorage for persistence across sessions.
 */

export interface AIOperationMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface AIOperationEstimate {
  estimatedDuration: number; // in milliseconds
  confidence: 'low' | 'medium' | 'high';
  basedOnSamples: number;
}

const STORAGE_KEY = 'ai_operation_history';
const MAX_HISTORY_PER_OPERATION = 10;

/**
 * Get historical data for an operation
 */
function getOperationHistory(operationName: string): AIOperationMetrics[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allHistory: Record<string, AIOperationMetrics[]> = JSON.parse(stored);
    return allHistory[operationName] || [];
  } catch (error) {
    console.error('Failed to load operation history:', error);
    return [];
  }
}

/**
 * Save operation metrics to history
 */
function saveOperationMetrics(metrics: AIOperationMetrics): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allHistory: Record<string, AIOperationMetrics[]> = stored ? JSON.parse(stored) : {};
    
    if (!allHistory[metrics.operationName]) {
      allHistory[metrics.operationName] = [];
    }
    
    // Add new metrics
    allHistory[metrics.operationName].push(metrics);
    
    // Keep only the most recent entries
    if (allHistory[metrics.operationName].length > MAX_HISTORY_PER_OPERATION) {
      allHistory[metrics.operationName] = allHistory[metrics.operationName].slice(-MAX_HISTORY_PER_OPERATION);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
  } catch (error) {
    console.error('Failed to save operation metrics:', error);
  }
}

/**
 * Calculate estimated duration for an operation based on historical data
 */
export function getOperationEstimate(operationName: string): AIOperationEstimate {
  const history = getOperationHistory(operationName);
  
  // Filter for completed operations only
  const completedOps = history.filter(op => op.status === 'completed' && op.duration);
  
  if (completedOps.length === 0) {
    // No historical data - return default estimates based on operation type
    return getDefaultEstimate(operationName);
  }
  
  // Calculate average duration
  const durations = completedOps.map(op => op.duration!);
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  
  // Determine confidence based on sample size
  let confidence: 'low' | 'medium' | 'high';
  if (completedOps.length >= 5) {
    confidence = 'high';
  } else if (completedOps.length >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    estimatedDuration: Math.round(avgDuration),
    confidence,
    basedOnSamples: completedOps.length,
  };
}

/**
 * Get default estimates for operations without historical data
 */
function getDefaultEstimate(operationName: string): AIOperationEstimate {
  const defaults: Record<string, number> = {
    'generate-marketing-plan': 15000, // 15 seconds
    'run-nap-audit': 20000, // 20 seconds
    'find-competitors': 25000, // 25 seconds
    'generate-blog-post': 30000, // 30 seconds
    'run-research-agent': 45000, // 45 seconds
    'generate-neighborhood-guide': 20000, // 20 seconds
    'generate-listing-description': 10000, // 10 seconds
    'generate-social-media-post': 8000, // 8 seconds
    'generate-video-script': 15000, // 15 seconds
    'generate-market-update': 12000, // 12 seconds
    'analyze-reviews': 10000, // 10 seconds
  };
  
  return {
    estimatedDuration: defaults[operationName] || 15000,
    confidence: 'low',
    basedOnSamples: 0,
  };
}

/**
 * AI Operation Tracker class for managing operation lifecycle
 */
export class AIOperationTracker {
  private metrics: AIOperationMetrics;
  private abortController: AbortController;
  private onProgressCallback?: (progress: number, message: string) => void;
  
  constructor(operationName: string) {
    this.metrics = {
      operationName,
      startTime: Date.now(),
      status: 'pending',
    };
    this.abortController = new AbortController();
  }
  
  /**
   * Start tracking the operation
   */
  start(): void {
    this.metrics.status = 'running';
    this.metrics.startTime = Date.now();
  }
  
  /**
   * Mark operation as completed
   */
  complete(): void {
    this.metrics.status = 'completed';
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    saveOperationMetrics(this.metrics);
  }
  
  /**
   * Mark operation as failed
   */
  fail(error: string): void {
    this.metrics.status = 'failed';
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.error = error;
    saveOperationMetrics(this.metrics);
  }
  
  /**
   * Cancel the operation
   */
  cancel(): void {
    this.metrics.status = 'cancelled';
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.abortController.abort();
    saveOperationMetrics(this.metrics);
  }
  
  /**
   * Get abort signal for cancellation
   */
  getAbortSignal(): AbortSignal {
    return this.abortController.signal;
  }
  
  /**
   * Check if operation was cancelled
   */
  isCancelled(): boolean {
    return this.abortController.signal.aborted;
  }
  
  /**
   * Set progress callback
   */
  onProgress(callback: (progress: number, message: string) => void): void {
    this.onProgressCallback = callback;
  }
  
  /**
   * Update progress
   */
  updateProgress(progress: number, message: string): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(progress, message);
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): AIOperationMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.metrics.startTime;
  }
  
  /**
   * Get estimated time remaining based on historical data
   */
  getEstimatedTimeRemaining(): number {
    const estimate = getOperationEstimate(this.metrics.operationName);
    const elapsed = this.getElapsedTime();
    const remaining = estimate.estimatedDuration - elapsed;
    return Math.max(0, remaining);
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return 'less than a second';
  }
  
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
}

/**
 * Get contextual status message based on operation and progress
 */
export function getContextualMessage(
  operationName: string,
  progress: number
): string {
  const messages: Record<string, string[]> = {
    'generate-marketing-plan': [
      'Analyzing your profile and market...',
      'Researching competitor strategies...',
      'Crafting personalized action items...',
      'Finalizing your marketing plan...',
    ],
    'run-nap-audit': [
      'Searching for your business listings...',
      'Checking NAP consistency...',
      'Analyzing citation quality...',
      'Compiling audit results...',
    ],
    'find-competitors': [
      'Searching for competitors in your area...',
      'Analyzing competitor profiles...',
      'Gathering market intelligence...',
      'Ranking competitors by relevance...',
    ],
    'generate-blog-post': [
      'Researching your topic...',
      'Structuring the article...',
      'Writing engaging content...',
      'Adding SEO optimization...',
    ],
    'run-research-agent': [
      'Initiating deep research...',
      'Gathering information from multiple sources...',
      'Analyzing and synthesizing data...',
      'Preparing comprehensive report...',
    ],
    'generate-neighborhood-guide': [
      'Researching neighborhood data...',
      'Gathering local insights...',
      'Crafting compelling descriptions...',
      'Finalizing your guide...',
    ],
  };
  
  const operationMessages = messages[operationName] || [
    'Processing your request...',
    'AI is working...',
    'Almost there...',
    'Finishing up...',
  ];
  
  // Map progress (0-100) to message index
  const messageIndex = Math.min(
    Math.floor((progress / 100) * operationMessages.length),
    operationMessages.length - 1
  );
  
  return operationMessages[messageIndex];
}
