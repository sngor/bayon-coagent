/**
 * Tests for Reimagine Error Handler
 * 
 * Validates error classification, retry logic, and error response formatting
 */

import {
  classifyError,
  isRetryableError,
  formatErrorResponse,
  ThrottlingError,
  TimeoutError,
  ContentFilterError,
  ValidationError,
  StorageError,
  DatabaseError,
  NetworkError,
  ReimagineError,
} from '../reimagine-error-handler';

describe('Error Classification', () => {
  test('classifies throttling errors correctly', () => {
    const error = { code: 'ThrottlingException', message: 'Rate limit exceeded' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(ThrottlingError);
    expect(classified.code).toBe('THROTTLING');
    expect(classified.userMessage).toContain('busy');
  });

  test('classifies timeout errors correctly', () => {
    const error = { code: 'TimeoutError', message: 'Request timed out' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(TimeoutError);
    expect(classified.code).toBe('TIMEOUT');
    expect(classified.userMessage).toContain('took too long');
  });

  test('classifies content filter errors correctly', () => {
    const error = { message: 'Content filtered by safety policy' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(ContentFilterError);
    expect(classified.code).toBe('CONTENT_FILTERED');
    expect(classified.userMessage).toContain('safety filters');
  });

  test('classifies validation errors correctly', () => {
    const error = { code: 'ValidationException', message: 'Invalid parameter' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(ValidationError);
    expect(classified.code).toBe('VALIDATION');
  });

  test('classifies storage errors correctly', () => {
    const error = { message: 'S3 bucket not found' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(StorageError);
    expect(classified.code).toBe('STORAGE');
  });

  test('classifies database errors correctly', () => {
    const error = { message: 'DynamoDB provisioned throughput exceeded' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(DatabaseError);
    expect(classified.code).toBe('DATABASE');
  });

  test('classifies network errors correctly', () => {
    const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(NetworkError);
    expect(classified.code).toBe('NETWORK');
  });

  test('returns ReimagineError as-is', () => {
    const error = new ThrottlingError();
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBe(error);
  });

  test('classifies unknown errors as generic ReimagineError', () => {
    const error = { message: 'Unknown error' };
    const classified = classifyError(error, 'test-operation');
    
    expect(classified).toBeInstanceOf(ReimagineError);
    expect(classified.code).toBe('UNKNOWN');
  });
});

describe('Retryable Error Detection', () => {
  test('identifies throttling errors as retryable', () => {
    const error = new ThrottlingError();
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies timeout errors as retryable', () => {
    const error = new TimeoutError('test-operation');
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies network errors as retryable', () => {
    const error = new NetworkError();
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies storage errors as retryable', () => {
    const error = new StorageError('test-operation');
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies database errors as retryable', () => {
    const error = new DatabaseError('test-operation');
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies content filter errors as non-retryable', () => {
    const error = new ContentFilterError();
    expect(isRetryableError(error)).toBe(false);
  });

  test('identifies validation errors as non-retryable', () => {
    const error = new ValidationError('field', 'reason');
    expect(isRetryableError(error)).toBe(false);
  });

  test('identifies raw throttling exceptions as retryable', () => {
    const error = { code: 'ThrottlingException' };
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies 429 status codes as retryable', () => {
    const error = { statusCode: 429 };
    expect(isRetryableError(error)).toBe(true);
  });

  test('identifies 503 status codes as retryable', () => {
    const error = { statusCode: 503 };
    expect(isRetryableError(error)).toBe(true);
  });
});

describe('Error Response Formatting', () => {
  test('formats error response with user message', () => {
    const error = new ThrottlingError();
    const response = formatErrorResponse(error, 'test-operation');
    
    expect(response.success).toBe(false);
    expect(response.error).toBe(error.userMessage);
    expect(response.errorCode).toBe('THROTTLING');
    expect(response.recoverySuggestions).toEqual(error.recoverySuggestions);
  });

  test('formats error response for unknown errors', () => {
    const error = new Error('Unknown error');
    const response = formatErrorResponse(error, 'test-operation');
    
    expect(response.success).toBe(false);
    expect(response.error).toContain('unexpected error');
    expect(response.errorCode).toBe('UNKNOWN');
    expect(response.recoverySuggestions).toBeDefined();
  });

  test('includes recovery suggestions in response', () => {
    const error = new TimeoutError('test-operation');
    const response = formatErrorResponse(error, 'test-operation');
    
    expect(response.recoverySuggestions.length).toBeGreaterThan(0);
    expect(response.recoverySuggestions[0]).toContain('Try again');
  });
});

describe('Error Messages', () => {
  test('ThrottlingError has user-friendly message', () => {
    const error = new ThrottlingError();
    expect(error.userMessage).toContain('busy');
    expect(error.userMessage).toContain('try again');
  });

  test('TimeoutError has user-friendly message', () => {
    const error = new TimeoutError('test-operation');
    expect(error.userMessage).toContain('took too long');
  });

  test('ContentFilterError has user-friendly message', () => {
    const error = new ContentFilterError();
    expect(error.userMessage).toContain('safety filters');
    expect(error.userMessage).toContain('different image');
  });

  test('ValidationError has user-friendly message', () => {
    const error = new ValidationError('imageSize', 'exceeds 10MB');
    expect(error.userMessage).toContain('imageSize');
    expect(error.userMessage).toContain('exceeds 10MB');
  });

  test('StorageError has user-friendly message', () => {
    const error = new StorageError('upload');
    expect(error.userMessage).toContain('storage');
    expect(error.userMessage).toContain('temporarily unavailable');
  });

  test('DatabaseError has user-friendly message', () => {
    const error = new DatabaseError('save');
    expect(error.userMessage).toContain('Database');
    expect(error.userMessage).toContain('temporarily unavailable');
  });

  test('NetworkError has user-friendly message', () => {
    const error = new NetworkError();
    expect(error.userMessage).toContain('Network');
    expect(error.userMessage).toContain('internet connection');
  });
});

describe('Recovery Suggestions', () => {
  test('ThrottlingError provides actionable suggestions', () => {
    const error = new ThrottlingError();
    expect(error.recoverySuggestions.length).toBeGreaterThan(0);
    expect(error.recoverySuggestions.some(s => s.includes('Wait'))).toBe(true);
  });

  test('TimeoutError provides actionable suggestions', () => {
    const error = new TimeoutError('test-operation');
    expect(error.recoverySuggestions.length).toBeGreaterThan(0);
    expect(error.recoverySuggestions.some(s => s.includes('smaller image'))).toBe(true);
  });

  test('ContentFilterError provides actionable suggestions', () => {
    const error = new ContentFilterError();
    expect(error.recoverySuggestions.length).toBeGreaterThan(0);
    expect(error.recoverySuggestions.some(s => s.includes('different image'))).toBe(true);
  });

  test('NetworkError provides actionable suggestions', () => {
    const error = new NetworkError();
    expect(error.recoverySuggestions.length).toBeGreaterThan(0);
    expect(error.recoverySuggestions.some(s => s.includes('internet connection'))).toBe(true);
  });
});
