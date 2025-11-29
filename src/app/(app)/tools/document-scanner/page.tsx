'use client';

import { useState } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentUpload } from '@/components/knowledge-base/document-upload';
import { uploadAgentDocument, analyzeAgentDocumentRedFlags } from '@/features/intelligence/actions/agent-document-actions';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentScannerPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ summary: string; documentTitle: string } | null>(null);
    const { toast } = useToast();

    const handleUploadFn = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadAgentDocument(formData);

        if (result.error) {
            throw new Error(result.error);
        }

        // Auto-start analysis
        if (result.document) {
            handleAnalyze(result.document.id, result.document.fileName);
        }

        return result;
    };

    const handleAnalyze = async (documentId: string, fileName: string) => {
        setIsAnalyzing(true);
        toast({
            title: 'Analyzing Document',
            description: 'AI is scanning for red flags... This may take a minute.',
        });

        try {
            const result = await analyzeAgentDocumentRedFlags(documentId);

            if (result.success && result.summary) {
                setAnalysisResult({
                    summary: result.summary,
                    documentTitle: fileName,
                });
                toast({
                    title: 'Analysis Complete',
                    description: 'Red flags identified successfully.',
                });
            } else {
                toast({
                    title: 'Analysis Failed',
                    description: result.error || 'Could not analyze document',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred during analysis',
                variant: 'destructive',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Smart Document Scanner</h2>
                <p className="text-muted-foreground">
                    Instantly analyze HOA documents, Seller Disclosures, and contracts for potential risks and "red flags".
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
                {/* Left Column: Upload */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Upload Document</CardTitle>
                            <CardDescription>
                                Upload a PDF or Word document to begin analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentUpload
                                uploadFn={handleUploadFn}
                                acceptedTypes={['.pdf', '.docx', '.doc', '.txt']}
                                maxSize={25}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">What we look for</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Litigation & Legal Issues
                                </li>
                                <li className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Special Assessments
                                </li>
                                <li className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Rental Restrictions
                                </li>
                                <li className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Financial Instability
                                </li>
                                <li className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Major Repair Needs
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6">
                    {isAnalyzing ? (
                        <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                            <div className="relative w-16 h-16 mb-6">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                                <FileText className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Analyzing Document...</h3>
                            <p className="text-muted-foreground max-w-xs">
                                Our AI is reading through {analysisResult?.documentTitle || 'your document'} to identify potential risks.
                            </p>
                        </Card>
                    ) : analysisResult ? (
                        <Card className="border-primary/50 shadow-lg">
                            <CardHeader className="bg-primary/5 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            Analysis Complete
                                        </CardTitle>
                                        <CardDescription>
                                            Report for: <span className="font-medium text-foreground">{analysisResult.documentTitle}</span>
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setAnalysisResult(null)}>
                                        New Scan
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div
                                    className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-h3:text-lg prose-ul:list-disc prose-li:marker:text-primary"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(analysisResult.summary) as string }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <ArrowRight className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Ready to Scan</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Upload a document on the left to see the AI analysis report here.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
