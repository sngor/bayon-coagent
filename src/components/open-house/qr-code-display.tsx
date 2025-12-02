'use client';

import { Button } from '@/components/ui/button';
import { Download, Printer, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect } from 'react';

interface QRCodeDisplayProps {
    sessionId: string;
    qrCodeUrl: string;
    propertyAddress: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
}

export function QRCodeDisplay({
    sessionId,
    qrCodeUrl,
    propertyAddress,
    scheduledDate,
    scheduledStartTime,
}: QRCodeDisplayProps) {
    const { toast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate QR code with overlay on canvas
    useEffect(() => {
        const generateOverlayQRCode = async () => {
            if (!canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size
            canvas.width = 600;
            canvas.height = 700;

            // Draw white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Load and draw QR code
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Draw QR code centered
                const qrSize = 400;
                const qrX = (canvas.width - qrSize) / 2;
                const qrY = 80;
                ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

                // Draw header text
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Open House Check-in', canvas.width / 2, 50);

                // Draw property address
                ctx.font = '20px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = '#666666';
                const maxWidth = canvas.width - 40;
                const words = propertyAddress.split(' ');
                let line = '';
                let y = qrY + qrSize + 40;

                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && i > 0) {
                        ctx.fillText(line, canvas.width / 2, y);
                        line = words[i] + ' ';
                        y += 30;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, canvas.width / 2, y);

                // Draw date/time if provided
                if (scheduledDate && scheduledStartTime) {
                    y += 40;
                    ctx.font = '18px system-ui, -apple-system, sans-serif';
                    ctx.fillStyle = '#888888';

                    try {
                        const date = new Date(scheduledDate);
                        const time = new Date(scheduledStartTime);
                        const dateStr = date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        });
                        const timeStr = time.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        });
                        ctx.fillText(`${dateStr} at ${timeStr}`, canvas.width / 2, y);
                    } catch (e) {
                        // If date parsing fails, skip date display
                    }
                }

                // Draw instruction text
                y += 40;
                ctx.font = '16px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = '#999999';
                ctx.fillText('Scan with your phone camera to check in', canvas.width / 2, y);
            };
            img.src = qrCodeUrl;
        };

        generateOverlayQRCode();
    }, [qrCodeUrl, propertyAddress, scheduledDate, scheduledStartTime]);

    const handleDownload = async () => {
        try {
            if (!canvasRef.current) {
                throw new Error('Canvas not ready');
            }

            // Convert canvas to blob
            canvasRef.current.toBlob((blob) => {
                if (!blob) {
                    throw new Error('Failed to generate image');
                }

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `open-house-qr-${sessionId}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                    title: 'QR Code Downloaded',
                    description: 'The QR code with session information has been saved to your device.',
                });
            }, 'image/png');
        } catch (error) {
            toast({
                title: 'Download Failed',
                description: 'Failed to download QR code. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handlePrint = () => {
        if (!canvasRef.current) {
            toast({
                title: 'Print Failed',
                description: 'QR code not ready. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        // Convert canvas to data URL
        const dataUrl = canvasRef.current.toDataURL('image/png');

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const dateTimeInfo = scheduledDate && scheduledStartTime
                ? (() => {
                    try {
                        const date = new Date(scheduledDate);
                        const time = new Date(scheduledStartTime);
                        const dateStr = date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        });
                        const timeStr = time.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        });
                        return `<p style="font-size: 1rem; color: #888; margin-top: 1rem;">${dateStr} at ${timeStr}</p>`;
                    } catch (e) {
                        return '';
                    }
                })()
                : '';

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Open House QR Code - ${propertyAddress}</title>
                    <style>
                        body {
                            font-family: system-ui, -apple-system, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 2rem;
                        }
                        img {
                            max-width: 600px;
                            width: 100%;
                            height: auto;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            @page {
                                margin: 1cm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" alt="QR Code with session information" />
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    const handleOpenCheckIn = () => {
        const checkInUrl = `${window.location.origin}/open-house/check-in/${sessionId}`;
        window.open(checkInUrl, '_blank');
    };

    return (
        <div className="space-y-4">
            {/* Canvas for QR code with overlay (hidden, used for download/print) */}
            <canvas
                ref={canvasRef}
                className="hidden"
                aria-hidden="true"
            />

            {/* Display version with overlay */}
            <div className="bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-1">Open House Check-in</h3>
                        <p className="text-sm text-muted-foreground">{propertyAddress}</p>
                        {scheduledDate && scheduledStartTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {(() => {
                                    try {
                                        const date = new Date(scheduledDate);
                                        const time = new Date(scheduledStartTime);
                                        const dateStr = date.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                        });
                                        const timeStr = time.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        });
                                        return `${dateStr} at ${timeStr}`;
                                    } catch (e) {
                                        return '';
                                    }
                                })()}
                            </p>
                        )}
                    </div>
                    <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                        <Image
                            src={qrCodeUrl}
                            alt="QR Code for check-in"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Scan with your phone camera to check in
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Button onClick={handleDownload} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                </Button>
                <Button onClick={handlePrint} variant="outline" className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Print QR Code
                </Button>
                <Button onClick={handleOpenCheckIn} variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Check-in Page
                </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                <p>Download or print includes session information</p>
                <p>for easy display at your open house</p>
            </div>
        </div>
    );
}
