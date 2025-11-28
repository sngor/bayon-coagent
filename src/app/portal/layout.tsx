import { ReactNode } from 'react';

/**
 * Client Portal Layout
 * 
 * Layout for all client portal routes (/portal/*)
 * Provides a clean, minimal layout for authentication and dashboard pages.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
}
