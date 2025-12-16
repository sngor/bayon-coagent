import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ScenarioFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    difficultyFilter: string;
    onDifficultyChange: (value: string) => void;
    onClearFilters: () => void;
}

const DIFFICULTY_OPTIONS = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' }
] as const;

export function ScenarioFilters({
    searchTerm,
    onSearchChange,
    difficultyFilter,
    onDifficultyChange,
    onClearFilters
}: ScenarioFiltersProps) {
    const hasActiveFilters = searchTerm.trim() !== '' || difficultyFilter !== 'all';

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search scenarios by title, description, or client name..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Select value={difficultyFilter} onValueChange={onDifficultyChange}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIFFICULTY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="whitespace-nowrap"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}