'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, Trash2 } from 'lucide-react';
import { getIcon } from '@/lib/icon-utils';

interface QuickActionCardProps {
    action: {
        id: string;
        title: string;
        description: string;
        href: string;
        icon: string;
        color: string;
        gradient: string;
    };
    onRemove: (id: string, event?: React.MouseEvent) => void;
}

export function QuickActionCard({ action, onRemove }: QuickActionCardProps) {
    const Icon = getIcon(action.icon);

    return (
        <div className="group relative">
            <Link href={action.href} className="block">
                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer aspect-square flex flex-col">
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="p-6 flex flex-col justify-between h-full">
                        <div className="flex flex-col items-start">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors leading-tight">
                                {action.title}
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {action.description}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Remove button with dropdown menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
                        onClick={(e: React.MouseEvent) => e.preventDefault()}
                        title="More options"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={(e) => onRemove(action.id, e)}
                        className="text-destructive focus:text-destructive"
                        destructive
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Quick Actions
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}