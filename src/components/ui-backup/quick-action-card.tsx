'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getIcon } from '@/lib/icon-utils';
import { type PageMetadata } from '@/lib/page-metadata';

interface QuickActionCardProps {
    action: PageMetadata;
    onRemove: (id: string) => void;
    onContextMenu?: (e: React.MouseEvent, id: string) => void;
    isRemoving?: boolean; // Allow parent to control loading state
}

export function QuickActionCard({
    action,
    onRemove,
    onContextMenu,
    isRemoving: externalIsRemoving
}: QuickActionCardProps) {
    const [internalIsRemoving, setInternalIsRemoving] = useState(false);
    const isRemoving = externalIsRemoving ?? internalIsRemoving;

    const Icon = getIcon(action.icon);
    const gradientClass = `bg-gradient-to-br ${action.gradient}`;
    const colorClass = `w-8 h-8 rounded-lg ${action.color}`;

    const handleRemove = () => {
        if (externalIsRemoving === undefined) {
            setInternalIsRemoving(true);
        }

        try {
            onRemove(action.id);
        } finally {
            if (externalIsRemoving === undefined) {
                setInternalIsRemoving(false);
            }
        }
    };

    return (
        <div className="group relative w-full">
            <Link
                href={action.href}
                className="block w-full"
                aria-label={`Navigate to ${action.title}: ${action.description}`}
            >
                <div
                    className={`w-full aspect-square rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer p-4 flex flex-col focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${isRemoving ? 'opacity-50 pointer-events-none' : ''
                        }`}
                    onContextMenu={onContextMenu ? (e) => onContextMenu(e, action.id) : undefined}
                    role="button"
                    tabIndex={0}
                >
                    <div className={`absolute inset-0 ${gradientClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />

                    {/* Header with icon and menu */}
                    <div className="relative flex items-start justify-between mb-3">
                        <div className={`${colorClass} text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                        </div>

                        {/* Menu button */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent flex-shrink-0"
                                    onClick={(e) => e.preventDefault()}
                                    disabled={isRemoving}
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isRemoving}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {isRemoving ? 'Removing...' : 'Remove'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 flex flex-col min-h-0">
                        <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                            {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                            {action.description}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
}