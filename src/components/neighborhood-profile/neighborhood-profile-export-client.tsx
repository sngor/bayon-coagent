'use client';

/**
 * Client-side Neighborhood Profile Export Component
 * 
 * Handles PDF generation using jsPDF and html2canvas on the client side,
 * then uploads the generated files to S3 via server actions.
 * 
 * Requirements: 5.8-5.10
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Globe, Loader2 } from 'lucide-react';
import type { NeighborhoodProfile } from '@/lib/alerts/types';
import type { Profile } from '@/lib/types';

interface NeighborhoodProfileExportClientProps {
    profile: NeighborhoodProfile;
    agentProfile: Profile;
    aiOutput?: any;
    onExportComplete?: (format: 'pdf' | 'html', url: string) => void;
}

export function NeighborhoodProfileExportClient({
    profile,
    agentProfile,
    aiOutput,
    onExportComplete
}: NeighborhoodProfileExportClientProps) {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingHTML, setIsGeneratingHTML] = useState(false);

    const handlePDFExport = async () => {
        setIsGeneratingPDF(true);

        try {
            // Dynamic imports to avoid SSR issues
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;
            const { generateHTML } = await import('@/lib/alerts/neighborhood-profile-export');

            // Generate HTML content
            const htmlContent = generateHTML(profile, agentProfile, aiOutput || {});

            // Create temporary DOM element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            tempDiv.style.width = '800px';
            tempDiv.style.padding = '40px';
            tempDiv.style.backgroundColor = 'white';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';

            document.body.appendChild(tempDiv);

            try {
                // Convert HTML to canvas
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 800,
                    height: tempDiv.scrollHeight
                });

                // Create PDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [800, canvas.height]
                });

                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const width = pdfWidth;
                const height = width / ratio;

                let heightLeft = height;
                let position = 0;

                // Add first page
                pdf.addImage(imgData, 'PNG', 0, position, width, height);
                heightLeft -= pdfHeight;

                // Add additional pages if needed
                while (heightLeft >= 0) {
                    position = heightLeft - height;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, width, height);
                    heightLeft -= pdfHeight;
                }

                // Convert PDF to blob and upload
                const pdfBlob = pdf.output('blob');
                const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

                // Upload to S3 via server action
                const { uploadPDFToS3Action } = await import('@/app/actions');
                const result = await uploadPDFToS3Action(profile.id, pdfBuffer, profile.location);

                if (result.message === 'success' && result.data?.url) {
                    toast({
                        title: 'PDF Export Complete',
                        description: 'Your neighborhood profile has been exported as PDF.'
                    });

                    onExportComplete?.('pdf', result.data.url);

                    // Trigger download
                    const link = document.createElement('a');
                    link.href = result.data.url;
                    link.download = `neighborhood-profile-${profile.location.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
                    link.click();
                } else {
                    throw new Error(result.message || 'Failed to upload PDF');
                }

            } finally {
                // Clean up temporary DOM element
                document.body.removeChild(tempDiv);
            }

        } catch (error) {
            console.error('PDF export failed:', error);
            toast({
                variant: 'destructive',
                title: 'PDF Export Failed',
                description: 'Could not generate PDF. Please try again.'
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleHTMLExport = async () => {
        setIsGeneratingHTML(true);

        try {
            // Call server action for HTML export
            const { exportNeighborhoodProfileAction } = await import('@/app/actions');
            const result = await exportNeighborhoodProfileAction(profile.id, 'html');

            if (result.message === 'Export generated successfully' && result.data?.url) {
                toast({
                    title: 'HTML Export Complete',
                    description: 'Your neighborhood profile has been exported as HTML.'
                });

                onExportComplete?.('html', result.data.url);

                // Open in new tab
                window.open(result.data.url, '_blank');
            } else {
                throw new Error(result.message || 'Failed to generate HTML export');
            }

        } catch (error) {
            console.error('HTML export failed:', error);
            toast({
                variant: 'destructive',
                title: 'HTML Export Failed',
                description: 'Could not generate HTML export. Please try again.'
            });
        } finally {
            setIsGeneratingHTML(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={handlePDFExport}
                disabled={isGeneratingPDF || isGeneratingHTML}
                variant="outline"
                size="sm"
            >
                {isGeneratingPDF ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <FileText className="h-4 w-4 mr-2" />
                )}
                {isGeneratingPDF ? 'Generating PDF...' : 'Export PDF'}
            </Button>

            <Button
                onClick={handleHTMLExport}
                disabled={isGeneratingPDF || isGeneratingHTML}
                variant="outline"
                size="sm"
            >
                {isGeneratingHTML ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Globe className="h-4 w-4 mr-2" />
                )}
                {isGeneratingHTML ? 'Generating HTML...' : 'Export HTML'}
            </Button>
        </div>
    );
}

/**
 * Simplified export buttons for use in other components
 */
export function NeighborhoodProfileExportButtons({
    profileId,
    className
}: {
    profileId: string;
    className?: string;
}) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'pdf' | 'html') => {
        setIsExporting(true);

        try {
            const { exportNeighborhoodProfileAction } = await import('@/app/actions');
            const result = await exportNeighborhoodProfileAction(profileId, format);

            if (result.message === 'Export generated successfully' && result.data?.url) {
                toast({
                    title: `${format.toUpperCase()} Export Complete`,
                    description: `Your neighborhood profile has been exported as ${format.toUpperCase()}.`
                });

                if (format === 'html') {
                    window.open(result.data.url, '_blank');
                } else {
                    // For PDF, trigger download
                    const link = document.createElement('a');
                    link.href = result.data.url;
                    link.download = `neighborhood-profile-${Date.now()}.${format}`;
                    link.click();
                }
            } else {
                throw new Error(result.message || `Failed to generate ${format.toUpperCase()} export`);
            }

        } catch (error) {
            console.error(`${format.toUpperCase()} export failed:`, error);
            toast({
                variant: 'destructive',
                title: `${format.toUpperCase()} Export Failed`,
                description: `Could not generate ${format.toUpperCase()} export. Please try again.`
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button
                onClick={() => handleExport('html')}
                disabled={isExporting}
                variant="outline"
                size="sm"
            >
                {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Globe className="h-4 w-4 mr-2" />
                )}
                Export HTML
            </Button>
        </div>
    );
}