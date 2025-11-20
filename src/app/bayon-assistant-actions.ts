'use server';

/**
 * Bayon AI Assistant Server Actions
 * 
 * Server actions for the Bayon AI Assistant chat interface.
 * Handles chat queries, streaming responses, and conversation logging.
 * 
 * Requirements: 1.1, 3.1, 4.1, 7.4, 2.1
 */

import { z } from 'zod';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import { getAgentProfileRepository } from '@/aws/dynamodb/agent-profile-repository';
import { getWorkflowOrchestrator } from '@/aws/bedrock/orchestrator';
import { GuardrailsService } from '@/aws/bedrock/guardrails';
import { getRepository } from '@/aws/dynamodb/repository';
import { getConversationKeys } from '@/aws/dynamodb/keys';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat query input schema
 */
const chatQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(5000, 'Query is too long'),
  conversationId: z.string().optional(),
});

/**
 * Chat query response
 */
export interface ChatQueryResponse {
  success: boolean;
  message?: string;
  data?: {
    conversationId: string;
    response: string;
    keyPoints: string[];
    citations: Array<{
      url: string;
      title: string;
      sourceType: string;
    }>;
    executionTime: number;
  };
  error?: string;
  guardrailViolation?: {
    reason: string;
    suggestion?: string;
  };
}

/**
 * Handles a chat query from the user
 * 
 * Requirements:
 * - 1.1: Integrate guardrails validation
 * - 3.1: Load and apply agent profile
 * - 4.1: Wire up orchestrator for complex requests
 * 
 * @param formData Form data containing the query
 * @returns Chat query response
 */
export async function handleChatQuery(
  prevState: any,
  formData: FormData
): Promise<ChatQueryResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    const validatedFields = chatQuerySchema.safeParse({
      query: formData.get('query'),
      conversationId: formData.get('conversationId'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || 'Invalid input',
      };
    }

    const { query, conversationId } = validatedFields.data;

    // Get current user (authentication)
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to use the AI assistant.',
      };
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);

    // Step 1: Guardrails validation (Requirement 1.1)
    const guardrailsService = new GuardrailsService();
    const guardrailsResult = guardrailsService.validateRequest(query, {
      allowedDomains: ['real-estate', 'property', 'market', 'listing', 'client'],
      blockedTopics: ['medical', 'legal-advice', 'financial-guarantees', 'illegal'],
      piiDetectionEnabled: true,
      maxPromptLength: 5000,
    });

    if (!guardrailsResult.allowed) {
      return {
        success: false,
        guardrailViolation: {
          reason: guardrailsResult.reason || 'Query violates safety guidelines',
          suggestion: getSuggestionForViolation(guardrailsResult.reason),
        },
      };
    }

    // Use sanitized prompt if PII was detected
    const sanitizedQuery = guardrailsResult.sanitizedPrompt || query;

    // Step 2: Load agent profile (Requirement 3.1)
    const profileRepository = getAgentProfileRepository();
    const agentProfile = await profileRepository.getProfile(user.id);

    // Step 3: Execute workflow orchestration (Requirement 4.1)
    const orchestrator = getWorkflowOrchestrator();
    const workflowResult = await orchestrator.executeCompleteWorkflow(
      sanitizedQuery,
      agentProfile || undefined
    );

    // Step 4: Save conversation to DynamoDB
    const conversationIdToUse = conversationId || uuidv4();
    await saveConversation(
      user.id,
      conversationIdToUse,
      query,
      workflowResult.synthesizedResponse,
      workflowResult.citations,
      workflowResult.tasks.map(t => t.id)
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Query processed successfully',
      data: {
        conversationId: conversationIdToUse,
        response: workflowResult.synthesizedResponse,
        keyPoints: workflowResult.keyPoints,
        citations: workflowResult.citations,
        executionTime,
      },
    };
  } catch (error) {
    console.error('Chat query error:', error);
    
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while processing your query.',
    };
  }
}

/**
 * Gets a suggestion for a guardrails violation
 * @param reason Violation reason
 * @returns Helpful suggestion
 */
