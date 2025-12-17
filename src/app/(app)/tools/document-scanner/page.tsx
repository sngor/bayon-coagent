'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    Upload,
    Camera,
    Download,
    Trash2,
    Eye,
    MoreVertical,
    CheckCircle,
    AlertTriangle,
    Loader2,
    FileImage,
    Scan,
    Copy,
    Share,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser } from '@/aws/auth/use-user';

type ScannedDocument = {
    id: string;
    name: string;
    type: 'contract' | 'listing' | 'disclosure' | 'inspection' | 'other';
    pages: number;
    size: string;
    uploadedAt: string;
    extractedText?: string;
    confidence: number;
    thumbnailUrl?: string;
    downloadUrl?: string;
};

type ScanResult = {
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

const documentTypes = [
    { value: 'contract', label: 'Purchase Contract', icon: FileText },
    { value: 'listing', label: 'Listing Agreement', icon: FileText },
    { value: 'disclosure', label: 'Property Disclosure', icon: FileText },
    { value: 'inspection', label: 'Inspection Report', icon: FileText },
    { value: 'other', label: 'Other Document', icon: FileText },
];

export default function DocumentScannerPage() {
    const { user } = useUser();
    const [documents, setDocuments] = useState<ScannedDocument[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [selectedDocument, setSelectedDocument] = useState<ScannedDocument | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Simulate OCR scanning process
    const simulateOCRScan = async (file: File): Promise<ScanResult> => {
        // Simulate processing time with progress updates
        setScanProgress(0);

        const steps = [
            { progress: 20, message: 'Preprocessing image...' },
            { progress: 40, message: 'Detecting text regions...' },
            { progress: 60, message: 'Extracting text...' },
            { progress: 80, message: 'Analyzing confidence...' },
            { progress: 100, message: 'Finalizing results...' },
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setScanProgress(step.progress);
        }

        // Simulate extracted text based on document type
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

            other: `PROPERTY INSPECTION REPORT

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
3. Trim vegetation away from exterior walls`
        };

        const documentType = file.name.toLowerCase().includes('contract') ? 'contract' :
            file.name.toLowerCase().includes('listing') ? 'listing' : 'other';

        return {
            text: mockTexts[documentType],
            confidence: 0.92 + Math.random() * 0.07, // 92-99% confidence
            boundingBoxes: [] // Simplified for demo
        };
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload a JPEG, PNG, WebP, or PDF file.',
            });
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Please upload a file smaller than 10MB.',
            });
            return;
        }

        setIsScanning(true);
        setScanProgress(0);

        try {
            const scanResult = await simulateOCRScan(file);

            const newDocument: ScannedDocument = {
                id: `doc-${Date.now()}`,
                name: file.name,
                type: 'other', // Default type, user can change later
                pages: 1,
                size: formatFileSize(file.size),
                uploadedAt: new Date().toISOString(),
                extractedText: scanResult.text,
                confidence: scanResult.confidence,
                thumbnailUrl: URL.createObjectURL(file),
                downloadUrl: URL.createObjectURL(file),
            };

            setDocuments(prev => [newDocument, ...prev]);

            toast({
                title: 'Document Scanned Successfully',
                description: `Extracted text with ${Math.round(scanResult.confidence * 100)}% confidence.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Scan Failed',
                description: 'Failed to process the document. Please try again.',
            });
        } finally {
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDocumentTypeIcon = (type: string) => {
        const docType = documentTypes.find(dt => dt.value === type);
        return docType ? docType.icon : FileText;
    };

    const getDocumentTypeLabel = (type: string) => {
        const docType = documentTypes.find(dt => dt.value === type);
        return docType ? docType.label : 'Other Document';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.95) return 'text-green-600 bg-green-50 border-green-200';
        if (confidence >= 0.85) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Text Copied',
            description: 'Extracted text copied to clipboard.',
        });
    };

    const handleDownload = (doc: ScannedDocument) => {
        if (doc.downloadUrl) {
            const link = document.createElement('a');
            link.href = doc.downloadUrl;
            link.download = doc.name;
            link.click();
        }
    };

    const handleDelete = (documentId: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast({
            title: 'Document Deleted',
            description: 'The document has been removed from your scanner.',
        });
    };

    const handleUpdateDocumentType = (documentId: string, newType: string) => {
        setDocuments(prev => prev.map(doc =>
            doc.id === documentId ? { ...doc, type: newType as any } : doc
        ));
        toast({
            title: 'Document Type Updated',
            description: `Document categorized as ${getDocumentTypeLabel(newType)}.`,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Document Scanner</CardTitle>
                    <CardDescription>
                        Scan and extract text from real estate documents using AI-powered OCR
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Upload Area */}
            <Card className={cn(
                "border-2 border-dashed transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                isScanning && "pointer-events-none opacity-50"
            )}>
                <CardContent
                    className="p-8 text-center"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isScanning ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Scanning Document...</h3>
                                <p className="text-muted-foreground">
                                    Processing your document with AI-powered OCR
                                </p>
                                <div className="max-w-md mx-auto">
                                    <Progress value={scanProgress} className="h-2" />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {scanProgress}% complete
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <Scan className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Upload Document to Scan</h3>
                                <p className="text-muted-foreground">
                                    Drag and drop files here, or click to browse
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Supports JPEG, PNG, WebP, and PDF files up to 10MB
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Choose File
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                >
                                    <Camera className="h-4 w-4" />
                                    Take Photo
                                </Button>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {/* Scanned Documents */}
            {documents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Scanned Documents ({documents.length})</CardTitle>
                        <CardDescription>
                            Your recently scanned documents with extracted text
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {documents.map((document) => {
                                const IconComponent = getDocumentTypeIcon(document.type);
                                return (
                                    <div key={document.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <IconComponent className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium truncate">{document.name}</h4>
                                                <Badge variant="secondary" className="text-xs">
                                                    {getDocumentTypeLabel(document.type)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{document.pages} page{document.pages !== 1 ? 's' : ''}</span>
                                                <span>{document.size}</span>
                                                <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", getConfidenceColor(document.confidence))}
                                                >
                                                    {Math.round(document.confidence * 100)}% confidence
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDocument(document);
                                                    setShowPreview(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDownload(document)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCopyText(document.extractedText || '')}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy Text
                                                    </DropdownMenuItem>
                                                    <Separator />
                                                    {documentTypes.map((type) => (
                                                        <DropdownMenuItem
                                                            key={type.value}
                                                            onClick={() => handleUpdateDocumentType(document.id, type.value)}
                                                        >
                                                            <type.icon className="h-4 w-4 mr-2" />
                                                            Mark as {type.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <Separator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(document.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Document Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedDocument?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Extracted text with {selectedDocument ? Math.round(selectedDocument.confidence * 100) : 0}% confidence
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto">
                        {selectedDocument?.extractedText && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={getConfidenceColor(selectedDocument.confidence)}>
                                        {Math.round(selectedDocument.confidence * 100)}% Confidence
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyText(selectedDocument.extractedText || '')}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Text
                                    </Button>
                                </div>

                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <pre className="whitespace-pre-wrap text-sm font-mono">
                                        {selectedDocument.extractedText}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Close
                        </Button>
                        <Button onClick={() => selectedDocument && handleDownload(selectedDocument)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Empty State */}
            {documents.length === 0 && !isScanning && (
                <Card className="border-dashed border-2">
                    <CardContent className="p-12 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Scan className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No Documents Scanned Yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Upload your first document to start extracting text with AI-powered OCR.
                                    Perfect for contracts, listings, and inspection reports.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Pro Tips:</strong> For best results, ensure documents are well-lit and text is clearly visible.
                    The scanner works best with high-contrast text on clean backgrounds.
                </AlertDescription>
            </Alert>
        </div>
    );
}