import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRCodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title: string;
}

export function QRCodeDialog({ open, onOpenChange, url, title }: QRCodeDialogProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const handleDownload = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}-qrcode.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for {title}</DialogTitle>
                    <DialogDescription>
                        Scan this code to access the dashboard directly.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-6 bg-white rounded-lg border">
                    <QRCodeSVG
                        value={url}
                        size={200}
                        level="H"
                        includeMargin={true}
                        ref={svgRef}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <p className="text-sm text-muted-foreground break-all">
                            {url}
                        </p>
                    </div>
                    <Button size="icon" variant="outline" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="secondary" onClick={handleDownload} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
