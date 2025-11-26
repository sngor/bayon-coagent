'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/aws/auth/use-user';
import { checkAdminStatusAction } from '@/app/actions';

interface AdminContextType {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    role: string;
    isAdminMode: boolean;
    toggleAdminMode: () => void;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [role, setRole] = useState<string>('user');
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAdminStatus() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                console.log('Checking admin status for:', user.id);
                const result = await checkAdminStatusAction(user.id);
                console.log('Admin status result:', result);
                setIsAdmin(result.isAdmin);
                setRole(result.role || 'user');
                setIsSuperAdmin(result.role === 'super_admin');
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
                setIsSuperAdmin(false);
                setRole('user');
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminStatus();
    }, [user?.id]);

    const toggleAdminMode = () => {
        if (isAdmin) {
            setIsAdminMode(!isAdminMode);
        }
    };

    return (
        <AdminContext.Provider value={{
            isAdmin,
            isSuperAdmin,
            role,
            isAdminMode,
            toggleAdminMode,
            isLoading,
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}