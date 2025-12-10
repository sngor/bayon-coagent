import { Check, UserCog, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlowChoiceOption } from '@/services/onboarding/role-detection';

interface FlowChoiceCardProps {
    option: FlowChoiceOption;
    selected: boolean;
    onSelect: () => void;
}

/**
 * Flow Choice Card Component
 * 
 * Displays a selectable card for choosing an onboarding flow.
 * Used on the flow choice page for dual role users.
 * 
 * Features:
 * - Visual selection state
 * - Recommended badge
 * - Icon representation
 * - Touch-optimized for mobile (min 44x44px)
 * 
 * Requirements: 15.2, 7.4
 */
export function FlowChoiceCard({ option, selected, onSelect }: FlowChoiceCardProps) {
    // Map icon names to components
    const iconMap = {
        'users-cog': UserCog,
        'shield-check': Shield,
        'user': User,
    };

    const IconComponent = iconMap[option.icon as keyof typeof iconMap] || UserCog;

    return (
        <button
            onClick={onSelect}
            className={cn(
                'w-full p-6 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-accent/50',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'text-left',
                // Touch target optimization - min 44x44px
                'min-h-[44px]',
                selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
            )}
            type="button"
            aria-label={`${option.title}${selected ? ' (selected)' : ''}`}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                    className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                        selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    <IconComponent className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">
                            {option.title}
                        </h3>
                        {option.recommended && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                Recommended
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {option.description}
                    </p>
                </div>

                {/* Selection indicator */}
                <div
                    className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        selected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                    )}
                >
                    {selected && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                </div>
            </div>
        </button>
    );
}
