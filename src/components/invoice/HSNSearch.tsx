import React, { useState, useEffect } from 'react';
import { Search, Calculator, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { hsnService, HSNCode } from '@/services/hsn';

interface HSNSearchProps {
  value?: string;
  onSelect?: (hsn: HSNCode) => void;
  onHSNChange?: (hsnCode: string) => void;
  placeholder?: string;
  className?: string;
}

export const HSNSearch: React.FC<HSNSearchProps> = ({
  value = '',
  onSelect,
  onHSNChange,
  placeholder = 'Search HSN/SAC codes...',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HSNCode[]>([]);
  const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Initialize with value if provided
  useEffect(() => {
    if (value && !selectedHSN) {
      hsnService.getHSNByCode(value).then(hsn => {
        if (hsn) {
          setSelectedHSN(hsn);
          setSearchQuery(`${hsn.hsn} - ${hsn.description}`);
        } else {
          setSearchQuery(value);
        }
      });
    }
  }, [value, selectedHSN]);

  // Search HSN codes
  useEffect(() => {
    const searchHSN = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await hsnService.searchHSN(searchQuery);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Error searching HSN codes:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(searchHSN, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleHSNSelect = (hsn: HSNCode) => {
    setSelectedHSN(hsn);
    setSearchQuery(`${hsn.hsn} - ${hsn.description}`);
    setShowResults(false);
    
    if (onSelect) {
      onSelect(hsn);
    }
    
    if (onHSNChange) {
      onHSNChange(hsn.hsn);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If user clears the input, reset selection
    if (!newValue) {
      setSelectedHSN(null);
      if (onHSNChange) {
        onHSNChange('');
      }
    }
  };

  const clearSelection = () => {
    setSelectedHSN(null);
    setSearchQuery('');
    setShowResults(false);
    if (onHSNChange) {
      onHSNChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        
        {selectedHSN && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            ×
          </Button>
        )}
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full mt-1 w-full z-50 shadow-lg max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {searchResults.map((hsn, index) => (
              <div
                key={hsn.hsn}
                onClick={() => handleHSNSelect(hsn)}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  index === searchResults.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {hsn.hsn}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {hsn.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {hsn.category}
                      </Badge>
                      <span className="text-xs text-green-600 font-medium">
                        GST: {hsn.igst}%
                      </span>
                      {hsn.cess && (
                        <span className="text-xs text-orange-600 font-medium">
                          Cess: {hsn.cess}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" side="left">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Tax Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>CGST: {hsn.cgst}%</div>
                          <div>SGST: {hsn.sgst}%</div>
                          <div>IGST: {hsn.igst}%</div>
                          {hsn.cess && <div>Cess: {hsn.cess}%</div>}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected HSN Info */}
      {selectedHSN && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">
                HSN: {selectedHSN.hsn}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {selectedHSN.description}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-xs">
                GST: {selectedHSN.igst}%
              </Badge>
              {selectedHSN.cess && (
                <Badge variant="outline" className="bg-white text-xs">
                  Cess: {selectedHSN.cess}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSNSearch;