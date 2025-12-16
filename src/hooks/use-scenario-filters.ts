import { useState, useMemo, useCallback } from 'react';
import type { RolePlayScenario } from '@/lib/learning/types';

interface UseScenarioFiltersProps {
    scenarios: RolePlayScenario[];
}

export function useScenarioFilters({ scenarios }: UseScenarioFiltersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

    // Memoized filtered scenarios for performance
    const filteredScenarios = useMemo(() => {
        return scenarios.filter(scenario => {
            const matchesSearch = searchTerm.trim() === '' ||
                scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scenario.persona?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scenario.aiPersona?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDifficulty = difficultyFilter === 'all' ||
                scenario.difficulty === difficultyFilter;

            return matchesSearch && matchesDifficulty;
        });
    }, [scenarios, searchTerm, difficultyFilter]);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setDifficultyFilter('all');
    }, []);

    const hasActiveFilters = searchTerm.trim() !== '' || difficultyFilter !== 'all';

    return {
        searchTerm,
        setSearchTerm,
        difficultyFilter,
        setDifficultyFilter,
        filteredScenarios,
        clearFilters,
        hasActiveFilters,
        totalScenarios: scenarios.length,
        filteredCount: filteredScenarios.length
    };
}