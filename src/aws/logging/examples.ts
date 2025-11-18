/**
 * Logging Examples
 * 
 * Demonstrates how to integrate logging into various parts of the application.
 */

import { logger, createLogger, generateCorrelationId, withCorrelationId } from './logger';

// ============================================================================
// Example 1: Basic Logging
// ============================================================================

export function basicLoggingExample() {
  // Debug logs (only in local development)
  logger.debug('Detailed debugging information', { 
    variable: 'value',
    state: 'initialized' 
  });

  // Info logs (general information)
  logger.info('User logged in', { 
    userId: 'user-123',
    timestamp: Date.now() 
  });

  // Warning logs
  logger.warn('Rate limit approaching', { 
    current: 95,
    limit: 100,
    userId: 'user-123' 
  });

  // Error logs
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('Operation failed', error as Error, { 
      operation: 'processData',
      userId: 'user-123' 
    });
  }
}

// ============================================================================
// Example 2: Service-Specific Logger
// ============================================================================

export class AuthService {
  private logger = createLogger({ service: 'auth' });

  async login(email: string, password: string) {
    this.logger.info('Login attempt', { email });

    try {
      // Authenticate user...
      this.logger.info('Login successful', { email });
      return { success: true };
    } catch (error) {
      this.logger.error('Login failed', error as Error, { 
        email,
        reason: 'invalid_credentials' 
      });
      throw error;
    }
  }

  async logout(userId: string) {
    this.logger.info('Logout', { userId });
    // Logout logic...
  }
}

// ============================================================================
// Example 3: Operation Tracking with Duration
// ============================================================================

export async function operationTrackingExample() {
  const endOperation = logger.startOperation('dataProcessing', { 
    recordCount: 1000,
    source: 'api' 
  });

  try {
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Processing complete', { 
      recordsProcessed: 1000,
      errors: 0 
    });
  } finally {
    // Automatically logs completion with duration
    endOperation();
  }
}

// ============================================================================
// Example 4: Request Tracing with Correlation IDs
// ============================================================================

export async function handleAPIRequest(userId: string, action: string) {
  // Generate unique correlation ID for this request
  const correlationId = generateCorrelationId();
  
  // Create logger with correlation ID
  const requestLogger = createLogger({ 
    correlationId,
    userId,
    requestType: 'api' 
  });

  requestLogger.info('Request started', { action });

  try {
    // Process request...
    await processRequest(action, requestLogger);
    
    requestLogger.info('Request completed', { action });
  } catch (error) {
    requestLogger.error('Request failed', error as Error, { action });
    throw error;
  }
}

async function processRequest(action: string, logger: ReturnType<typeof createLogger>) {
  logger.debug('Processing action', { action });
  // All logs here will include the correlation ID
  await new Promise(resolve => setTimeout(resolve, 50));
}

// ============================================================================
// Example 5: Middleware Pattern
// ============================================================================

// Wrap a function to automatically add correlation ID and error logging
const authenticateUser = withCorrelationId(
  async (email: string, password: string) => {
    // Function implementation
    if (!email || !password) {
      throw new Error('Missing credentials');
    }
    return { userId: 'user-123', email };
  },
  'auth'
);

export async function middlewareExample() {
  try {
    const result = await authenticateUser('user@example.com', 'password');
    console.log('Authenticated:', result);
  } catch (error) {
    // Error is automatically logged with correlation ID
    console.error('Authentication failed');
  }
}

// ============================================================================
// Example 6: DynamoDB Integration
// ============================================================================

export class UserRepository {
  private logger = createLogger({ service: 'database', entity: 'user' });

  async getUser(userId: string) {
    this.logger.debug('Fetching user', { userId });

    const endOperation = this.logger.startOperation('dynamodb.get', { 
      table: 'Users',
      key: userId 
    });

    try {
      // Simulate DynamoDB call
      const user = { id: userId, name: 'John Doe' };
      
      this.logger.info('User fetched successfully', { 
        userId,
        found: true 
      });
      
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', error as Error, { 
        userId,
        operation: 'get' 
      });
      throw error;
    } finally {
      endOperation();
    }
  }

  async saveUser(user: any) {
    this.logger.info('Saving user', { userId: user.id });

    try {
      // Simulate DynamoDB put
      this.logger.debug('User saved', { 
        userId: user.id,
        fields: Object.keys(user) 
      });
    } catch (error) {
      this.logger.error('Failed to save user', error as Error, { 
        userId: user.id 
      });
      throw error;
    }
  }
}

