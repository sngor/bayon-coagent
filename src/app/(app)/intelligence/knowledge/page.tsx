'use client';

import { useState } from 'react';
import { Upload, Search, BookOpen, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentUpload } from '@/components/knowledge-base/document-upload';
import { DocumentList } from '@/components/knowledge-base/document-list';
import { Document } from '@/components/knowledge-base/document-card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock documents for demonstration
    const mockDocuments: Document[] = [
        {
            id: '1',
            fileName: 'Q4-2024-Market-Report.pdf',
            fileType: 'pdf',
            fileSize: 2457600, // 2.4 MB
            uploadDate: new Date('2024-11-20').toISOString(),
            status: 'indexed',
            title: 'Q4 2024 Market Report',
            tags: ['Market Data', '2024', 'Seattle'],
            accessCount: 12,
        },
        {
            id: '2',
            fileName: 'Downtown-Seattle-Guide.pdf',
            fileType: 'pdf',
            fileSize: 1843200, // 1.8 MB
            uploadDate: new Date('2024-11-18').toISOString(),
            status: 'indexed',
            title: 'Downtown Seattle Neighborhood Guide',
            tags: ['Neighborhoods', 'Seattle'],
            accessCount: 8,
        },
        {
            id: '3',
            fileName: 'Investment-Strategy-2025.docx',
            fileType: 'docx',
            fileSize: 512000, // 500 KB
            uploadDate: new Date('2024-11-15').toISOString(),
            status: 'processing',
            title: 'Investment Strategy 2025',
            tags: ['Strategy', 'Investment'],
        },
    ];

    const displayDocuments = documents.length > 0 ? documents : mockDocuments;

    const filteredDocuments = searchQuery
        ? displayDocuments.filter((doc) =>
            (doc.title || doc.fileName)
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            doc.tags?.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : displayDocuments;

    const handleUploadComplete = (files: File[]) => {
        console.log('Upload complete:', files);
        setShowUploadDialog(false);
        // TODO: Implement actual upload logic
    };

    const handlePreview = (document: Document) => {
        console.log('Preview document:', document);
        // TODO: Implement preview modal
    };

    const handleEdit = (document: Document) => {
        console.log('Edit document:', document);
        // TODO: Implement edit modal
    };

    const handleDelete = (document: Document) => {
        console.log('Delete document:', document);
        // TODO: Implement delete confirmation
    };

    const handleDownload = (document: Document) => {
        console.log('Download document:', document);
        // TODO: Implement download
    };

    // Empty state
    if (displayDocuments.length === 0) {
        return (
            <div className="container max-w-4xl py-8 space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-headline font-bold">Knowledge Base</h1>
                    <p className="text-muted-foreground">
                        Upload documents for AI to reference across Chat, Research, and Content Generation
                    </p>
                </div>

                {/* Empty State */}
                <div className="border-2 border-dashed rounded-lg p-12">
                    <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto">
                        <div className="rounded-full bg-primary/10 p-6">
                            <BookOpen className="h-12 w-12 text-primary" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold">
                                Upload Your First Document
                            </h2>
                            <p className="text-muted-foreground">
                                Add PDFs, Word documents, or text files to give AI context about your business, market, or expertise
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <Button
                                size="lg"
                                className="w-full gap-2"
                                onClick={() => setShowUploadDialog(true)}
                            >
                                <Upload className="h-5 w-5" />
                                Upload Documents
                            </Button>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="flex gap-3 p-3 border rounded-lg">
                                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Supported Formats</p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF, DOCX, TXT, MD
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 border rounded-lg">
                                    <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">AI Integration</p>
                                        <p className="text-xs text-muted-foreground">
                                            Used across all features
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Dialog */}
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Upload Documents</DialogTitle>
                            <DialogDescription>
                                Upload documents to your knowledge base. Supported formats: PDF, DOCX, TXT, MD
                            </DialogDescription>
                        </DialogHeader>
                        <DocumentUpload onUploadComplete={handleUploadComplete} />
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Documents view
    return (
        <div className="container max-w-6xl py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-headline font-bold">Knowledge Base</h1>
                    <p className="text-muted-foreground">
                        {displayDocuments.length} document{displayDocuments.length !== 1 ? 's' : ''} uploaded
                    </p>
                </div>
                <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search documents by name or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Documents List */}
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No documents found matching "{searchQuery}"</p>
                </div>
            ) : (
                <DocumentList
                    documents={filteredDocuments}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                />
            )}

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload Documents</DialogTitle>
                        <DialogDescription>
                            Upload documents to your knowledge base. Supported formats: PDF, DOCX, TXT, MD
                        </DialogDescription>
                    </DialogHeader>
                    <DocumentUpload onUploadComplete={handleUploadComplete} />
                </DialogContent>
            </Dialog>
        </div>
    );
}