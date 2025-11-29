'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { uploadFile, getPresignedUrl, deleteFile } from '@/aws/s3/client';
import { getGeminiTextModel } from '@/aws/google-ai/client';
import { downloadFile } from '@/aws/s3/client';

// Types
export type AgentDocument = {
    id: string;
    agentId: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    s3Key: string;
    category?: string;
    description?: string;
    uploadedAt: number;
    redFlagSummary?: string; // Store the AI summary here
    deletedAt?: number;
};

// Validation
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
    'text/markdown',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const uploadDocumentSchema = z.object({
    fileName: z.string().min(1, 'File name is required'),
    fileSize: z.number().min(1).max(MAX_FILE_SIZE),
    contentType: z.string().refine((type) => ALLOWED_FILE_TYPES.includes(type), 'Invalid file type'),
});

// DynamoDB Keys
function getAgentDocumentKeys(agentId: string, documentId: string) {
    return {
        PK: `AGENT#${agentId}`,
        SK: `DOCUMENT#${documentId}`,
    };
}

/**
 * Upload a document to the agent's knowledge base
 */
export async function uploadAgentDocument(formData: FormData) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return { error: 'Authentication required' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No file provided' };
        }

        const validated = uploadDocumentSchema.safeParse({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
        });

        if (!validated.success) {
            return { error: validated.error.errors[0].message };
        }

        const documentId = `doc-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const s3Key = `agents/${user.id}/documents/${documentId}-${file.name}`;

        // Upload to S3
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await uploadFile(s3Key, buffer, file.type);

        // Create record
        const document: AgentDocument = {
            id: documentId,
            agentId: user.id,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            s3Key,
            uploadedAt: Date.now(),
        };

        const repository = getRepository();
        const keys = getAgentDocumentKeys(user.id, documentId);
        await repository.create(keys.PK, keys.SK, 'AgentDocument', document);

        return { success: true, document };
    } catch (error) {
        console.error('Upload error:', error);
        return { error: 'Failed to upload document' };
    }
}

/**
 * List agent's documents
 */
export async function listAgentDocuments() {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return { error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `AGENT#${user.id}`;
        const results = await repository.query<AgentDocument>(pk, 'DOCUMENT#');

        const documents = results.items.filter(doc => !doc.deletedAt);

        return { success: true, documents };
    } catch (error) {
        console.error('List error:', error);
        return { error: 'Failed to list documents' };
    }
}

/**
 * Analyze a document for red flags
 */
export async function analyzeAgentDocumentRedFlags(documentId: string) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return { error: 'Authentication required' };
        }

        const repository = getRepository();
        const keys = getAgentDocumentKeys(user.id, documentId);
        const document = await repository.get<AgentDocument>(keys.PK, keys.SK);

        if (!document) {
            return { error: 'Document not found' };
        }

        // Download file
        const fileBuffer = await downloadFile(document.s3Key);
        const base64Data = fileBuffer.toString('base64');

        // Call Gemini
        const model = getGeminiTextModel();
        const prompt = `
            Analyze this real estate document (likely HOA docs or Seller Disclosures) for "red flags".
            Look for issues like:
            - Litigation
            - Special assessments
            - Rental restrictions
            - Major repairs needed
            - Noise complaints
            - Pet restrictions
            - Financial instability of the HOA
            - Upcoming large capital projects
            - Reserve fund issues

            Generate a concise, 1-page summary for the agent/buyer highlighting these red flags.
            Use bullet points and bold text for importance.
            If no red flags are found, state that clearly.
            Format the output as a clean Markdown summary.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: document.contentType,
                },
            },
        ]);

        const summary = result.response.text();

        // Save summary to document record
        await repository.update(keys.PK, keys.SK, { redFlagSummary: summary });

        return { success: true, summary };
    } catch (error) {
        console.error('Analysis error:', error);
        return { error: 'Failed to analyze document' };
    }
}

/**
 * Delete a document
 */
export async function deleteAgentDocument(documentId: string) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return { error: 'Authentication required' };
        }

        const repository = getRepository();
        const keys = getAgentDocumentKeys(user.id, documentId);

        // Soft delete
        await repository.update(keys.PK, keys.SK, { deletedAt: Date.now() });

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { error: 'Failed to delete document' };
    }
}
