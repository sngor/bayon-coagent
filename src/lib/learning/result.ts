/**
 * Result type for consistent error handling across learning features
 */

export type Result<T, E = string> =
    | { success: true; data: T }
    | { success: false; error: E };

export type AsyncResult<T, E = string> = Promise<Result<T, E>>;

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T, never> {
    return { success: true, data };
}

/**
 * Create an error result
 */
export function error<E>(error: E): Result<never, E> {
    return { success: false, error };
}

/**
 * Transform a Result's data while preserving error state
 */
export function map<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => U
): Result<U, E> {
    return result.success ? success(fn(result.data)) : result;
}

/**
 * Chain Results together (flatMap)
 */
export function chain<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>
): Result<U, E> {
    return result.success ? fn(result.data) : result;
}

/**
 * Handle async operations with Result pattern
 */
export async function asyncTry<T>(
    operation: () => Promise<T>,
    errorMessage?: string
): AsyncResult<T> {
    try {
        const data = await operation();
        return success(data);
    } catch (err) {
        const message = errorMessage ||
            (err instanceof Error ? err.message : 'Unknown error');
        return error(message);
    }
}

/**
 * Validate input and return Result
 */
export function validate<T>(
    data: unknown,
    validator: (data: unknown) => data is T,
    errorMessage: string
): Result<T> {
    return validator(data) ? success(data) : error(errorMessage);
}

/**
 * Type guard for successful results
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
}

/**
 * Type guard for error results
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
}

/**
 * Extract data from Result or throw error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.success) {
        return result.data;
    }
    throw new Error(typeof result.error === 'string' ? result.error : 'Operation failed');
}

/**
 * Extract data from Result or return default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.success ? result.data : defaultValue;
}