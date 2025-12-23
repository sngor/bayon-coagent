/**
 * Timeout utility for async operations
 */

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    
    // Cleanup timeout if promise resolves first
    promise.finally(() => clearTimeout(timeoutId));
  });

  return Promise.race([promise, timeoutPromise]);
}

export function createAbortableTimeout(timeoutMs: number) {
  const controller = new AbortController();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        reject(new Error('Operation timed out'));
      }
    }, timeoutMs);
    
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });
  });
  
  return { promise: timeoutPromise, abort: () => controller.abort() };
}