/**
 * AWS SQS Module
 * 
 * This module exports SQS client functionality for AI job processing.
 */

export {
    getSQSClient,
    sendAIJobRequest,
    sendAIJobResult,
    receiveMessages,
    deleteMessage,
    getQueueAttributes,
    getQueueMessageCount,
    resetSQSClient,
    type AIJobMessage,
    type AIJobResultMessage,
} from './client';
