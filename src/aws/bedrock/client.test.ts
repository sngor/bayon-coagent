/**
 * Tests for AWS Bedrock Client
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BedrockClient, BedrockError, BedrockParseError } from './client';
import { z } from 'zod';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    InvokeModelCommand: jest.fn(),
    InvokeModelWithResponseStreamCommand: jest.fn(),
  };
});

// Mock config
jest.mock('@/aws/config', () => ({
  getConfig: jest.fn(() => ({
    region: 'us-east-1',
    environment: 'local',
    bedrock: {
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      region: 'us-east-1',
      endpoint: undefined,
    },
  })),
  getAWSCredentials: jest.fn(() => ({
    accessKeyId: 'test',
    secretAccessKey: 'test',
  })),
}));

describe('BedrockClient', () => {
  let client: BedrockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new BedrockClient();
  });

  describe('constructor', () => {
    it('should create a client with default model', () => {
      expect(client).toBeInstanceOf(BedrockClient);
    });

    it('should create a client with custom model', () => {
      const customClient = new BedrockClient('custom-model-id');
      expect(customClient).toBeInstanceOf(BedrockClient);
    });
  });

  describe('invoke', () => {
    it('should successfully invoke model with valid response', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            completion: JSON.stringify({ result: 'test output' }),
          })
        ),
      };

      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });
      const result = await client.invoke('test prompt', schema);

      expect(result).toEqual({ result: 'test output' });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw BedrockError on empty response', async () => {
      const mockSend = jest.fn().mockResolvedValue({ body: null });
      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });

      await expect(client.invoke('test prompt', schema)).rejects.toThrow(
        BedrockError
      );
    });

    it('should throw BedrockParseError on schema validation failure', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            completion: JSON.stringify({ wrong: 'field' }),
          })
        ),
      };

      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });

      await expect(client.invoke('test prompt', schema)).rejects.toThrow(
        BedrockParseError
      );
    });

    it('should retry on throttling errors', async () => {
      const throttleError = {
        name: 'ThrottlingException',
        message: 'Rate exceeded',
      };

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            completion: JSON.stringify({ result: 'success' }),
          })
        ),
      };

      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(throttleError)
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce(mockResponse);

      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });
      const result = await client.invoke('test prompt', schema, {
        retryConfig: { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 },
      });

      expect(result).toEqual({ result: 'success' });
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const validationError = {
        name: 'ValidationException',
        message: 'Invalid input',
      };

      const mockSend = jest.fn().mockRejectedValue(validationError);
      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });

      await expect(
        client.invoke('test prompt', schema, {
          retryConfig: { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 },
        })
      ).rejects.toThrow(BedrockError);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('invokeStream', () => {
    it('should stream response chunks', async () => {
      const mockChunks = [
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ delta: { text: 'Hello' } })) } },
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ delta: { text: ' World' } })) } },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      const mockResponse = { body: mockStream };
      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.send = mockSend;

      const chunks: string[] = [];
      for await (const chunk of client.invokeStream('test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw BedrockError on empty stream', async () => {
      const mockSend = jest.fn().mockResolvedValue({ body: null });
      (client as any).client.send = mockSend;

      const generator = client.invokeStream('test prompt');
      
      await expect(generator.next()).rejects.toThrow(BedrockError);
    });
  });

  describe('invokeWithPrompts', () => {
    it('should combine system and user prompts', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            completion: JSON.stringify({ result: 'combined output' }),
          })
        ),
      };

      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.send = mockSend;

      const schema = z.object({ result: z.string() });
      const result = await client.invokeWithPrompts(
        'You are a helpful assistant',
        'What is 2+2?',
        schema
      );

      expect(result).toEqual({ result: 'combined output' });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('invokeStreamWithPrompts', () => {
    it('should stream with combined prompts', async () => {
      const mockChunks = [
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ delta: { text: 'Answer' } })) } },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      const mockResponse = { body: mockStream };
      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.send = mockSend;

      const chunks: string[] = [];
      for await (const chunk of client.invokeStreamWithPrompts(
        'You are a helpful assistant',
        'What is 2+2?'
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Answer']);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should create BedrockError with all properties', () => {
      const error = new BedrockError('Test error', 'TEST_CODE', 400, new Error('Original'));
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.name).toBe('BedrockError');
    });

    it('should create BedrockParseError with validation errors', () => {
      const schema = z.object({ field: z.string() });
      const result = schema.safeParse({ wrong: 'data' });
      
      const error = new BedrockParseError(
        'Parse failed',
        { wrong: 'data' },
        result.success ? undefined : result.error
      );

      expect(error.message).toBe('Parse failed');
      expect(error.response).toEqual({ wrong: 'data' });
      expect(error.validationErrors).toBeDefined();
      expect(error.name).toBe('BedrockParseError');
    });
  });
});
