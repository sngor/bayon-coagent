import { ReactNode } from 'react';
import { SubtleGradientMesh } from '@/components/ui/gradient-mesh';

/**
 * Client Portal Layout
 * 
 * Layout for all client portal routes (/portal/*)
 * Provides a clean, minimal layout for authentication and dashboard pages.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen">
            <SubtleGradientMesh className="min-h-screen">
                {children}
            </SubtleGradientMesh>
        </div>
    );
}
