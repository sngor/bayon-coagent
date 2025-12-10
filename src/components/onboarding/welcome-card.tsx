'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils/common';

/**
 * WelcomeCard Component
 * 
 * Displays a hub's benefits in the welcome screen.
 * Features:
 * - Icon with hub name
 * - Description
 * - List of key features
 * - Mobile-first responsive design
 * - Touch-optimized for mobile devices
 * 
 * Requirements: 1.2, 7.1, 7.4
 */

interface WelcomeCardProps {
    /** Hub icon component */
    icon: LucideIcon;
    /** Hub name */
    name: string;
    /** Hub description */
    description: string;
    /** List of key features */
    features: string[];
    /** Optional className for custom styling */
    className?: string;
}

export function WelcomeCard({
    icon: Icon,
    name,
    description,
    features,
    className,
}: WelcomeCardProps) {
    const isMobile = useIsMobile();

    return (
        <Card
            className={cn(
                "hover:shadow-md transition-all duration-200 border-border/50",
                // Touch-optimized on mobile
                isMobile && "active:scale-[0.98] touch-manipulation",
                className
            )}
            role="article"
            aria-label={`${name} hub features`}
        >
            <CardContent className={cn(
                // Responsive padding
                "p-4 sm:p-5 md:p-6",
                // Ensure minimum touch target height on mobile (44px)
                isMobile && "min-h-[88px]"
            )}>
                {/* Header with icon and title */}
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {/* Icon container - Responsive sizing */}
                    <div className={cn(
                        "flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center",
                        isMobile ? "w-10 h-10" : "w-12 h-12"
                    )}>
                        <Icon
                            className={cn(
                                "text-primary",
                                isMobile ? ICON_SIZES.sm : ICON_SIZES.md
                            )}
                            aria-hidden="true"
                        />
                    </div>

                    {/* Title and description */}
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "font-semibold mb-1",
                            isMobile ? "text-base" : "text-lg"
                        )}>
                            {name}
                        </h3>
                        <p className={cn(
                            "text-muted-foreground leading-relaxed",
                            isMobile ? "text-xs" : "text-sm"
                        )}>
                            {description}
                        </p>
                    </div>
                </div>

                {/* Features list */}
                <ul
                    className={cn(
                        "space-y-2",
                        isMobile ? "ml-0" : "ml-2"
                    )}
                    role="list"
                    aria-label={`${name} features`}
                >
                    {features.map((feature, index) => (
                        <li
                            key={index}
                            className={cn(
                                "flex items-start gap-2 text-muted-foreground",
                                isMobile ? "text-xs" : "text-sm"
                            )}
                        >
                            {/* Bullet point */}
                            <span
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5"
                                aria-hidden="true"
                            />
                            <span className="flex-1 leading-relaxed">
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
