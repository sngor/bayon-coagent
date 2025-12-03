'use client';

/**
 * Navigation Button Component
 * 
 * One-tap navigation integration with device navigation apps
 * Requirement 9.3: One-tap navigation
 */

import { Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { locationServices, type LocationCoordinates } from '@/lib/mobile/location-services';
import { cn } from '@/lib/utils';

interface NavigationButtonProps {
    destination: LocationCoordinates;
    address?: string;
    label?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showIcon?: boolean;
}

export function NavigationButton({
    destination,
    address,
    label = 'Navigate',
    variant = 'default',
    size = 'default',
    className,
    showIcon = true,
}: NavigationButtonProps) {
    const handleNavigate = () => {
        locationServices.openNavigation(destination, address);
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleNavigate}
            className={cn('gap-2', className)}
        >
            {showIcon && <Navigation className="h-4 w-4" />}
            {label}
            <ExternalLink className="h-3 w-3 opacity-50" />
        </Button>
    );
}

interface NavigationLinkProps {
    destination: LocationCoordinates;
    address?: string;
    children?: React.ReactNode;
    className?: string;
}

export function NavigationLink({
    destination,
    address,
    children,
    className,
}: NavigationLinkProps) {
    const url = locationServices.getNavigationUrl(destination, address);

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'inline-flex items-center gap-2 text-primary hover:underline',
                className
            )}
        >
            {children || 'Get Directions'}
            <ExternalLink className="h-3 w-3" />
        </a>
    );
}
