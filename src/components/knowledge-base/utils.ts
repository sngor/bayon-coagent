import type { KnowledgeDocument } from './types';

// Memoized utility functions to prevent recreation on each render
export const getTypeIcon = (type: KnowledgeDocument['type']) => {
    switch (type) {
        case 'pdf':
        case 'doc':
        case 'txt':
            return 'FileText';
        case 'image':
            return 'Image';
        case 'video':
            return 'Video';
        case 'url':
            return 'BookOpen';
        case 'note':
            return 'Edit';
        default:
            return 'FileText';
    }
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else {
        return date.toLocaleDateString();
    }
};

export const getFileType = (filename: string): KnowledgeDocument['type'] => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return 'pdf';
        case 'doc':
        case 'docx': return 'doc';
        case 'txt':
        case 'md': return 'txt';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'image';
        case 'mp4':
        case 'mov':
        case 'avi': return 'video';
        default: return 'txt';
    }
};

// File validation constants
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_FILE_TYPES = {
    pdf: ['.pdf'],
    doc: ['.doc', '.docx'],
    txt: ['.txt', '.md'],
    image: ['.jpg', '.jpeg', '.png', '.gif'],
    video: ['.mp4', '.mov', '.avi']
} as const;