import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'tasks' | 'clients' | 'payments'>('all');

  // Advanced search with API endpoints
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery, searchType],
    queryFn: async () => {
      if (!searchQuery.trim()) return { tasks: [], clients: [], payments: [] };

      const results = { tasks: [], clients: [], payments: [] };

      try {
        // Search tasks
        if (searchType === 'all' || searchType === 'tasks') {
          const tasksResponse = await apiClient.get('/tasks', {
            search: searchQuery,
            limit: 20,
          }) as any;
          // apiClient returns the parsed body directly. Support both shapes.
          results.tasks = tasksResponse?.tasks || tasksResponse?.data?.tasks || tasksResponse || [];
        }

        // Search clients
        if (searchType === 'all' || searchType === 'clients') {
          const clientsResponse = await apiClient.get('/clients', {
            search: searchQuery,
            limit: 20,
          }) as any;
          results.clients = clientsResponse?.clients || clientsResponse?.data || clientsResponse || [];
        }

        // Search payments/invoices (using invoices as payments)
        if (searchType === 'all' || searchType === 'payments') {
          const paymentsResponse = await apiClient.get('/invoices', {
            search: searchQuery,
            limit: 20,
          }) as any;
          results.payments = paymentsResponse?.invoices || paymentsResponse?.data || paymentsResponse || [];
        }
      } catch (error) {
        console.error('Search error:', error);
        // Return empty results on error instead of breaking
      }

      // Debug log removed for production; keep minimal logging
      return results;
    },
    enabled: searchQuery.length > 2,
  });

  const filteredResults = useMemo(() => {
    if (!searchResults) return { tasks: [], clients: [], payments: [] };
    return searchResults;
  }, [searchResults]);

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults: filteredResults,
    isLoading,
    hasResults: searchQuery.length > 2 && (
      filteredResults.tasks.length > 0 || 
      filteredResults.clients.length > 0 || 
      filteredResults.payments.length > 0
    ),
  };
};