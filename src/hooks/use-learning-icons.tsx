/**
 * Learning Icons Hook
 * Centralized hook for consistent icon usage across learning components
 */

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    getCategoryIcon,
    getPathCategoryIcon,
    getResourceIcon
} from '@/lib/learning/utils';

interface UseIconsReturn {
    CategoryIcon: LucideIcon;
    PathIcon: LucideIcon;
    ResourceIcon: LucideIcon;
    renderIcon: (IconComponent: LucideIcon, className?: string) => JSX.Element;
}

export function useLearningIcons(
    category?: string,
    pathCategory?: string,
    resourceType?: string
): UseIconsReturn {
    const CategoryIcon = useMemo(() =>
        getCategoryIcon(category as any), [category]
    );

    const PathIcon = useMemo(() =>
        getPathCategoryIcon(pathCategory as any), [pathCategory]
    );

    const ResourceIcon = useMemo(() =>
        getResourceIcon(resourceType as any), [resourceType]
    );

    const renderIcon = useMemo(() =>
        (IconComponent: LucideIcon, className: string = "h-4 w-4") => {
            const Component = IconComponent;
            return <Component className={ className } />;
        },
        []
    );

    return {
        CategoryIcon,
        PathIcon,
        ResourceIcon,
        renderIcon,
    };
}

/**
 * Simplified hook for just rendering category icons
 */
export function useCategoryIcon(category: string, className?: string) {
    const IconComponent = useMemo(() => getCategoryIcon(category as any), [category]);

    return useMemo(() => {
        const Component = IconComponent;
        return <Component className={ className || "h-4 w-4" } />;
    }, [IconComponent, className]);
}