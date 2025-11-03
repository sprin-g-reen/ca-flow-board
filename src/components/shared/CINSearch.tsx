import React, { useState, useRef, useEffect } from 'react';
import { Check, Search, Building2, Loader2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCIN } from '@/hooks/useCIN';
import { CINSearchResult, CompanyDetails } from '@/services/cin';
import { cn } from '@/lib/utils';

interface CINSearchProps {
  value?: string;
  onSelect?: (company: CINSearchResult, details?: CompanyDetails) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const CINSearch: React.FC<CINSearchProps> = ({
  value = '',
  onSelect,
  onClear,
  placeholder = "Search by company name or CIN...",
  label = "Company Information",
  disabled = false,
  showDetails = true,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    searchResults,
    selectedCompany,
    companyDetails,
    isSearching,
    isLoadingDetails,
    searchCompanies,
    selectCompany,
    clearSelection,
    validateCIN,
    formatCIN,
    populateFromCIN,
    hasResults,
    hasSelection,
    hasDetails,
    isValidCIN
  } = useCIN({ enableAutoSearch: true, searchDelay: 300, minSearchLength: 2 });

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    searchCompanies(newValue);
    
    // Check if it looks like a CIN and auto-populate
    if (newValue.length >= 21 && isValidCIN(newValue)) {
      populateFromCIN(newValue);
    }
  };

  // Handle company selection
  const handleSelect = (company: CINSearchResult) => {
    selectCompany(company);
    setInputValue(company.displayText);
    setOpen(false);
    
    if (onSelect) {
      onSelect(company, companyDetails);
    }
  };

  // Handle clear
  const handleClear = () => {
    clearSelection();
    setInputValue('');
    setOpen(false);
    
    if (onClear) {
      onClear();
    }
  };

  // Handle manual search
  const handleSearch = () => {
    if (inputValue.trim()) {
      searchCompanies(inputValue.trim());
      setOpen(true);
    }
  };

  // Check if input looks like a CIN
  const looksLikeCIN = inputValue.length >= 15 && /^[ULF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{1,6}$/.test(inputValue.toUpperCase());

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-20"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                {hasSelection && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSearch}
                  disabled={disabled || isSearching}
                  className="h-8 w-8 p-0"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search companies..." 
                value={searchQuery}
                onValueChange={searchCompanies}
              />
              <CommandList>
                {isSearching && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                )}
                
                {!isSearching && !hasResults && searchQuery.length >= 2 && (
                  <CommandEmpty>No companies found.</CommandEmpty>
                )}
                
                {hasResults && (
                  <CommandGroup>
                    {searchResults.map((company) => (
                      <CommandItem
                        key={company.id}
                        value={company.displayText}
                        onSelect={() => handleSelect(company)}
                        className="flex items-center gap-2 p-3"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground">{formatCIN(company.cin)}</div>
                        </div>
                        {selectedCompany?.id === company.id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* CIN Format Helper */}
      {looksLikeCIN && (
        <div className="text-xs text-muted-foreground">
          CIN Format: {formatCIN(inputValue)}
        </div>
      )}

      {/* Validation Message */}
      {inputValue && !isValidCIN(inputValue) && inputValue.length >= 15 && (
        <div className="text-xs text-destructive">
          Invalid CIN format. Expected: U12345AB2021PTC123456
        </div>
      )}

      {/* Selected Company Badge */}
      {hasSelection && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {selectedCompany.name}
          </Badge>
          <Badge variant="outline">
            {formatCIN(selectedCompany.cin)}
          </Badge>
        </div>
      )}

      {/* Company Details */}
      {showDetails && hasSelection && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Company Details</CardTitle>
              {isLoadingDetails && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
            <CardDescription>
              Information retrieved from company registry
            </CardDescription>
          </CardHeader>
          
          {hasDetails && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{companyDetails.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CIN</Label>
                  <p className="font-mono text-sm">{formatCIN(companyDetails.cin)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={companyDetails.status === 'Active' ? 'default' : 'destructive'}>
                    {companyDetails.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date of Incorporation</Label>
                  <p className="text-sm">{companyDetails.dateOfIncorporation}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="text-sm">{companyDetails.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Class</Label>
                  <p className="text-sm">{companyDetails.classOfCompany}</p>
                </div>
              </div>
              
              {companyDetails.registeredOffice && (
                <div>
                  <Label className="text-xs text-muted-foreground">Registered Office</Label>
                  <p className="text-sm">{companyDetails.registeredOffice}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyDetails.authorizedCapital && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Authorized Capital</Label>
                    <p className="text-sm font-medium">₹{companyDetails.authorizedCapital}</p>
                  </div>
                )}
                {companyDetails.paidUpCapital && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Paid Up Capital</Label>
                    <p className="text-sm font-medium">₹{companyDetails.paidUpCapital}</p>
                  </div>
                )}
              </div>
              
              {companyDetails.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm">{companyDetails.email}</p>
                </div>
              )}
              
              {companyDetails.website && (
                <div>
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  <a 
                    href={companyDetails.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {companyDetails.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {companyDetails.directors && companyDetails.directors.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Directors</Label>
                  <div className="space-y-2 mt-1">
                    {companyDetails.directors.slice(0, 3).map((director, index) => (
                      <div key={index} className="flex items-center justify-between text-sm border rounded p-2">
                        <span className="font-medium">{director.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {director.designation}
                        </Badge>
                      </div>
                    ))}
                    {companyDetails.directors.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{companyDetails.directors.length - 3} more directors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};