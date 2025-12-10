'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Hub Selection Card Component
 * 
 * Displays a selectable card for each major hub in the platform.
 * Features:
 * - Visual hub representation with icon and gradient
 * - Hub name, description, and key features
 * - Selection state with visual feedback
 * - Hover animations
 * - Touch-optimized for mobile (min 44x44px)
 * - Keyboard accessible
 * 
 * Requirements: 4.1, 7.1, 7.4
 */

export interface HubOption {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    features: string[];
    path: string;
    recommendedFor?: string[];
}

interface HubSelectionCardProps {
    hub: HubOption;
    isSelected: boolean;
    onSelect: (hubId: string) => void;
}

export function HubSelectionCard({ hub, isSelected, onSelect }: HubSelectionCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <Card
                className={cn(
                    'relative cursor-pointer transition-all duration-200 overflow-hidden',
                    'hover:shadow-lg hover:border-primary/50',
                    'min-h-[44px]', // Touch target requirement
                    isSelected && 'border-primary border-2 shadow-md'
                )}
                onClick={() => onSelect(hub.id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(hub.id);
                    }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Select ${hub.name} hub. ${hub.description}`}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1"
                    >
                        <Check className="w-4 h-4" />
                    </motion.div>
                )}

                <CardContent className="p-6">
                    {/* Icon with gradient background */}
                    <div className="mb-4">
                        <div
                            className={cn(
                                'w-14 h-14 rounded-xl flex items-center justify-center',
                                'bg-gradient-to-br',
                                hub.color,
                                'shadow-lg'
                            )}
                        >
                            <hub.icon className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    {/* Hub name and description */}
                    <div className="mb-4">
                        <h3 className="text-xl font-bold font-headline mb-2">
                            {hub.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {hub.description}
                        </p>
                    </div>

                    {/* Key features */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Key Features
                        </p>
                        <ul className="space-y-1.5">
                            {hub.features.slice(0, 3).map((feature, index) => (
                                <li
                                    key={index}
                                    className="text-sm text-muted-foreground flex items-start"
                                >
                                    <span className="mr-2 mt-1 text-primary">•</span>
                                    <span className="flex-1">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommended for (if provided) */}
                    {hub.recommendedFor && hub.recommendedFor.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Recommended For
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {hub.recommendedFor.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
