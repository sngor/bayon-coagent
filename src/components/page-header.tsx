/**
 * Page Header Component
 * Provides consistent page headers across the application
 */

import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    children,
    className = ''
}: PageHeaderProps) {
    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {description && (
                        <p className="mt-1 text-sm text-gray-600">{description}</p>
                    )}
                </div>
                {children && (
                    <div className="flex items-center space-x-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PageHeader;