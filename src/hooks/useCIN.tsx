import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cinService, CINSearchResult, CompanyDetails } from '@/services/cin';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

export interface UseCINOptions {
  enableAutoSearch?: boolean;
  searchDelay?: number;
  minSearchLength?: number;
}

export const useCIN = (options: UseCINOptions = {}) => {
  const { 
    enableAutoSearch = true, 
    searchDelay = 300, 
    minSearchLength = 2 
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CINSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Create debounced search function
  const debouncedSearchRef = useRef(
    debounce(async (query: string, callback: (results: CINSearchResult[]) => void) => {
      if (query.length < minSearchLength) {
        callback([]);
        return;
      }

      try {
        setIsSearching(true);
        const results = await cinService.searchCompanies(query);
        callback(results);
      } catch (error: any) {
        console.error('Search error:', error);
        toast({
          title: "Search Failed",
          description: error.message || "Failed to search companies",
          variant: "destructive",
        });
        callback([]);
      } finally {
        setIsSearching(false);
      }
    }, searchDelay)
  );

  // Search results state
  const [searchResults, setSearchResults] = useState<CINSearchResult[]>([]);

  // Company details query
  const {
    data: companyDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ['companyDetails', selectedCompany?.id],
    queryFn: () => selectedCompany ? cinService.getCompanyDetails(selectedCompany.id) : null,
    enabled: !!selectedCompany?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Search function
  const searchCompanies = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (enableAutoSearch) {
      debouncedSearchRef.current(query, setSearchResults);
    }
  }, [enableAutoSearch]);

  // Manual search trigger
  const triggerSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery;
    
    if (searchTerm.length < minSearchLength) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await cinService.searchCompanies(searchTerm);
      setSearchResults(results);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search companies",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, minSearchLength, toast]);

  // Select company
  const selectCompany = useCallback((company: CINSearchResult) => {
    setSelectedCompany(company);
    setSearchQuery(company.displayText);
    setSearchResults([]);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCompany(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Validate CIN
  const validateCIN = useCallback((cin: string) => {
    return cinService.validateCIN(cin);
  }, []);

  // Parse CIN
  const parseCIN = useCallback((cin: string) => {
    return cinService.parseCIN(cin);
  }, []);

  // Format CIN
  const formatCIN = useCallback((cin: string) => {
    return cinService.formatCIN(cin);
  }, []);

  // Get company info from search results by CIN
  const getCompanyByCIN = useCallback((cin: string) => {
    return searchResults.find(company => company.cin === cin);
  }, [searchResults]);

  // Auto-populate from CIN
  const populateFromCIN = useCallback(async (cin: string) => {
    const validation = validateCIN(cin);
    if (!validation.isValid) {
      toast({
        title: "Invalid CIN",
        description: validation.message,
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsSearching(true);
      // Search for the company using the CIN
      const results = await cinService.searchCompanies(cin);
      const company = results.find(result => result.cin === cin);
      
      if (company) {
        selectCompany(company);
        return company;
      } else {
        toast({
          title: "Company Not Found",
          description: "No company found with the provided CIN",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for company",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [validateCIN, selectCompany, toast]);

  return {
    // State
    searchQuery,
    searchResults,
    selectedCompany,
    companyDetails,
    isSearching,
    isLoadingDetails,
    detailsError,

    // Actions
    searchCompanies,
    triggerSearch,
    selectCompany,
    clearSelection,
    validateCIN,
    parseCIN,
    formatCIN,
    getCompanyByCIN,
    populateFromCIN,
    refetchDetails,

    // Utilities
    hasResults: searchResults.length > 0,
    hasSelection: !!selectedCompany,
    hasDetails: !!companyDetails,
    isValidCIN: (cin: string) => validateCIN(cin).isValid,
  };
};