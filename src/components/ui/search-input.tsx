import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/lib/interaction-optimization';

export interface SearchInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    debounceMs?: number;
}

/**
 * A reusable search input component with real-time filtering support.
 * Features:
 * - Debounced input for performance (optimized for <100ms perceived response)
 * - Immediate visual feedback with optimistic updates
 * - Clear button when text is present
 * - Search icon indicator
 * - Accessible keyboard navigation
 * 
 * Performance: UI updates immediately (<16ms), search executes after debounce delay
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            className,
            value,
            onChange,
            onClear,
            debounceMs = 300,
            placeholder = 'Search...',
            ...props
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = React.useState(value);

        // Sync external value changes
        React.useEffect(() => {
            setInternalValue(value);
        }, [value]);

        // Optimized debounced callback using the interaction optimization utility
        const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

        // Immediate UI update with debounced actual search
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            // Immediate UI update for responsive feel (<16ms)
            setInternalValue(newValue);

            // Debounced actual search execution
            debouncedOnChange(newValue);
        };

        // Clear handler with immediate response
        const handleClear = () => {
            setInternalValue('');
            onChange('');
            if (onClear) {
                onClear();
            }
        };

        return (
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    ref={ref}
                    type="search"
                    value={internalValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={cn('pl-9 pr-9', className)}
                    {...props}
                />
                {internalValue && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </Button>
                )}
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';
