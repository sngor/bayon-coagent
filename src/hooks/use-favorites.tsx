'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/aws/auth';

export interface FavoriteItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string; // Icon name as string
    color: string;
    gradient: string;
    addedAt: string;
}

const DEFAULT_FAVORITES: FavoriteItem[] = [
    {
        id: 'studio-write',
        title: "Create Content",
        description: "Write blog posts, social media, and more",
        href: "/studio/write",
        icon: "PenTool",
        color: "bg-blue-500",
        gradient: "from-blue-500 to-blue-600",
        addedAt: new Date().toISOString()
    },
    {
        id: 'research-agent',
        title: "Research Market",
        description: "Get AI-powered market insights",
        href: "/research/agent",
        icon: "Search",
        color: "bg-green-500",
        gradient: "from-green-500 to-green-600",
        addedAt: new Date().toISOString()
    },
    {
        id: 'tools-calculator',
        title: "Calculate ROI",
        description: "Analyze deals and investments",
        href: "/tools/calculator",
        icon: "Calculator",
        color: "bg-purple-500",
        gradient: "from-purple-500 to-purple-600",
        addedAt: new Date().toISOString()
    },
    {
        id: 'brand-competitors',
        title: "Find Competitors",
        description: "Discover and track competition",
        href: "/brand/competitors",
        icon: "Users",
        color: "bg-orange-500",
        gradient: "from-orange-500 to-orange-600",
        addedAt: new Date().toISOString()
    }
];

export function useFavorites() {
    const { user } = useUser();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites from localStorage on mount
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const storageKey = `favorites_${user.id}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                const parsedFavorites = JSON.parse(stored);
                setFavorites(parsedFavorites);
            } catch (error) {
                console.error('Failed to parse favorites from localStorage:', error);
                setFavorites(DEFAULT_FAVORITES);
            }
        } else {
            // Set default favorites for new users
            setFavorites(DEFAULT_FAVORITES);
            localStorage.setItem(storageKey, JSON.stringify(DEFAULT_FAVORITES));
        }

        setIsLoading(false);
    }, [user]);

    // Save favorites to localStorage whenever they change
    const saveFavorites = useCallback((newFavorites: FavoriteItem[]) => {
        if (!user) return;

        const storageKey = `favorites_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(newFavorites));
        setFavorites(newFavorites);
    }, [user]);

    const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
        setFavorites(currentFavorites => {
            // Check if already exists to prevent duplicates
            if (currentFavorites.some(fav => fav.id === item.id)) {
                return currentFavorites;
            }

            const newFavorite: FavoriteItem = {
                ...item,
                addedAt: new Date().toISOString()
            };

            const newFavorites = [...currentFavorites, newFavorite];

            // Save to localStorage
            if (user) {
                const storageKey = `favorites_${user.id}`;
                localStorage.setItem(storageKey, JSON.stringify(newFavorites));
            }

            return newFavorites;
        });
    }, [user]);

    const removeFavorite = useCallback((id: string) => {
        setFavorites(currentFavorites => {
            const newFavorites = currentFavorites.filter(fav => fav.id !== id);

            // Save to localStorage
            if (user) {
                const storageKey = `favorites_${user.id}`;
                localStorage.setItem(storageKey, JSON.stringify(newFavorites));
            }

            return newFavorites;
        });
    }, [user]);

    const isFavorite = useCallback((id: string) => {
        return favorites.some(fav => fav.id === id);
    }, [favorites]);

    const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
        setFavorites(currentFavorites => {
            const isCurrentlyFavorited = currentFavorites.some(fav => fav.id === item.id);

            let newFavorites: FavoriteItem[];

            if (isCurrentlyFavorited) {
                // Remove from favorites
                newFavorites = currentFavorites.filter(fav => fav.id !== item.id);
            } else {
                // Add to favorites
                const newFavorite: FavoriteItem = {
                    ...item,
                    addedAt: new Date().toISOString()
                };
                newFavorites = [...currentFavorites, newFavorite];
            }

            // Save to localStorage
            if (user) {
                const storageKey = `favorites_${user.id}`;
                localStorage.setItem(storageKey, JSON.stringify(newFavorites));
            }

            return newFavorites;
        });
    }, [user]);

    const reorderFavorites = useCallback((newOrder: FavoriteItem[]) => {
        saveFavorites(newOrder);
    }, [saveFavorites]);

    return {
        favorites,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        reorderFavorites
    };
}