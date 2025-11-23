'use client';

import { useEffect, useState } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/aws/auth/use-user';
import { checkAdminStatusAction } from '@/app/actions';

export function AdminMenuItem() {
    const { user } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAdminStatus() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await checkAdminStatusAction(user.id);
                setIsAdmin(result.isAdmin);
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminStatus();
    }, [user?.id]);

    if (isLoading || !isAdmin) {
        return null;
    }

    return (
        <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
            </Link>
        </DropdownMenuItem>
    );
}