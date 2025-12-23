/**
 * Research Reports Hook
 * 
 * Custom hook for fetching and managing research reports with caching,
 * error handling, and search functionality.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import { filterBySearch } from '@/lib/utils/search-utils';
import type { ResearchReport } from '@/lib/types/common';

interface UseResearchReportsOptions {
  limit?: number;
  enableSearch?: boolean;
}

interface UseResearchReportsReturn {
  reports: ResearchReport[];
  filteredReports: ResearchReport[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
}

export function useResearchReports(
  options: UseResearchReportsOptions = {}
): UseResearchReportsReturn {
  const { limit = 10, enableSearch = true } = options;
  const { user } = useUser();
  
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/research-reports?userId=${user.id}&limit=${limit}`,
        {
          // Add cache headers for better performance
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on search query
  const filteredReports = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) {
      return reports;
    }

    return filterBySearch(reports, searchQuery, (report) => [
      report.topic || '',
      report.content || '',
    ]);
  }, [reports, searchQuery, enableSearch]);

  return {
    reports,
    filteredReports,
    isLoading,
    error,
    searchQuery,
    setSearchQuery: enableSearch ? setSearchQuery : () => {},
    refetch: fetchReports,
  };
}