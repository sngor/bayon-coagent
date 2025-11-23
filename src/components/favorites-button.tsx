'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites, type FavoriteItem } from '@/hooks/use-favorites';
import { toast } from '@/hooks/use-toast';

interface FavoritesButtonProps {
    item: Omit<FavoriteItem, 'addedAt'>;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'outline' | 'ghost';
    showText?: boolean;
}

export function FavoritesButton({
    item,
    className,
    size = 'sm',
    variant = 'ghost',
    showText = false
}: FavoritesButtonProps) {
    const { isFavorite, toggleFavorite, isLoading } = useFavorites();
    const [isToggling, setIsToggling] = useState(false);

    const favorited = isFavorite(item.id);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || isToggling) return;

        setIsToggling(true);

        try {
            toggleFavorite(item);

            toast({
                title: favorited ? "Removed from favorites" : "Added to favorites",
                description: favorited
                    ? `${item.title} removed from quick actions`
                    : `${item.title} added to quick actions`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update favorites. Please try again.",
            });
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            disabled={isLoading || isToggling}
            className={cn(
                "transition-all duration-200",
                favorited && "text-yellow-500 hover:text-yellow-600",
                className
            )}
            title={favorited ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                className={cn(
                    "h-4 w-4 transition-all duration-200",
                    favorited && "fill-current",
                    isToggling && "animate-pulse"
                )}
            />
            {showText && (
                <span className="ml-2">
                    {favorited ? "Starred" : "Star"}
                </span>
            )}
        </Button>
    );
}