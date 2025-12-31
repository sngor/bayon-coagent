'use server';

import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUser } from '@/aws/auth/cognito-client';
// Remove this import - function doesn't exist
// import { uploadToS3 } from '@/aws/s3/client';

// Validation schemas
const DocumentUploadSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    type: z.enum(['pdf', 'doc', 'txt', 'image', 'video', 'url', 'note']),
    category: z.string().min(1, 'Category is required').max(50, 'Category name too long'),
    tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Too many tags').optional(),
    content: z.string().max(50000, 'Content too long').optional(),
    url: z.string().url('Invalid URL format').max(500, 'URL too long').optional(),
}).refine(
    (data) => {
        if (data.type === 'url' && !data.url) return false;
        if (data.type === 'note' && !data.content) return false;
        return true;
    },
    {
        message: 'URL required for URL type, content required for note type',
        path: ['url', 'content'],
    }
);

const CategoryCreateSchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    color: z.string().optional(),
});

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Enhanced schema for document creation without file upload
const DocumentCreateSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['pdf', 'doc', 'txt', 'image', 'video', 'url', 'note']),
    category: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).optional(),
    content: z.string().optional(),
    url: z.string().url().optional(),
});

export type DocumentCreateInput = z.infer<typeof DocumentCreateSchema>;

/**
 * Upload a document to the knowledge base
 */
export async function uploadDocumentAction(
    formData: FormData
): Promise<ActionResult<{ id: string; title: string }>> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const type = formData.get('type') as string;
        const category = formData.get('category') as string;
        const tags = formData.get('tags') as string;

        // Validate input
        const validatedInput = DocumentUploadSchema.parse({
            title,
            type,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            content: formData.get('content') as string || undefined,
            url: formData.get('url') as string || undefined,
        });

        // TODO: Implement S3 upload when s3 client is available
        let fileUrl: string | undefined;
        let fileSize: number | undefined;

        if (file && file.size > 0) {
            // For now, store file info without actual upload
            fileSize = file.size;
            // fileUrl will be undefined until S3 integration is complete
        }

        const repository = getRepository();
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        // Save document metadata to DynamoDB
        await repository.put({
            PK: `USER#${user.id}`,
            SK: `DOCUMENT#${documentId}`,
            EntityType: 'AgentDocument',
            Data: {
                id: documentId,
                title: validatedInput.title,
                type: validatedInput.type,
                category: validatedInput.category,
                tags: validatedInput.tags || [],
                content: validatedInput.content,
                url: validatedInput.url,
                fileUrl,
                fileSize,
                uploadedAt: new Date().toISOString(),
                isProcessed: validatedInput.type === 'note' || validatedInput.type === 'url', // Notes and URLs are immediately processed
                processingStatus: validatedInput.type === 'note' || validatedInput.type === 'url' ? 'completed' : 'pending',
                userId: user.id,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${user.id}`,
            GSI1SK: `DOCUMENT#${new Date().toISOString()}`,
        });

        return {
            success: true,
            data: {
                id: documentId,
                title: validatedInput.title,
            }
        };
    } catch (error) {
        console.error('Error uploading document:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
            };
        }

        return {
            success: false,
            error: 'Failed to upload document'
        };
    }
}

/**
 * Create a new category
 */
export async function createCategoryAction(
    input: CategoryCreateInput
): Promise<ActionResult<{ id: string; name: string }>> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validatedInput = CategoryCreateSchema.parse(input);
        const repository = getRepository();
        const categoryId = validatedInput.name.toLowerCase().replace(/\s+/g, '-');

        await repository.put({
            PK: `USER#${user.id}`,
            SK: `CATEGORY#${categoryId}`,
            EntityType: 'Project',
            Data: {
                id: categoryId,
                name: validatedInput.name,
                description: validatedInput.description || '',
                color: validatedInput.color || 'bg-blue-100 text-blue-800',
                documentCount: 0,
                userId: user.id,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });

        return {
            success: true,
            data: {
                id: categoryId,
                name: validatedInput.name,
            }
        };
    } catch (error) {
        console.error('Error creating category:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
            };
        }

        return {
            success: false,
            error: 'Failed to create category'
        };
    }
}

/**
 * Delete a document
 */
export async function deleteDocumentAction(
    documentId: string
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();

        await repository.delete(`USER#${user.id}`, `DOCUMENT#${documentId}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            error: 'Failed to delete document'
        };
    }
}

/**
 * Get user's documents with optional filtering
 */
interface DocumentFilters {
    category?: string;
    type?: 'pdf' | 'doc' | 'txt' | 'image' | 'video' | 'url' | 'note';
    search?: string;
}

interface KnowledgeDocumentData {
    id: string;
    title: string;
    type: 'pdf' | 'doc' | 'txt' | 'image' | 'video' | 'url' | 'note';
    category: string;
    tags: string[];
    content?: string;
    url?: string;
    fileUrl?: string;
    fileSize?: number;
    uploadedAt: string;
    isProcessed: boolean;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    userId: string;
    summary?: string;
    lastAccessed?: string;
}

export async function getUserDocumentsAction(filters?: DocumentFilters): Promise<ActionResult<KnowledgeDocumentData[]>> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return { success: false, error: 'Authentication required', data: [] };
        }

        const repository = getRepository();

        const result = await repository.queryItems(
            `USER#${user.id}`,
            'DOCUMENT#'
        );

        let documents = result.items?.map((item: any) => item.Data) || [];

        // Apply filters if provided
        if (filters) {
            if (filters.category && filters.category !== 'all') {
                documents = documents.filter(doc => doc.category === filters.category);
            }
            if (filters.type && filters.type !== 'all') {
                documents = documents.filter(doc => doc.type === filters.type as any);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                documents = documents.filter(doc =>
                    doc.title.toLowerCase().includes(searchLower) ||
                    doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
                    doc.summary?.toLowerCase().includes(searchLower)
                );
            }
        }

        return {
            success: true,
            data: documents
        };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return {
            success: false,
            error: 'Failed to fetch documents',
            data: []
        };
    }
}

/**
 * Get user's categories
 */
export async function getUserCategoriesAction(): Promise<ActionResult<any[]>> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return { success: false, error: 'Authentication required', data: [] };
        }

        const repository = getRepository();

        const result = await repository.queryItems(
            `USER#${user.id}`,
            'CATEGORY#'
        );

        const categories = result.items?.map((item: any) => item.Data) || [];

        return {
            success: true,
            data: categories
        };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: 'Failed to fetch categories',
            data: []
        };
    }
}