export interface KnowledgeDocument {
    id: string;
    title: string;
    type: 'pdf' | 'doc' | 'txt' | 'image' | 'video' | 'url' | 'note';
    content?: string;
    url?: string;
    size?: number;
    uploadedAt: string;
    lastAccessed?: string;
    tags: string[];
    category: string;
    summary?: string;
    isProcessed: boolean;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface KnowledgeCategory {
    id: string;
    name: string;
    description: string;
    documentCount: number;
    color: string;
}

export interface DocumentFormData {
    title: string;
    type: KnowledgeDocument['type'];
    category: string;
    tags: string;
    content: string;
    url: string;
}

export interface CategoryFormData {
    name: string;
    description: string;
    color: string;
}