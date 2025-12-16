'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { KnowledgeDocument, KnowledgeCategory, DocumentFormData, CategoryFormData } from '@/components/knowledge-base/types';

// Mock data - should be moved to a separate file or fetched from API
const mockCategories: KnowledgeCategory[] = [
    {
        id: 'market-reports',
        name: 'Market Reports',
        description: 'Market analysis and trend reports',
        documentCount: 12,
        color: 'bg-blue-100 text-blue-800'
    },
    {
        id: 'property-data',
        name: 'Property Data',
        description: 'Property listings and comparables',
        documentCount: 8,
        color: 'bg-green-100 text-green-800'
    },
    {
        id: 'client-info',
        name: 'Client Information',
        description: 'Client preferences and requirements',
        documentCount: 15,
        color: 'bg-purple-100 text-purple-800'
    },
    {
        id: 'legal-docs',
        name: 'Legal Documents',
        description: 'Contracts and legal information',
        documentCount: 6,
        color: 'bg-orange-100 text-orange-800'
    },
    {
        id: 'research-notes',
        name: 'Research Notes',
        description: 'Personal research and insights',
        documentCount: 20,
        color: 'bg-gray-100 text-gray-800'
    }
];

const mockDocuments: KnowledgeDocument[] = [
    {
        id: '1',
        title: 'Seattle Q4 2024 Market Report',
        type: 'pdf',
        size: 2500000,
        uploadedAt: '2024-01-15T10:30:00Z',
        lastAccessed: '2024-01-16T14:20:00Z',
        tags: ['seattle', 'market-analysis', 'q4-2024'],
        category: 'market-reports',
        summary: 'Comprehensive analysis of Seattle real estate market trends for Q4 2024',
        isProcessed: true,
        processingStatus: 'completed'
    },
    {
        id: '2',
        title: 'Bellevue Luxury Home Comparables',
        type: 'doc',
        size: 1200000,
        uploadedAt: '2024-01-14T16:45:00Z',
        lastAccessed: '2024-01-15T09:15:00Z',
        tags: ['bellevue', 'luxury', 'comparables'],
        category: 'property-data',
        summary: 'Comparable sales data for luxury homes in Bellevue area',
        isProcessed: true,
        processingStatus: 'completed'
    },
    {
        id: '3',
        title: 'First-Time Buyer Guide Notes',
        type: 'note',
        content: 'Key points for helping first-time buyers navigate the market...',
        uploadedAt: '2024-01-13T11:20:00Z',
        tags: ['first-time-buyers', 'guide', 'tips'],
        category: 'research-notes',
        summary: 'Personal notes on best practices for first-time buyer consultations',
        isProcessed: true,
        processingStatus: 'completed'
    },
    {
        id: '4',
        title: 'King County Zoning Changes 2024',
        type: 'url',
        url: 'https://example.com/zoning-changes',
        uploadedAt: '2024-01-12T08:30:00Z',
        tags: ['zoning', 'king-county', 'regulations'],
        category: 'legal-docs',
        summary: 'Recent zoning regulation changes affecting development',
        isProcessed: false,
        processingStatus: 'pending'
    }
];

export function useKnowledgeBase() {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>(mockDocuments);
    const [categories, setCategories] = useState<KnowledgeCategory[]>(mockCategories);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);

    // Memoized filtered documents for performance
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = !searchQuery ||
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                doc.summary?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
            const matchesType = selectedType === 'all' || doc.type === selectedType;

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [documents, searchQuery, selectedCategory, selectedType]);

    // Utility functions
    const getFileType = useCallback((filename: string): KnowledgeDocument['type'] => {
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
    }, []);

    // Document operations
    const addDocument = useCallback(async (file: File, formData: DocumentFormData) => {
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newDoc: KnowledgeDocument = {
                id: Date.now().toString(),
                title: formData.title || file.name,
                type: getFileType(file.name),
                size: file.size,
                uploadedAt: new Date().toISOString(),
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                category: formData.category || 'research-notes',
                isProcessed: false,
                processingStatus: 'processing'
            };

            setDocuments(prev => [newDoc, ...prev]);

            toast({
                title: 'Upload Successful',
                description: `"${newDoc.title}" has been added to your knowledge base.`,
            });

            // Simulate processing completion
            setTimeout(() => {
                setDocuments(prev => prev.map(doc =>
                    doc.id === newDoc.id
                        ? { ...doc, isProcessed: true, processingStatus: 'completed' }
                        : doc
                ));
            }, 3000);

            return { success: true, document: newDoc };
        } catch (error) {
            toast({
                title: 'Upload Failed',
                description: 'Failed to upload document. Please try again.',
                variant: 'destructive',
            });
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [getFileType]);

    const deleteDocument = useCallback((documentId: string) => {
        const document = documents.find(d => d.id === documentId);
        setDocuments(prev => prev.filter(d => d.id !== documentId));

        toast({
            title: 'Document Deleted',
            description: `"${document?.title}" has been removed from your knowledge base.`,
        });
    }, [documents]);

    const addCategory = useCallback((categoryData: CategoryFormData) => {
        const category: KnowledgeCategory = {
            id: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
            name: categoryData.name,
            description: categoryData.description,
            documentCount: 0,
            color: categoryData.color
        };

        setCategories(prev => [...prev, category]);

        toast({
            title: 'Category Created',
            description: `"${category.name}" has been added to your knowledge base.`,
        });

        return category;
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedType('all');
    }, []);

    return {
        // State
        documents,
        categories,
        filteredDocuments,
        searchQuery,
        selectedCategory,
        selectedType,
        isLoading,

        // Setters
        setSearchQuery,
        setSelectedCategory,
        setSelectedType,

        // Operations
        addDocument,
        deleteDocument,
        addCategory,
        clearFilters,

        // Utilities
        getFileType
    };
}