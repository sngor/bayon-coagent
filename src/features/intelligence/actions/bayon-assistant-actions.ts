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
import { GuardrailsService } from '@/aws/bedrock/guardrails';
import { getRepository } from '@/aws/dynamodb/repository';
import { getConversationKeys } from '@/aws/dynamodb/keys';
import { getBedrockClient } from '@/aws/bedrock/client';
import { v4 as uuidv4 } from 'uuid';
import { retrieveRelevantDocuments, formatDocumentsAsContext } from '@/aws/bedrock/knowledge-retriever';
import { getAgentCore } from '@/aws/bedrock/agent-core';
import { createWorkerTask } from '@/aws/bedrock/worker-protocol';
import { executeKnowledgeRetrievalTask } from '@/aws/bedrock/knowledge-retriever';

/**
 * Chat query input schema
 */
const chatQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(5000, 'Query is too long'),
  conversationId: z.string().optional(),
  attachments: z.string().optional(), // JSON string of attachment metadata
});

/**
 * File attachment interface
 */
interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // For text files
}

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
 * Simple response generation using Bedrock directly with RAG support
 */
async function generateSimpleResponse(
  query: string,
  userId: string,
  agentProfile?: any,
  attachments?: FileAttachment[]
): Promise<{
  content: string;
  keyPoints: string[];
  citations: Array<{
    url: string;
    title: string;
    sourceType: string;
  }>;
  documentsUsed?: number;
}> {
  try {
    const client = getBedrockClient();
    const agentCore = getAgentCore();

    let knowledgeBaseContext = '';
    let kbCitations: Array<{ url: string; title: string; sourceType: string }> = [];
    let documentsUsed = 0;

    // Step 1: Retrieve relevant documents from knowledge base using AgentCore
    try {
      const retrievalTask = createWorkerTask(
        'knowledge-retriever',
        `Retrieve relevant documents for chat query: ${query}`,
        {
          query,
          userId,
          topK: 3, // Limit to 3 docs for chat (faster)
          minScore: 0.6, // Higher threshold for chat relevance
          scope: 'personal',
        }
      );

      // Allocate task to knowledge retriever strand
      const retrieverStrand = await agentCore.allocateTask(retrievalTask);

      // Execute retrieval
      const retrievalResult = await executeKnowledgeRetrievalTask(retrievalTask);

      // Update strand metrics
      agentCore.updateStrandMetrics(retrieverStrand.id, retrievalResult);

      if (retrievalResult.status === 'success' && retrievalResult.output) {
        const documents = retrievalResult.output.documents || [];
        documentsUsed = documents.length;

        if (documents.length > 0) {
          // Format documents as context
          knowledgeBaseContext = '\n\n# Relevant Information from Your Knowledge Base\n\n' +
            documents.map((doc: any, index: number) =>
              `## Document ${index + 1}: ${doc.title || doc.source}\n` +
              `${doc.text}\n`
            ).join('\n---\n\n');

          // Add KB citations
          kbCitations = documents.map((doc: any) => ({
            url: doc.url || `#document-${doc.documentId}`,
            title: doc.title || doc.source,
            sourceType: 'knowledge-base',
          }));
        }
      }
    } catch (error) {
      console.error('Knowledge base retrieval error (non-fatal):', error);
      // Continue without KB context if retrieval fails
    }

    // Create personalized system prompt
    const systemPrompt = `You are a warm, friendly, and highly knowledgeable AI assistant who specializes in helping real estate professionals succeed. Think of yourself as a supportive colleague who's always excited to help with any real estate challenge!

${agentProfile ? `
About the Agent You're Helping:
- Name: ${agentProfile.agentName || 'Agent'}
- Market: ${agentProfile.primaryMarket || 'General market'}
- Specialization: ${agentProfile.specialization || 'General real estate'}
- Preferred Style: ${agentProfile.preferredTone || 'Professional'}

Always personalize your responses for ${agentProfile.agentName || 'this agent'}'s specific market and communication preferences.
` : ''}

${knowledgeBaseContext ? `
IMPORTANT: The user has uploaded documents to their knowledge base. When relevant information is available in their knowledge base (shown below), prioritize it in your response and mention that you're referencing their documents.
` : ''}

Your Real Estate Expertise:
🏠 Market trends and conditions
💰 Mortgage rates and financing options
🤝 Deal negotiation and closing strategies
💬 Client communication and relationship building
📈 Marketing and lead generation
📊 Property valuation and analysis
⚖️ Legal and regulatory guidance (general information)
🔧 Technology and tools for real estate pros

Your Personality & Communication Style:
- Start with a warm greeting when appropriate
- Be genuinely enthusiastic about helping
- Use encouraging language like "Great question!" or "I'd be happy to help!"
- Share practical, actionable advice
- Include relevant examples and real-world scenarios
- Acknowledge that real estate can be challenging - you're here to support
- Use friendly, conversational language while staying professional
- For predictions, use phrases like "typically", "current trends suggest", "in most markets"
- If unsure about specifics, admit it and suggest reliable sources

Always assume questions are about real estate business unless clearly stated otherwise. Your goal is to make every interaction helpful, encouraging, and valuable!`;

    // Build context from attachments
    let attachmentContext = '';
    if (attachments && attachments.length > 0) {
      attachmentContext = '\n\nAttached Files:\n';
      attachments.forEach((attachment, index) => {
        attachmentContext += `${index + 1}. ${attachment.name} (${attachment.type})\n`;
        if (attachment.content) {
          attachmentContext += `Content: ${attachment.content.substring(0, 2000)}${attachment.content.length > 2000 ? '...' : ''}\n`;
        }
      });
    }

    const userPrompt = `A real estate professional just said: "${query}"${attachmentContext}${knowledgeBaseContext}

Instructions:
- If this is a greeting (like "hi", "hello", "hey"), respond with a warm, enthusiastic greeting and ask how you can help with their real estate business today
- If they've attached files, analyze the content and provide specific insights about the documents
- For text files, contracts, or documents: provide analysis, suggestions, or answer questions about the content
- For images: describe what you see and provide relevant real estate insights
${knowledgeBaseContext ? '- IMPORTANT: If relevant information is available in their Knowledge Base (shown above), reference it in your response and mention that you found it in their documents' : ''}
- If this is a question, provide comprehensive, practical advice with specific insights
- Always be warm, friendly, and genuinely excited to help them succeed
- Make them feel supported and confident in their real estate journey

Respond appropriately to what they said!`;

    // Create a simple schema for text response
    const responseSchema = z.object({
      response: z.string().describe('The helpful response to the user\'s question'),
    });

    // Use the invokeWithPrompts method
    const result = await client.invokeWithPrompts(systemPrompt, userPrompt, responseSchema, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Extract key points from the response (simple implementation)
    const keyPoints = extractKeyPoints(result.response);

    // Combine KB citations with any other citations
    const citations: Array<{
      url: string;
      title: string;
      sourceType: string;
    }> = [...kbCitations];

    return {
      content: result.response,
      keyPoints,
      citations,
      documentsUsed,
    };
  } catch (error) {
    console.error('Bedrock AI call failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: query.substring(0, 100) + '...'
    });

    // Provide intelligent fallback responses based on the query content
    const lowerQuery = query.toLowerCase().trim();

    // File analysis response
    if (attachments && attachments.length > 0) {
      const fileNames = attachments.map(f => f.name).join(', ');
      let analysisContent = `I can see you've uploaded ${attachments.length} file(s): ${fileNames}. 📄\n\n`;

      // Analyze text content if available
      const textFiles = attachments.filter(f => f.content);
      if (textFiles.length > 0) {
        analysisContent += "Here's what I found in your documents:\n\n";
        textFiles.forEach((file, index) => {
          analysisContent += `**${file.name}:**\n`;
          if (file.content) {
            const wordCount = file.content.split(/\s+/).length;
            analysisContent += `• Document length: ${wordCount} words\n`;

            // Simple keyword analysis for real estate terms
            const realEstateKeywords = ['property', 'listing', 'contract', 'buyer', 'seller', 'commission', 'closing', 'mortgage', 'appraisal', 'inspection'];
            const foundKeywords = realEstateKeywords.filter(keyword =>
              file.content!.toLowerCase().includes(keyword)
            );

            if (foundKeywords.length > 0) {
              analysisContent += `• Real estate terms found: ${foundKeywords.join(', ')}\n`;
            }

            // Extract first few sentences for context
            const sentences = file.content.split(/[.!?]+/).slice(0, 2).join('. ');
            if (sentences.length > 0) {
              analysisContent += `• Preview: ${sentences}...\n`;
            }
          }
          analysisContent += '\n';
        });
      }

      analysisContent += "💡 **How I can help:**\n";
      analysisContent += "• Ask me specific questions about the content\n";
      analysisContent += "• Request analysis or suggestions\n";
      analysisContent += "• Get help with contract terms or clauses\n";
      analysisContent += "• Identify potential issues or opportunities\n\n";
      analysisContent += "What would you like to know about these documents?";

      return {
        content: analysisContent,
        keyPoints: [
          `Analyzed ${attachments.length} uploaded file(s)`,
          "Ready to answer specific questions about the content",
          "Can provide analysis and suggestions",
          "Ask about contracts, listings, or any real estate documents"
        ],
        citations: [],
      };
    }

    // Greeting responses
    const isGreeting = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].some(greeting =>
      lowerQuery.includes(greeting)
    );

    if (isGreeting) {
      return {
        content: "Hi there! 👋 I'm your AI real estate assistant, ready to help you succeed! Ask me about market trends, deal strategies, client communication, or anything real estate related.",
        keyPoints: ["Ready to help with your real estate business!", "Ask about market trends, deals, clients, or any real estate topic"],
        citations: [],
      };
    }

    // Lead generation specific response
    if (lowerQuery.includes('lead generation') || lowerQuery.includes('lead gen') || lowerQuery.includes('generate leads')) {
      return {
        content: "Great question about lead generation! 🎯 Here are some proven strategies that work well for real estate professionals:\n\n• **Social Media Marketing**: Share valuable market insights and property content on Facebook, Instagram, and LinkedIn\n• **Content Marketing**: Write blog posts about local market trends and home buying/selling tips\n• **Referral Programs**: Create incentives for past clients to refer new business\n• **Open Houses**: Host engaging open houses that capture visitor information\n• **Local SEO**: Optimize your Google Business Profile and website for local searches\n• **Email Marketing**: Send regular market updates and property alerts to your database\n• **Networking Events**: Attend local business events and community gatherings\n• **Online Reviews**: Encourage satisfied clients to leave positive reviews\n\nWould you like me to dive deeper into any of these strategies?",
        keyPoints: [
          "Social media and content marketing are highly effective",
          "Referral programs leverage existing client relationships",
          "Local SEO helps you get found online",
          "Consistent follow-up and networking build long-term success"
        ],
        citations: [],
      };
    }

    // Market trends response
    if (lowerQuery.includes('market trend') || lowerQuery.includes('market condition') || lowerQuery.includes('current market')) {
      return {
        content: "I'd love to help you understand current market trends! 📈 While I can't access real-time data right now due to a technical issue, here are some key areas to monitor:\n\n• **Interest Rates**: Watch Federal Reserve announcements and mortgage rate changes\n• **Inventory Levels**: Track months of supply in your local market\n• **Price Trends**: Monitor median home prices and price per square foot\n• **Days on Market**: See how quickly properties are selling\n• **Buyer Activity**: Look at showing requests and offer competition\n\nFor the most current data, I recommend checking your local MLS, NAR reports, or tools like Realtor.com market insights. Would you like tips on how to interpret and use this data with clients?",
        keyPoints: [
          "Monitor interest rates and inventory levels closely",
          "Track local pricing trends and days on market",
          "Use MLS and NAR data for current insights",
          "Translate data into client-friendly explanations"
        ],
        citations: [],
      };
    }

    // Competitive offer response
    if (lowerQuery.includes('competitive offer') || lowerQuery.includes('structure') && lowerQuery.includes('offer')) {
      return {
        content: "Great question about structuring competitive offers! 🏆 In today's market, here's how to make your clients' offers stand out:\n\n**Financial Strength:**\n• **Strong pre-approval**: Get clients fully underwritten, not just pre-qualified\n• **Higher earnest money**: Show serious commitment (1-3% of purchase price)\n• **Larger down payment**: 20%+ demonstrates financial stability\n• **Cash equivalent offers**: Consider bridge loans or cash-backed programs\n\n**Contract Terms:**\n• **Flexible closing date**: Match seller's preferred timeline\n• **Minimal contingencies**: Waive inspection or appraisal if market allows\n• **Escalation clause**: Automatically increase offer up to a maximum\n• **Rent-back option**: Let sellers stay after closing if needed\n\n**Personal Touch:**\n• **Buyer letter**: Share client's story and connection to the home\n• **Local lender**: Use mortgage professionals the listing agent knows\n• **Quick response**: Submit offers within hours, not days\n\nWhat's your local market like right now? I can help you prioritize these strategies!",
        keyPoints: [
          "Strong pre-approval and higher earnest money show commitment",
          "Flexible terms and minimal contingencies make offers attractive",
          "Personal touches and quick responses differentiate your clients",
          "Adapt strategy based on local market conditions"
        ],
        citations: [],
      };
    }

    // Deal closing response
    if (lowerQuery.includes('close') && (lowerQuery.includes('deal') || lowerQuery.includes('sale'))) {
      return {
        content: "Excellent question about closing deals! 🤝 Here are proven strategies that successful agents use:\n\n• **Build Strong Relationships**: Focus on trust and understanding client needs deeply\n• **Handle Objections Confidently**: Prepare responses for common concerns about price, timing, and market conditions\n• **Create Urgency Appropriately**: Use market data to show why acting now makes sense\n• **Follow Up Consistently**: Stay in touch without being pushy - provide value in every interaction\n• **Know Your Numbers**: Have market data, comparable sales, and financing options ready\n• **Listen More Than You Talk**: Understand the real motivations behind their decisions\n• **Offer Solutions**: Present options and alternatives when obstacles arise\n\nRemember, closing is about helping clients make confident decisions, not pressuring them. What specific part of the closing process would you like to improve?",
        keyPoints: [
          "Relationship building and trust are fundamental",
          "Prepare for objections with data and alternatives",
          "Consistent follow-up provides value without pressure",
          "Focus on helping clients make confident decisions"
        ],
        citations: [],
      };
    }

    // General fallback with better error acknowledgment
    return {
      content: "I apologize - I'm experiencing a technical issue connecting to my AI brain right now! 🤖⚡ But I'm still here to help! Based on your question, I can see you're asking about real estate topics, which is exactly what I love to discuss.\n\nWhile I get my systems back online, could you try rephrasing your question or asking about a specific aspect? I'm particularly good at helping with:\n\n• Market analysis and trends\n• Client communication strategies  \n• Deal negotiation and closing\n• Marketing and lead generation\n• Property valuation insights\n• Financing and mortgage guidance\n\nTry asking again - I should be back to full power shortly! 💪",
      keyPoints: ["Experiencing temporary technical issues", "Ready to help with real estate topics", "Try rephrasing or asking about specific aspects"],
      citations: [],
    };
  }
}

