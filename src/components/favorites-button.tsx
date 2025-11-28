'use client';

import { useState } from 'react';
import { Pin } from 'lucide-react';
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
                title: favorited ? "Unpinned" : "Pinned",
                description: favorited
                    ? `${item.title} removed from quick actions`
                    : `${item.title} added to quick actions`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update pins. Please try again.",
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
                "transition-colors duration-150",
                favorited && "text-primary hover:text-primary/80",
                className
            )}
            title={favorited ? "Unpin page" : "Pin page"}
        >
            <Pin
                className={cn(
                    "h-4 w-4 transition-colors duration-150",
                    favorited && "fill-current",
                    isToggling && "animate-pulse"
                )}
            />
            {showText && (
                <span className="ml-2">
                    {favorited ? "Pinned" : "Pin"}
                </span>
            )}
        </Button>
    );
}