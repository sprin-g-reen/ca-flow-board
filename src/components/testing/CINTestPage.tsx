import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CINSearch } from '@/components/shared/CINSearch';
import { CINSearchResult, CompanyDetails } from '@/services/cin';

export const CINTestPage: React.FC = () => {
  const handleCINSelect = (company: CINSearchResult, details?: CompanyDetails) => {
    console.log('Selected company:', company);
    console.log('Company details:', details);
  };

  const handleCINClear = () => {
    console.log('CIN search cleared');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CIN Search Test</h1>
        <p className="text-muted-foreground">
          Test the CIN search functionality with company name or CIN number
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CIN Lookup Test</CardTitle>
          <CardDescription>
            Try searching for companies by name (e.g., "Sprin", "Infosys") or by CIN number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CINSearch
            onSelect={handleCINSelect}
            onClear={handleCINClear}
            placeholder="Search by company name or CIN..."
            label="Company Search"
            showDetails={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Test Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Search by company name: "Sprin", "Infosys", "TCS", "Wipro"</li>
              <li>Search by CIN: "U72900TZ2022PTC040031" (example)</li>
              <li>Try typing partial names to see autocomplete suggestions</li>
              <li>Select a company to see detailed information</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold">Expected Behavior:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Type minimum 2 characters to trigger search</li>
              <li>See dropdown with company suggestions</li>
              <li>Click on a company to select it</li>
              <li>View detailed company information below</li>
              <li>Check browser console for logged data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};