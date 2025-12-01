/**
 * Document Processor for Knowledge Base
 * 
 * Handles text extraction and embedding generation for uploaded documents.
 * This should be triggered when documents are uploaded to S3.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { generateEmbedding, chunkText } from './knowledge-retriever';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const S3_BUCKET = process.env.KNOWLEDGE_BASE_BUCKET || 'bayon-knowledge-base';
const DYNAMODB_TABLE = process.env.KNOWLEDGE_BASE_TABLE || 'KnowledgeBaseDocuments';

/**
 * Extract text from DOCX files (ZIP-based format)
 * DOCX files are ZIP archives containing XML files
 */
async function extractTextFromDOCX(content: string, s3Key: string): Promise<string> {
    try {
        // DOCX files contain document.xml with text in <w:t> tags
        // Look for text content patterns in the XML
        const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);

        if (textMatches && textMatches.length > 0) {
            const extractedText = textMatches
                .map(match => {
                    // Extract text between tags
                    const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
                    // Decode XML entities
                    return text
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'");
                })
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (extractedText.length > 100) {
                return `Word Document Content:\n\n${extractedText}`;
            }
        }

        // Try alternative extraction - look for any readable text
        const readableText = content
            .replace(/<[^>]*>/g, ' ') // Remove XML tags
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable
            .replace(/\s+/g, ' ')
            .trim();

        if (readableText.length > 200) {
            return `Word Document Content (alternative extraction):\n\n${readableText}`;
        }

        // If extraction failed, provide helpful message
        return `[Word document detected but text extraction was limited.

For best results:
1. Save as .txt or .pdf format in Word
2. Copy and paste content into a text file
3. Or set up a Lambda function with mammoth library for full extraction

File: ${s3Key}
Size: ${Math.round(content.length / 1024)}KB

Note: The document was uploaded successfully and can be downloaded, but automatic text extraction requires conversion to a supported format.]`;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        return `[Word document processing error. Please convert to TXT or PDF format.

File: ${s3Key}]`;
    }
}

/**
 * Extract text from legacy DOC files
 */
function extractTextFromDOC(content: string, s3Key: string): string {
    try {
        // Legacy DOC format is binary - try to extract readable text
        const readableText = content
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();

        // Filter out common binary artifacts
        const cleanedText = readableText
            .split(' ')
            .filter(word => word.length > 2 && word.length < 50) // Reasonable word length
            .join(' ');

        if (cleanedText.length > 200) {
            return `Word Document Content (basic extraction):\n\n${cleanedText}\n\n[Note: Legacy .doc format may have incomplete extraction. For best results, save as .docx or .txt]`;
        }

        return `[Legacy Word document (.doc) detected. This format requires conversion.

For best results:
1. Open in Microsoft Word
2. Save As → Choose "Word Document (.docx)" or "Plain Text (.txt)"
3. Re-upload the converted file

Alternative: Export to PDF format

File: ${s3Key}
Size: ${Math.round(content.length / 1024)}KB]`;
    } catch (error) {
        console.error('DOC extraction error:', error);
        return `[Legacy Word document processing error. Please convert to .docx, .txt, or .pdf format.

File: ${s3Key}]`;
    }
}

/**
 * Extract text from CSV files
 */
function extractTextFromCSV(csvContent: string): string {
    try {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) return '';

        // Parse CSV (simple implementation - handles basic cases)
        const rows = lines.map(line => {
            // Simple CSV parsing (doesn't handle quoted commas)
            return line.split(',').map(cell => cell.trim());
        });

        // Format as readable text
        const headers = rows[0];
        const dataRows = rows.slice(1);

        let text = `CSV Data with ${dataRows.length} rows:\n\n`;
        text += `Columns: ${headers.join(', ')}\n\n`;

        // Add first 100 rows as formatted text
        const rowsToInclude = Math.min(dataRows.length, 100);
        for (let i = 0; i < rowsToInclude; i++) {
            const row = dataRows[i];
            text += `Row ${i + 1}:\n`;
            headers.forEach((header, idx) => {
                if (row[idx]) {
                    text += `  ${header}: ${row[idx]}\n`;
                }
            });
            text += '\n';
        }

        if (dataRows.length > 100) {
            text += `\n... and ${dataRows.length - 100} more rows\n`;
        }

        return text;
    } catch (error) {
        console.error('Error parsing CSV:', error);
        return csvContent; // Return raw content if parsing fails
    }
}