function getSuggestionForViolation(reason?: string): string {
  if (!reason) {
    return 'Please ask a real estate-related question.';
  }

  const lowerReason = reason.toLowerCase();

  if (lowerReason.includes('domain') || lowerReason.includes('real estate')) {
    return 'I can only assist with real estate-related questions. Try asking about market trends, property analysis, or client communication.';
  }

  if (lowerReason.includes('pii') || lowerReason.includes('personal')) {
    return 'Please avoid sharing sensitive personal information like social security numbers, credit card numbers, or detailed financial data.';
  }

  if (lowerReason.includes('guarantee') || lowerReason.includes('financial')) {
    return 'I cannot provide financial guarantees or investment advice. For specific financial guidance, please consult a licensed financial advisor.';
  }

  if (lowerReason.includes('legal')) {
    return 'I cannot provide legal advice. For legal matters, please consult a licensed attorney.';
  }

  if (lowerReason.includes('unethical') || lowerReason.includes('illegal')) {
    return 'I cannot assist with unethical or illegal activities.';
  }

  return 'Please rephrase your question to focus on real estate topics.';
}

/**
 * Saves a conversation to DynamoDB
 * @param userId User ID
 * @param conversationId Conversation ID
 * @param userQuery User's query
 * @param assistantResponse Assistant's response
 * @param citations Citations used
 * @param workflowTasks Task IDs from workflow
 */
async function saveConversation(
  userId: string,
  conversationId: string,
  userQuery: string,
  assistantResponse: string,
  citations: Array<{ url: string; title: string; sourceType: string }>,
  workflowTasks: string[]
): Promise<void> {
  const repository = getRepository();
  const now = new Date().toISOString();

  // Get existing conversation or create new
  const keys = getConversationKeys(userId, conversationId);
  const existingItem = await repository.getItem(keys.PK, keys.SK);

  const newMessage = {
    role: 'user' as const,
    content: userQuery,
    timestamp: now,
  };

  const assistantMessage = {
    role: 'assistant' as const,
    content: assistantResponse,
    timestamp: new Date().toISOString(),
    citations: citations.map(c => c.url),
    workflowTasks,
  };

  if (existingItem && existingItem.Data) {
    // Append to existing conversation
    const existingData = existingItem.Data as any;
    const messages = existingData.messages || [];
    messages.push(newMessage, assistantMessage);

    await repository.update(keys.PK, keys.SK, {
      messages,
      updatedAt: now,
    });
  } else {
    // Create new conversation
    await repository.create(
      keys.PK,
      keys.SK,
      'Conversation',
      {
        conversationId,
        messages: [newMessage, assistantMessage],
        createdAt: now,
        updatedAt: now,
      }
    );
  }
}



/**
 * Retrieves a conversation by ID
 * @param userId User ID
 * @param conversationId Conversation ID
 * @returns Conversation data or null
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<{
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    citations?: string[];
    workflowTasks?: string[];
  }>;
  createdAt: string;
  updatedAt: string;
} | null> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return null;
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return null;
    }

    const repository = getRepository();
    const keys = getConversationKeys(userId, conversationId);
    const conversation = await repository.get(keys.PK, keys.SK);

    if (!conversation) {
      return null;
    }

    return conversation as any;
  } catch (error) {
    console.error('Get conversation error:', error);
    return null;
  }
}

/**
 * Lists all conversations for a user
 * @param userId User ID
 * @returns Array of conversation summaries
 */
export async function listConversations(
  userId: string
): Promise<Array<{
  conversationId: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}>> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return [];
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return [];
    }

    const repository = getRepository();
    const result = await repository.query(`USER#${userId}`, 'CONVERSATION#');

    return result.items
      .map((data: any) => {
        const messages = data?.messages || [];
        const lastMessage = messages[messages.length - 1];

        return {
          conversationId: data?.conversationId || '',
          lastMessage: lastMessage?.content?.substring(0, 100) || '',
          messageCount: messages.length,
          createdAt: data?.createdAt || '',
          updatedAt: data?.updatedAt || '',
        };
      })
      .sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch (error) {
    console.error('List conversations error:', error);
    return [];
  }
}

