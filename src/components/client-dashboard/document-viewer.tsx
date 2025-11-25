'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Image, FileSpreadsheet, File, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDocumentDownloadUrl, logDocumentDownload, type DashboardDocument } from '@/app/client-dashboard-actions';
import { formatDistanceToNow } from 'date-fns';

interface DocumentViewerProps {
    token: string;
    documents: DashboardDocument[];
    primaryColor: string;
}

/**
 * Document Viewer Component
 * 
 * Displays a list of documents shared by the agent with the client.
 * Features:
 * - File name and type icons
 * - Upload date
 * - Download button
 * - Document preview for PDFs and images
 * - Tracks document downloads (analytics)
 * 
 * Requirements: 6.2, 6.3
 */
export function DocumentViewer({ token, documents, primaryColor }: DocumentViewerProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [previewDocument, setPreviewDocument] = useState<{ url: string; fileName: string; type: string } | null>(null);

    // Sort documents by upload date (newest first)
    const sortedDocuments = [...documents].sort((a, b) => b.uploadedAt - a.uploadedAt);

    const handleDownload = async (documentId: string, fileName: string) => {
        try {
            setDownloadingId(documentId);

            // Get presigned download URL
            const result = await getDocumentDownloadUrl(token, documentId);

            if (result.message === 'success' && result.data) {
                // Log the download for analytics
                await logDocumentDownload(token, documentId);

                // Trigger download
                const link = document.createElement('a');
                link.href = result.data.url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('Failed to get download URL:', result.message);
                alert('Failed to download document. Please try again.');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePreview = async (documentId: string, fileName: string, contentType: string) => {
        try {
            setDownloadingId(documentId);

            // Get presigned URL for preview
            const result = await getDocumentDownloadUrl(token, documentId);

            if (result.message === 'success' && result.data) {
                setPreviewDocument({
                    url: result.data.url,
                    fileName,
                    type: contentType,
                });
            } else {
                console.error('Failed to get preview URL:', result.message);
                alert('Failed to preview document. Please try again.');
            }
        } catch (error) {
            console.error('Error previewing document:', error);
            alert('Failed to preview document. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith('image/')) {
            return <Image className="h-5 w-5" />;
        } else if (contentType === 'application/pdf') {
            return <FileText className="h-5 w-5" />;
        } else if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
            return <FileSpreadsheet className="h-5 w-5" />;
        } else {
            return <File className="h-5 w-5" />;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const canPreview = (contentType: string): boolean => {
        return contentType === 'application/pdf' || contentType.startsWith('image/');
    };

    if (sortedDocuments.length === 0) {
        return (
            <div className="text-center py-8">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                    No documents have been shared yet.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {sortedDocuments.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* File Icon */}
                            <div
                                className="flex-shrink-0 p-2 rounded-lg"
                                style={{ backgroundColor: `${primaryColor}20` }}
                            >
                                <div style={{ color: primaryColor }}>
                                    {getFileIcon(doc.contentType)}
                                </div>
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {doc.fileName}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    <span>•</span>
                                    <span>
                                        Uploaded {formatDistanceToNow(doc.uploadedAt, { addSuffix: true })}
                                    </span>
                                </div>
                                {doc.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                        {doc.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {/* Preview Button (for PDFs and images) */}
                            {canPreview(doc.contentType) && (
                                <Button
                                    onClick={() => handlePreview(doc.id, doc.fileName, doc.contentType)}
                                    disabled={downloadingId === doc.id}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    {downloadingId === doc.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Preview</span>
                                </Button>
                            )}

                            {/* Download Button */}
                            <Button
                                onClick={() => handleDownload(doc.id, doc.fileName)}
                                disabled={downloadingId === doc.id}
                                size="sm"
                                className="gap-2"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: '#ffffff',
                                }}
                            >
                                {downloadingId === doc.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">Download</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewDocument && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewDocument(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {previewDocument.fileName}
                            </h3>
                            <Button
                                onClick={() => setPreviewDocument(null)}
                                variant="ghost"
                                size="sm"
                            >
                                Close
                            </Button>
                        </div>

                        {/* Preview Content */}
                        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                            {previewDocument.type === 'application/pdf' ? (
                                <iframe
                                    src={previewDocument.url}
                                    className="w-full h-[70vh] border-0 rounded-lg"
                                    title={previewDocument.fileName}
                                />
                            ) : previewDocument.type.startsWith('image/') ? (
                                <img
                                    src={previewDocument.url}
                                    alt={previewDocument.fileName}
                                    className="max-w-full h-auto mx-auto rounded-lg"
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