/**
 * Extract text from PDF files (basic implementation)
 * Note: For production, use a Lambda function with pdf-parse library
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
        // Try to extract text using simple string extraction
        // This works for text-based PDFs but not scanned images
        const text = pdfBuffer.toString('utf-8');

        // Remove binary junk and extract readable text
        const cleanText = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        if (cleanText.length > 100) {
            return `PDF Content (basic extraction):\n\n${cleanText}`;
        }

        // If extraction failed, return a helpful message
        return `[PDF detected but text extraction requires advanced processing. For best results, please:
1. Convert PDF to text format, or
2. Set up a Lambda function with pdf-parse library for automatic extraction.

File appears to contain ${Math.round(pdfBuffer.length / 1024)}KB of data.]`;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return '[PDF text extraction failed. Please convert to TXT or use a Lambda function with pdf-parse library.]';
    }
}

/**
 * Extract text from different file types
 */
export async function extractTextFromFile(
    s3Key: string,
    fileType: string
): Promise<string> {
    try {
        // Get file from S3
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
        });

        const response = await s3Client.send(command);
        const bodyContents = await streamToString(response.Body as any);

        // Extract text based on file type
        switch (fileType.toLowerCase()) {
            case 'txt':
            case 'md':
            case 'markdown':
                return bodyContents;

            case 'csv':
                return extractTextFromCSV(bodyContents);

            case 'json':
                try {
                    const json = JSON.parse(bodyContents);
                    // Format JSON as readable text
                    return `JSON Data:\n\n${JSON.stringify(json, null, 2)}`;
                } catch {
                    return bodyContents;
                }

            case 'html':
            case 'htm':
                // Simple HTML text extraction (remove tags)
                const htmlText = bodyContents
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
                    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
                    .replace(/&amp;/g, '&') // Replace &amp;
                    .replace(/&lt;/g, '<') // Replace &lt;
                    .replace(/&gt;/g, '>') // Replace &gt;
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                return `HTML Content:\n\n${htmlText}`;

            case 'pdf':
                // Basic PDF extraction (for production, use Lambda with pdf-parse)
                const pdfBuffer = Buffer.from(bodyContents, 'utf-8');
                return await extractTextFromPDF(pdfBuffer);

            case 'docx':
                // DOCX is a ZIP file containing XML - try basic extraction
                try {
                    // DOCX files contain document.xml with the text content
                    // This is a simplified extraction - for production use mammoth library
                    const textMatch = bodyContents.match(/(<w:t[^>]*>)(.*?)(<\/w:t>)/g);
                    if (textMatch && textMatch.length > 0) {
                        const extractedText = textMatch
                            .map(match => match.replace(/<[^>]*>/g, ''))
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();

                        if (extractedText.length > 100) {
                            return `Word Document Content (basic extraction):\n\n${extractedText}`;
                        }
                    }
                } catch (error) {
                    console.error('DOCX extraction error:', error);
                }

                // Fallback message
                return `[Word document detected. Basic extraction failed. For best results:
1. Convert to TXT or PDF format, or
2. Set up a Lambda function with mammoth library for full extraction.

File: ${s3Key}
Size: ${Math.round(bodyContents.length / 1024)}KB]`;

            case 'doc':
                // Legacy DOC format is binary and complex
                // Try to extract any readable text
                try {
                    const readableText = bodyContents
                        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    if (readableText.length > 200) {
                        return `Word Document Content (basic extraction):\n\n${readableText}`;
                    }
                } catch (error) {
                    console.error('DOC extraction error:', error);
                }

                return `[Legacy Word document (.doc) detected. This format requires conversion. Please:
1. Open in Word and save as .docx or .txt, or
2. Convert to PDF format.

File: ${s3Key}
Size: ${Math.round(bodyContents.length / 1024)}KB]`;

            case 'xlsx':
            case 'xls':
                return `[Excel spreadsheet detected. For automatic extraction, please:
1. Export to CSV format, or
2. Set up a Lambda function with xlsx library.

File: ${s3Key}
Size: ${Math.round(bodyContents.length / 1024)}KB]`;

            default:
                // Try to extract as plain text
                const isText = /^[\x20-\x7E\n\r\t]*$/.test(bodyContents.substring(0, 1000));
                if (isText) {
                    return `Text Content (${fileType}):\n\n${bodyContents}`;
                }

                throw new Error(`Unsupported file type: ${fileType}. Supported formats: TXT, MD, CSV, JSON, HTML, PDF (basic).`);
        }
    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw error;
    }
}

