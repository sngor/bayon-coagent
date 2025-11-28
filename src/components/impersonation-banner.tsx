'use client';

import { useEffect, useState } from 'react';
import { getImpersonationStatusAction, stopImpersonationAction } from '@/app/admin-actions';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function ImpersonationBanner() {
    const [status, setStatus] = useState<{ isImpersonating: boolean; targetUserId?: string } | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function checkStatus() {
            try {
                const result = await getImpersonationStatusAction();
                setStatus(result);
            } catch (error) {
                console.error('Failed to check impersonation status:', error);
            }
        }
        checkStatus();
    }, []);

    const handleStopImpersonation = async () => {
        try {
            const result = await stopImpersonationAction();
            if (result.message === 'success') {
                toast({
                    title: "Impersonation Ended",
                    description: "You have returned to your admin session."
                });
                setStatus(null);
                router.refresh();
                window.location.reload(); // Force full reload to clear state
            } else {
                toast({
                    title: "Error",
                    description: "Failed to stop impersonation",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to stop impersonation:', error);
        }
    };

    if (!status?.isImpersonating) {
        return null;
    }

    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-50">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                    You are currently impersonating user: <span className="font-bold">{status.targetUserId}</span>
                </span>
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleStopImpersonation}
                className="bg-white text-amber-600 hover:bg-amber-50 border-none"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Exit Impersonation
            </Button>
        </div>
    );
}
