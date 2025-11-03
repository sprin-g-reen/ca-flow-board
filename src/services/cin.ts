import { apiClient } from './api';

export interface CINSearchResult {
  id: string;
  name: string;
  cin: string;
  displayText: string;
}

export interface CompanyDetails {
  cin: string;
  name: string;
  status: string;
  category: string;
  subCategory: string;
  classOfCompany: string;
  dateOfIncorporation: string;
  registeredOffice: string;
  authorizedCapital: string;
  paidUpCapital: string;
  email: string;
  website: string;
  directors: Array<{
    name: string;
    din: string;
    designation: string;
  }>;
  activities: string[];
  registrarOfCompanies: string;
}

class CINService {
  private baseUrl = 'https://www.zaubacorp.com';

  /**
   * Search for companies by name or CIN using typeahead
   */
  async searchCompanies(query: string): Promise<CINSearchResult[]> {
    try {
      // Use our backend as a proxy to avoid CORS issues
      const response = await apiClient.post('/cin/search', {
        search: query.trim(),
        filter: 'company'
      }) as { data?: { success?: boolean; results?: any[]; warning?: string; source?: string } };

      if (response.data?.success && response.data.results) {
        // Show warning if using fallback data
        if (response.data.source?.includes('fallback') && response.data.warning) {
          console.warn('CIN Search Warning:', response.data.warning);
        }
        
        return response.data.results.map((result: any) => ({
          id: result.id,
          name: result.name,
          cin: result.cin,
          displayText: result.displayText || result.name
        }));
      }

      return [];
    } catch (error) {
      console.error('CIN search error:', error);
      throw new Error('Failed to search companies. Please try again.');
    }
  }



  /**
   * Get detailed company information by company ID/URL slug
   */
  async getCompanyDetails(companyId: string): Promise<CompanyDetails> {
    try {
      // Use our backend as a proxy to get company details
      const response = await apiClient.get(`/cin/details/${encodeURIComponent(companyId)}`) as { 
        data?: { 
          success?: boolean;
          companyDetails?: CompanyDetails; 
          source?: string; 
          warning?: string;
        } 
      };

      if (response.data?.companyDetails) {
        // Show warning if using fallback data
        if (response.data.source?.includes('fallback') && response.data.warning) {
          console.warn('CIN Details Warning:', response.data.warning);
        }
        
        return response.data.companyDetails;
      }

      throw new Error('Company details not found');
    } catch (error) {
      console.error('Error fetching company details:', error);
      throw new Error('Failed to fetch company details. Please try again.');
    }
  }

  /**
   * Validate CIN format
   */
  validateCIN(cin: string): { isValid: boolean; message?: string } {
    if (!cin) {
      return { isValid: false, message: 'CIN is required' };
    }

    // CIN format: L/U + 5 digits + state code (2 letters) + year (4 digits) + type (3 letters) + sequence (6 digits)
    const cinPattern = /^[ULF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
    
    if (!cinPattern.test(cin.toUpperCase())) {
      return { 
        isValid: false, 
        message: 'Invalid CIN format. Expected format: U12345AB2021PTC123456' 
      };
    }

    return { isValid: true };
  }

  /**
   * Extract company information from CIN
   */
  parseCIN(cin: string): {
    category: string;
    subCategory: number;
    state: string;
    year: number;
    type: string;
    sequence: number;
  } | null {
    const validation = this.validateCIN(cin);
    if (!validation.isValid) {
      return null;
    }

    const normalized = cin.toUpperCase();
    
    return {
      category: normalized[0], // L = Listed, U = Unlisted, F = Foreign
      subCategory: parseInt(normalized.slice(1, 6)),
      state: normalized.slice(6, 8),
      year: parseInt(normalized.slice(8, 12)),
      type: normalized.slice(12, 15), // PTC = Private, PLC = Public, etc.
      sequence: parseInt(normalized.slice(15, 21))
    };
  }

  /**
   * Format CIN with proper spacing for display
   */
  formatCIN(cin: string): string {
    const validation = this.validateCIN(cin);
    if (!validation.isValid) {
      return cin;
    }

    const normalized = cin.toUpperCase();
    return `${normalized.slice(0, 1)}${normalized.slice(1, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 12)} ${normalized.slice(12, 15)} ${normalized.slice(15, 21)}`;
  }
}

export const cinService = new CINService();