/**
 * Process document: extract text, generate embeddings, update DynamoDB
 */
export async function processDocument(
    userId: string,
    documentId: string,
    s3Key: string,
    fileType: string
): Promise<{
    success: boolean;
    extractedText?: string;
    chunkCount?: number;
    error?: string;
}> {
    try {
        // Update status to processing
        await updateDocumentStatus(userId, documentId, 'processing');

        // Extract text from document
        const extractedText = await extractTextFromFile(s3Key, fileType);

        if (!extractedText || extractedText.length === 0) {
            throw new Error('No text could be extracted from document');
        }

        // Chunk the text
        const chunks = chunkText(extractedText, 500, 50);

        // Generate embeddings for each chunk (in production, store these in a vector DB)
        // For now, we'll just store the extracted text in DynamoDB
        const embeddings: number[][] = [];

        // Note: Generating embeddings for all chunks can be expensive
        // In production, you might want to:
        // 1. Use a Lambda function to process this asynchronously
        // 2. Store embeddings in a vector database (Pinecone, OpenSearch)
        // 3. Only generate embeddings on-demand during retrieval

        // For demo purposes, generate embeddings for first 5 chunks
        const chunksToEmbed = chunks.slice(0, 5);
        for (const chunk of chunksToEmbed) {
            try {
                const embedding = await generateEmbedding(chunk);
                embeddings.push(embedding);
            } catch (error) {
                console.error('Error generating embedding for chunk:', error);
                // Continue processing other chunks
            }
        }

        // Update DynamoDB with extracted text and metadata
        const updateCommand = new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
                userId,
                documentId,
            },
            UpdateExpression: 'SET #status = :status, extractedText = :text, chunkCount = :chunkCount, embeddingModel = :model',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'indexed',
                ':text': extractedText,
                ':chunkCount': chunks.length,
                ':model': 'amazon.titan-embed-text-v2:0',
            },
        });

        await docClient.send(updateCommand);

        return {
            success: true,
            extractedText,
            chunkCount: chunks.length,
        };
    } catch (error) {
        console.error('Error processing document:', error);

        // Update status to failed
        await updateDocumentStatus(
            userId,
            documentId,
            'failed',
            error instanceof Error ? error.message : 'Processing failed'
        );

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed',
        };
    }
}

/**
 * Update document status in DynamoDB
 */
async function updateDocumentStatus(
    userId: string,
    documentId: string,
    status: 'pending' | 'processing' | 'indexed' | 'failed',
    errorMessage?: string
): Promise<void> {
    const updateExpression = errorMessage
        ? 'SET #status = :status, errorMessage = :error'
        : 'SET #status = :status';

    const expressionAttributeValues: any = {
        ':status': status,
    };

    if (errorMessage) {
        expressionAttributeValues[':error'] = errorMessage;
    }

    const command = new UpdateCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
            userId,
            documentId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
}

/**
 * Helper function to convert stream to string
 */
async function streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}

/**
 * Batch process multiple documents
 */
export async function batchProcessDocuments(
    documents: Array<{
        userId: string;
        documentId: string;
        s3Key: string;
        fileType: string;
    }>
): Promise<{
    processed: number;
    failed: number;
    results: Array<{ documentId: string; success: boolean; error?: string }>;
}> {
    const results = [];
    let processed = 0;
    let failed = 0;

    for (const doc of documents) {
        const result = await processDocument(
            doc.userId,
            doc.documentId,
            doc.s3Key,
            doc.fileType
        );

        results.push({
            documentId: doc.documentId,
            success: result.success,
            error: result.error,
        });

        if (result.success) {
            processed++;
        } else {
            failed++;
        }
    }

    return {
        processed,
        failed,
        results,
    };
}
