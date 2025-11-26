'use client';

import { Document, DocumentCard } from './document-card';

interface DocumentListProps {
    documents: Document[];
    onPreview?: (document: Document) => void;
    onEdit?: (document: Document) => void;
    onDelete?: (document: Document) => void;
    onDownload?: (document: Document) => void;
}

export function DocumentList({
    documents,
    onPreview,
    onEdit,
    onDelete,
    onDownload,
}: DocumentListProps) {
    if (documents.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {documents.map((document) => (
                <DocumentCard
                    key={document.id}
                    document={document}
                    onPreview={onPreview}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDownload={onDownload}
                />
            ))}
        </div>
    );
}
