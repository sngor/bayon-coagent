'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { uploadFile } from '@/aws/s3/client';

// Document Scanner Types
export type ScannedDocument = {
    id: string;
    userId: string;
    name: string;
    type: 'contract' | 'listing' | 'disclosure' | 'inspection' | 'other';
    pages: number;
    size: number;
    uploadedAt: string;
    extractedText?: string;
    confidence: number;
    s3Key?: string;
    thumbnailS3Key?: string;
};

export type OCRResult = {
    text: string;
    confidence: number;
    boundingBoxes: Array<{
        text: string;
        confidence: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
};

// Validation schemas
const documentUploadSchema = z.object({
    name: z.string().min(1, 'Document name is required'),
    type: z.enum(['contract', 'listing', 'disclosure', 'inspection', 'other']),
    size: z.number().positive('File size must be positive'),
});

const ocrProcessSchema = z.object({
    documentId: z.string().min(1, 'Document ID is required'),
    extractedText: z.string(),
    confidence: z.number().min(0).max(1),
});

// DynamoDB Keys
function getDocumentKeys(userId: string, documentId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `DOCUMENT#${documentId}`,
    };
}

/**
 * Upload and process a document for OCR scanning
 */
export async function uploadDocumentForScanning(
    file: File,
    documentType: string
): Promise<{ success: boolean; document?: ScannedDocument; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: 'Invalid file type. Please upload JPEG, PNG, WebP, or PDF files.' };
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'File too large. Please upload files smaller than 10MB.' };
        }

        const validated = documentUploadSchema.safeParse({
            name: file.name,
            type: documentType,
            size: file.size,
        });

        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Upload file to S3
        const s3Key = `documents/${user.id}/${documentId}/${file.name}`;
        const uploadResult = await uploadFile(file, s3Key);

        if (!uploadResult.success) {
            return { success: false, error: 'Failed to upload file to storage' };
        }

        // Create document record
        const document: ScannedDocument = {
            id: documentId,
            userId: user.id,
            name: file.name,
            type: documentType as any,
            pages: 1, // Default to 1 page, could be enhanced for PDFs
            size: file.size,
            uploadedAt: new Date().toISOString(),
            confidence: 0, // Will be updated after OCR processing
            s3Key: s3Key,
        };

        // Save to DynamoDB
        const repository = getRepository();
        const keys = getDocumentKeys(user.id, documentId);
        await repository.create(keys.PK, keys.SK, 'ScannedDocument', document);

        return { success: true, document };
    } catch (error) {
        console.error('Upload document error:', error);
        return { success: false, error: 'Failed to upload document' };
    }
}

/**
 * Process OCR results for a document
 */
export async function processOCRResults(
    documentId: string,
    extractedText: string,
    confidence: number
): Promise<{ success: boolean; document?: ScannedDocument; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = ocrProcessSchema.safeParse({
            documentId,
            extractedText,
            confidence,
        });

        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        // Get existing document
        const repository = getRepository();
        const keys = getDocumentKeys(user.id, documentId);
        const existingDocument = await repository.get<ScannedDocument>(keys.PK, keys.SK);

        if (!existingDocument) {
            return { success: false, error: 'Document not found' };
        }

        // Update document with OCR results
        const updatedDocument: ScannedDocument = {
            ...existingDocument,
            extractedText,
            confidence,
        };

        await repository.update(keys.PK, keys.SK, updatedDocument);

        return { success: true, document: updatedDocument };
    } catch (error) {
        console.error('Process OCR results error:', error);
        return { success: false, error: 'Failed to process OCR results' };
    }
}

/**
 * Get all scanned documents for a user
 */
export async function getScannedDocuments(
    limit: number = 50
): Promise<{ success: boolean; documents?: ScannedDocument[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<ScannedDocument>(pk, 'DOCUMENT#', {
            limit,
            scanIndexForward: false, // Get newest first
        });

        return { success: true, documents: results.items };
    } catch (error) {
        console.error('Get scanned documents error:', error);
        return { success: false, error: 'Failed to get scanned documents' };
    }
}

/**
 * Update document type
 */
export async function updateDocumentType(
    documentId: string,
    newType: string
): Promise<{ success: boolean; document?: ScannedDocument; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate document type
        const validTypes = ['contract', 'listing', 'disclosure', 'inspection', 'other'];
        if (!validTypes.includes(newType)) {
            return { success: false, error: 'Invalid document type' };
        }

        // Get existing document
        const repository = getRepository();
        const keys = getDocumentKeys(user.id, documentId);
        const existingDocument = await repository.get<ScannedDocument>(keys.PK, keys.SK);

        if (!existingDocument) {
            return { success: false, error: 'Document not found' };
        }

        // Update document type
        const updatedDocument: ScannedDocument = {
            ...existingDocument,
            type: newType as any,
        };

        await repository.update(keys.PK, keys.SK, updatedDocument);

        return { success: true, document: updatedDocument };
    } catch (error) {
        console.error('Update document type error:', error);
        return { success: false, error: 'Failed to update document type' };
    }
}