// ============================================================================
// Example 7: Bedrock AI Integration
// ============================================================================

export class AIService {
  private logger = createLogger({ service: 'ai' });

  async generateContent(prompt: string, userId: string) {
    const correlationId = generateCorrelationId();
    const requestLogger = this.logger.child({ correlationId, userId });

    requestLogger.info('AI generation started', { 
      promptLength: prompt.length,
      model: 'claude-3-5-sonnet' 
    });

    const endOperation = requestLogger.startOperation('bedrock.invoke', { 
      model: 'claude-3-5-sonnet' 
    });

    try {
      // Simulate Bedrock call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = {
        content: 'Generated content...',
        inputTokens: 100,
        outputTokens: 150,
      };

      requestLogger.info('AI generation successful', { 
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.inputTokens + response.outputTokens 
      });

      return response;
    } catch (error) {
      requestLogger.error('AI generation failed', error as Error, { 
        model: 'claude-3-5-sonnet',
        promptLength: prompt.length 
      });
      throw error;
    } finally {
      endOperation();
    }
  }
}

// ============================================================================
// Example 8: S3 Integration
// ============================================================================

export class StorageService {
  private logger = createLogger({ service: 'storage' });

  async uploadFile(key: string, file: Buffer, userId: string) {
    this.logger.info('File upload started', { 
      key,
      size: file.length,
      userId 
    });

    const endOperation = this.logger.startOperation('s3.upload', { 
      key,
      size: file.length 
    });

    try {
      // Simulate S3 upload
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.logger.info('File uploaded successfully', { 
        key,
        size: file.length,
        userId 
      });

      return { key, url: `https://s3.amazonaws.com/bucket/${key}` };
    } catch (error) {
      this.logger.error('File upload failed', error as Error, { 
        key,
        size: file.length,
        userId 
      });
      throw error;
    } finally {
      endOperation();
    }
  }

  async deleteFile(key: string, userId: string) {
    this.logger.info('File deletion started', { key, userId });

    try {
      // Simulate S3 delete
      this.logger.info('File deleted successfully', { key, userId });
    } catch (error) {
      this.logger.error('File deletion failed', error as Error, { 
        key,
        userId 
      });
      throw error;
    }
  }
}

// ============================================================================
// Example 9: Child Logger Pattern
// ============================================================================

export class OrderService {
  private logger = createLogger({ service: 'orders' });

  async processOrder(orderId: string, userId: string) {
    // Create a child logger with order-specific context
    const orderLogger = this.logger.child({ orderId, userId });

    orderLogger.info('Processing order');

    try {
      await this.validateOrder(orderId, orderLogger);
      await this.chargePayment(orderId, orderLogger);
      await this.fulfillOrder(orderId, orderLogger);

      orderLogger.info('Order processed successfully');
    } catch (error) {
      orderLogger.error('Order processing failed', error as Error);
      throw error;
    }
  }

  private async validateOrder(orderId: string, logger: ReturnType<typeof createLogger>) {
    logger.debug('Validating order');
    // Validation logic...
  }

  private async chargePayment(orderId: string, logger: ReturnType<typeof createLogger>) {
    logger.debug('Charging payment');
    // Payment logic...
  }

  private async fulfillOrder(orderId: string, logger: ReturnType<typeof createLogger>) {
    logger.debug('Fulfilling order');
    // Fulfillment logic...
  }
}

// ============================================================================
// Example 10: Error Context Enrichment
// ============================================================================

export class PaymentService {
  private logger = createLogger({ service: 'payment' });

  async processPayment(amount: number, userId: string) {
    try {
      // Simulate payment processing
      if (amount <= 0) {
        throw new Error('Invalid amount');
      }

      this.logger.info('Payment processed', { 
        amount,
        userId,
        currency: 'USD' 
      });
    } catch (error) {
      // Enrich error with additional context
      const enrichedError = error as Error;
      
      this.logger.error('Payment processing failed', enrichedError, {
        amount,
        userId,
        currency: 'USD',
        paymentMethod: 'credit_card',
        attemptNumber: 1,
        // Add any other relevant context
      });

      throw error;
    }
  }
}