/**
 * Deletes a conversation
 * @param userId User ID
 * @param conversationId Conversation ID
 * @returns Success status
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const repository = getRepository();
    const keys = getConversationKeys(userId, conversationId);
    await repository.delete(keys.PK, keys.SK);

    return { success: true };
  } catch (error) {
    console.error('Delete conversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation',
    };
  }
}

/**
 * Streaming chat query handler
 * 
 * Requirement 7.4: Streaming support for real-time responses
 * 
 * @param query User's query
 * @param conversationId Optional conversation ID
 * @returns Readable stream of response chunks
 */
export async function handleChatQueryStream(
  query: string,
  conversationId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Validate input
        const validatedFields = chatQuerySchema.safeParse({
          query,
          conversationId,
        });

        if (!validatedFields.success) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: validatedFields.error.errors[0]?.message || 'Invalid input',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        // Get current user
        const cognitoClient = getCognitoClient();
        const session = await cognitoClient.getSession();
        
        if (!session) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: 'Authentication required. Please sign in to use the AI assistant.',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        const user = await cognitoClient.getCurrentUser(session.accessToken);

        // Send progress: Validating query
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Validating query...',
          step: 1,
          totalSteps: 5,
        }) + '\n'));

        // Guardrails validation
        const guardrailsService = new GuardrailsService();
        const guardrailsResult = guardrailsService.validateRequest(query, {
          allowedDomains: ['real-estate', 'property', 'market', 'listing', 'client'],
          blockedTopics: ['medical', 'legal-advice', 'financial-guarantees', 'illegal'],
          piiDetectionEnabled: true,
          maxPromptLength: 5000,
        });

        if (!guardrailsResult.allowed) {
          const errorMessage = JSON.stringify({
            type: 'guardrail_violation',
            reason: guardrailsResult.reason || 'Query violates safety guidelines',
            suggestion: getSuggestionForViolation(guardrailsResult.reason),
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        const sanitizedQuery = guardrailsResult.sanitizedPrompt || query;

        // Send progress: Loading profile
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Loading your agent profile...',
          step: 2,
          totalSteps: 5,
        }) + '\n'));

        // Load agent profile
        const profileRepository = getAgentProfileRepository();
        const agentProfile = await profileRepository.getProfile(user.id);

        // Send progress: Analyzing query
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Analyzing your query...',
          step: 3,
          totalSteps: 5,
        }) + '\n'));

        // Execute workflow
        const orchestrator = getWorkflowOrchestrator();
        
        // Send progress: Processing
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Processing with AI agents...',
          step: 4,
          totalSteps: 5,
        }) + '\n'));

        const workflowResult = await orchestrator.executeCompleteWorkflow(
          sanitizedQuery,
          agentProfile || undefined
        );

        // Send progress: Finalizing
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Finalizing response...',
          step: 5,
          totalSteps: 5,
        }) + '\n'));

        // Save conversation
        const conversationIdToUse = conversationId || uuidv4();
        await saveConversation(
          user.id,
          conversationIdToUse,
          query,
          workflowResult.synthesizedResponse,
          workflowResult.citations,
          workflowResult.tasks.map(t => t.id)
        );

        // Send final response
        const responseMessage = JSON.stringify({
          type: 'response',
          data: {
            conversationId: conversationIdToUse,
            response: workflowResult.synthesizedResponse,
            keyPoints: workflowResult.keyPoints,
            citations: workflowResult.citations,
            executionTime: workflowResult.executionTime,
          },
        }) + '\n';
        controller.enqueue(encoder.encode(responseMessage));

        // Send completion
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'complete',
        }) + '\n'));

        controller.close();
      } catch (error) {
        console.error('Streaming chat query error:', error);
        
        const errorMessage = JSON.stringify({
          type: 'error',
          error: error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred while processing your query.',
        }) + '\n';
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });
}

/**
 * Server action wrapper for streaming chat query
 * This is the actual server action that can be called from the client
 */
export async function streamChatQuery(
  query: string,
  conversationId?: string
): Promise<Response> {
  try {
    const stream = await handleChatQueryStream(query, conversationId);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream chat query error:', error);
    
    return new Response(
      JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to start stream',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