/**
 * Delete a scanned document
 */
export async function deleteScannedDocument(
    documentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // Get existing document to get S3 keys
        const repository = getRepository();
        const keys = getDocumentKeys(user.id, documentId);
        const existingDocument = await repository.get<ScannedDocument>(keys.PK, keys.SK);

        if (!existingDocument) {
            return { success: false, error: 'Document not found' };
        }

        // Delete from DynamoDB
        await repository.delete(keys.PK, keys.SK);

        // TODO: Delete from S3 if needed
        // if (existingDocument.s3Key) {
        //     await deleteFile(existingDocument.s3Key);
        // }

        return { success: true };
    } catch (error) {
        console.error('Delete scanned document error:', error);
        return { success: false, error: 'Failed to delete document' };
    }
}

/**
 * Simulate OCR processing (in production, this would call AWS Textract or similar)
 */
export async function simulateOCRProcessing(
    documentId: string
): Promise<{ success: boolean; result?: OCRResult; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        // Get document
        const repository = getRepository();
        const keys = getDocumentKeys(user.id, documentId);
        const document = await repository.get<ScannedDocument>(keys.PK, keys.SK);

        if (!document) {
            return { success: false, error: 'Document not found' };
        }

        // Simulate OCR processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock OCR results based on document type
        const mockTexts = {
            contract: `PURCHASE AND SALE AGREEMENT

Property Address: 123 Main Street, Seattle, WA 98101
Purchase Price: $750,000
Earnest Money: $15,000
Closing Date: March 15, 2024

Buyer: John Smith
Seller: Jane Doe

This agreement is contingent upon:
- Satisfactory home inspection within 10 days
- Loan approval within 21 days
- Clear title report

Signatures:
Buyer: _________________ Date: _________
Seller: ________________ Date: _________`,

            listing: `EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT

Property: 456 Oak Avenue, Bellevue, WA 98004
List Price: $895,000
Commission: 6%
Listing Period: 6 months

Property Details:
- 4 bedrooms, 3 bathrooms
- 2,400 square feet
- Built in 2010
- Lot size: 0.25 acres

Marketing includes:
- MLS listing
- Professional photography
- Online marketing
- Open houses

Agent: Sarah Johnson, ABC Realty
License #: 12345678`,

            disclosure: `PROPERTY DISCLOSURE STATEMENT

Property: 789 Pine Street, Redmond, WA 98052
Seller: Mike and Lisa Johnson

STRUCTURAL SYSTEMS:
Foundation: Concrete slab, no known issues
Roof: Composition shingle, replaced 2019
Electrical: 200 amp service, updated 2015
Plumbing: Copper and PEX, no known leaks

ENVIRONMENTAL CONDITIONS:
Lead-based paint: No
Asbestos: No
Radon: Not tested
Flood zone: No

ADDITIONAL DISCLOSURES:
- New HVAC system installed 2020
- Kitchen remodeled 2018
- No known material defects`,

            inspection: `PROPERTY INSPECTION REPORT

Inspection Date: February 20, 2024
Property: 789 Pine Street, Redmond, WA 98052
Inspector: Mike Wilson, Certified Home Inspector

SUMMARY:
Overall condition: Good
Major issues: None identified
Minor issues: 3 items noted

ELECTRICAL SYSTEM: Satisfactory
- Main panel: 200 amp service
- GFCI outlets present in required areas
- No safety concerns identified

PLUMBING SYSTEM: Satisfactory  
- Water pressure adequate
- No visible leaks
- Hot water heater: 5 years old

HVAC SYSTEM: Satisfactory
- Heating system operational
- Filters need replacement
- Ductwork in good condition

RECOMMENDATIONS:
1. Replace HVAC filters
2. Caulk around master bathroom tub
3. Trim vegetation away from exterior walls`,

            other: `REAL ESTATE DOCUMENT

This document contains important information regarding real estate transactions.

Key details extracted:
- Property information
- Financial terms
- Important dates
- Contact information
- Legal requirements

Please review all terms and conditions carefully before proceeding with any real estate transaction.`
        };

        const extractedText = mockTexts[document.type] || mockTexts.other;
        const confidence = 0.92 + Math.random() * 0.07; // 92-99% confidence

        const result: OCRResult = {
            text: extractedText,
            confidence,
            boundingBoxes: [], // Simplified for demo
        };

        // Update document with OCR results
        await processOCRResults(documentId, extractedText, confidence);

        return { success: true, result };
    } catch (error) {
        console.error('Simulate OCR processing error:', error);
        return { success: false, error: 'Failed to process OCR' };
    }
}