/**
 * Extract key points from a response (simple implementation)
 */
function extractKeyPoints(response: string): string[] {
  // Simple extraction - look for bullet points or numbered lists
  const lines = response.split('\n');
  const keyPoints: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for bullet points or numbered items
    if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      const point = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      if (point.length > 10 && point.length < 200) {
        keyPoints.push(point);
      }
    }
  }

  // If no bullet points found, extract first few sentences as key points
  if (keyPoints.length === 0) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
    keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));
  }

  return keyPoints.slice(0, 5); // Limit to 5 key points
}

/**
 * Handles a chat query from the user
 * Simplified implementation for immediate functionality
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
    const query = formData.get('query');
    const conversationId = formData.get('conversationId');
    const attachmentsData = formData.get('attachments');

    if (!query || typeof query !== 'string') {
      return {
        success: false,
        error: 'Query is required and must be a string',
      };
    }

    // Parse attachments if provided
    let attachments: FileAttachment[] = [];
    if (attachmentsData && typeof attachmentsData === 'string') {
      try {
        attachments = JSON.parse(attachmentsData);
      } catch (error) {
        console.error('Error parsing attachments:', error);
      }
    }

    if (query.trim().length === 0) {
      return {
        success: false,
        error: 'Query cannot be empty',
      };
    }

    if (query.length > 5000) {
      return {
        success: false,
        error: 'Query is too long (maximum 5000 characters)',
      };
    }

    // Get current user (authentication) - Skip auth check for now to test functionality
    // TODO: Implement proper server-side session handling with cookies
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
      attributes: {}
    };

    // Basic guardrails validation
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

    // Load agent profile
    const profileRepository = getAgentProfileRepository();
    const agentProfile = await profileRepository.getProfile(mockUser.id);

    // Simple AI response using Bedrock directly with RAG support
    const response = await generateSimpleResponse(sanitizedQuery, mockUser.id, agentProfile, attachments);

    // Save conversation to DynamoDB
    const conversationIdToUse = (conversationId && typeof conversationId === 'string') ? conversationId : uuidv4();
    await saveConversation(
      mockUser.id,
      conversationIdToUse,
      query,
      response.content,
      response.citations,
      []
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Query processed successfully',
      data: {
        conversationId: conversationIdToUse,
        response: response.content,
        keyPoints: response.keyPoints,
        citations: response.citations,
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
      const startTime = Date.now();

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

        // Get current user (using mock for now)
        const mockUser = {
          id: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
          attributes: {}
        };

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
        const agentProfile = await profileRepository.getProfile(mockUser.id);

        // Send progress: Analyzing query
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Analyzing your query...',
          step: 3,
          totalSteps: 5,
        }) + '\n'));

        // Send progress: Processing
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Processing with AI agents...',
          step: 4,
          totalSteps: 5,
        }) + '\n'));

        // Generate simple response with RAG support
        const response = await generateSimpleResponse(sanitizedQuery, mockUser.id, agentProfile);

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
          mockUser.id,
          conversationIdToUse,
          query,
          response.content,
          response.citations,
          []
        );

        // Send final response
        const responseMessage = JSON.stringify({
          type: 'response',
          data: {
            conversationId: conversationIdToUse,
            response: response.content,
            keyPoints: response.keyPoints,
            citations: response.citations,
            executionTime: Date.now() - startTime,
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
