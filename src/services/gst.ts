import api from './api';

export interface GSTTaxpayerDetails {
  // Core GST API fields
  ntcrbs: string;
  adhrVFlag: string;
  lgnm: string;
  stj: string;
  dty: string;
  cxdt: string;
  gstin: string;
  nba: string[];
  ekycVFlag: string;
  cmpRt: string;
  rgdt: string;
  ctb: string;
  pradr: {
    adr: string;
  };
  sts: string;
  tradeNam: string;
  isFieldVisitConducted: string;
  ctj: string;
  einvoiceStatus: string;
  
  // Enhanced fields added by backend transformation
  businessType?: string;
  
  // Form-ready fields
  company_name?: string;
  name?: string;
  tradeName?: string;
  
  // Contact information
  contactName?: string;
  email?: string;
  phone?: string;
  
  // Additional data
  address?: string;
  industry?: string;
  pan?: string;
  state?: string;
  registrationDate?: string;
  status?: string;
  establishmentYear?: string;
  yearsInBusiness?: number;
  
  // Data quality indicators
  dataCompleteness?: number;
  dataSource?: string;
  lastUpdated?: string;
  fetchedAt?: string;
}

export interface GSTFinancialYear {
  year: string;
  value: string;
}

export interface GSTFilingRecord {
  fy: string;
  taxp: string;
  mof: string;
  dueDate?: string;
  dof: string;
  rtntype: string;
  arn: string;
  status: string;
}

export interface GSTFilingStatus {
  year: string;
  value: string;
  filingData: {
    filingStatus: GSTFilingRecord[][];
    status: string;
  };
}

export interface GSTComprehensiveInfo {
  taxpayerDetails: GSTTaxpayerDetails;
  financialYears: GSTFinancialYear[];
  filingData: GSTFilingStatus[];
  dataQuality?: {
    source: string;
    completeness: number;
    lastUpdated: string;
  };
}

export interface GSTDataQuality {
  source: string;
  completeness: number;
  lastUpdated: string;
  hasEmail: boolean;
  hasContactName: boolean;
  hasCompleteAddress: boolean;
}

export interface GSTValidationResult {
  gstin: string;
  isValid: boolean;
  state: string | null;
  format: string;
}

class GSTService {
  // Validate GSTIN format
  async validateGSTIN(gstin: string): Promise<GSTValidationResult> {
    try {
      const response = await api.get(`/gst/validate/${gstin}`) as any;
      return response.data?.data || {
        gstin,
        isValid: this.validateGSTINFormat(gstin),
        state: this.getStateFromGSTIN(gstin),
        format: this.validateGSTINFormat(gstin) ? 'Valid' : 'Invalid GSTIN format'
      };
    } catch (error) {
      console.error('Backend GST validation failed:', error);
      // Fallback to frontend validation
      return {
        gstin,
        isValid: this.validateGSTINFormat(gstin),
        state: this.getStateFromGSTIN(gstin),
        format: this.validateGSTINFormat(gstin) ? 'Valid' : 'Invalid GSTIN format'
      };
    }
  }

  // Lookup basic taxpayer details
  async lookupTaxpayerDetails(gstin: string, captcha?: string): Promise<GSTTaxpayerDetails> {
    const response = await api.post('/gst/lookup', {
      gstin,
      captcha: captcha || '000000'
    }) as any;
    return response.data.data;
  }

  // Get financial years for GSTIN
  async getFinancialYears(gstin: string): Promise<GSTFinancialYear[]> {
    const response = await api.get(`/gst/financial-years/${gstin}`) as any;
    return response.data.data?.data || [];
  }

  // Get filing status for specific year
  async getFilingStatus(gstin: string, fy: string): Promise<GSTFilingRecord[][]> {
    const response = await api.post('/gst/filing-status', {
      gstin,
      fy
    }) as any;
    return response.data.data?.filingStatus || [];
  }

  // Get comprehensive GST information
  async getComprehensiveInfo(gstin: string, captcha?: string): Promise<GSTComprehensiveInfo> {
    console.log('🔍 GSTService: Making API call to /gst/comprehensive');
    console.log('📝 Request data:', { gstin, captcha: captcha || '000000' });
    
    try {
      const response = await api.post('/gst/comprehensive', {
        gstin,
        captcha: captcha || '000000'
      }) as any;
      
      console.log('✅ GSTService: Raw API response received');
      console.log('📊 GSTService: Full response object:', response);
      console.log('📊 GSTService: Response type:', typeof response);
      console.log('📊 GSTService: Response keys:', response ? Object.keys(response) : 'response is null');
      console.log('📊 GSTService: response.data exists:', response.data ? 'YES' : 'NO');
      console.log('📊 GSTService: response.data:', response.data);
      
      if (response.data) {
        console.log('📊 GSTService: response.data type:', typeof response.data);
        console.log('📊 GSTService: response.data keys:', Object.keys(response.data));
        console.log('📊 GSTService: response.data.data exists:', response.data.data ? 'YES' : 'NO');
        console.log('📊 GSTService: response.data.data:', response.data.data);
      }
      
      // Check the response structure more carefully
      let result;
      if (response.data && response.data.data) {
        // Expected structure: response.data.data
        result = response.data.data;
        console.log('✅ GSTService: Using response.data.data structure');
      } else if (response.data && response.data.success && response.data.data) {
        // Alternative structure: response.data contains success and data
        result = response.data.data;
        console.log('✅ GSTService: Using alternative structure with success flag');
      } else if (response.data) {
        // Maybe the data is directly in response.data
        result = response.data;
        console.log('✅ GSTService: Using response.data directly');
      } else if (response) {
        // Maybe the data is directly in response
        result = response;
        console.log('✅ GSTService: Using response directly');
      } else {
        console.error('❌ GSTService: No valid data structure found');
        throw new Error('Invalid response structure from GST API');
      }
      
      console.log('🎉 GSTService: Final result to return:', result);
      console.log('🎉 GSTService: Result has taxpayerDetails:', result?.taxpayerDetails ? 'YES' : 'NO');
      
      return result;
    } catch (error) {
      console.error('❌ GSTService: API call failed:', error);
      throw error;
    }
  }

  // Extract PAN from GSTIN
  extractPANFromGSTIN(gstin: string): string {
    if (!this.validateGSTINFormat(gstin)) return '';
    // PAN is characters 3-12 (10 characters) from GSTIN
    // Format: XX-AAAAAAAAAA-X-XX where AAAAAAAAAA is PAN
    return gstin.substring(2, 12);
  }

  // Format GSTIN with proper spacing
  formatGSTINWithSpacing(gstin: string): string {
    if (!this.validateGSTINFormat(gstin)) return gstin;
    // Format: XX-AAAAAAAAAA-X-XX
    return `${gstin.substring(0, 2)}-${gstin.substring(2, 12)}-${gstin.substring(12, 13)}-${gstin.substring(13, 15)}`;
  }

  // Validate GSTIN format on frontend
  validateGSTINFormat(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  // Extract state from GSTIN
  getStateFromGSTIN(gstin: string): string | null {
    if (!this.validateGSTINFormat(gstin)) return null;
    
    const stateCode = gstin.substring(0, 2);
    const stateCodes: Record<string, string> = {
      '01': 'Jammu and Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '11': 'Sikkim',
      '12': 'Arunachal Pradesh',
      '13': 'Nagaland',
      '14': 'Manipur',
      '15': 'Mizoram',
      '16': 'Tripura',
      '17': 'Meghalaya',
      '18': 'Assam',
      '19': 'West Bengal',
      '20': 'Jharkhand',
      '21': 'Odisha',
      '22': 'Chhattisgarh',
      '23': 'Madhya Pradesh',
      '24': 'Gujarat',
      '25': 'Daman and Diu',
      '26': 'Dadra and Nagar Haveli',
      '27': 'Maharashtra',
      '28': 'Andhra Pradesh',
      '29': 'Karnataka',
      '30': 'Goa',
      '31': 'Lakshadweep',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '34': 'Puducherry',
      '35': 'Andaman and Nicobar Islands',
      '36': 'Telangana',
      '37': 'Andhra Pradesh',
      '38': 'Ladakh'
    };
    
    return stateCodes[stateCode] || 'Unknown State';
  }

  // Format company type from GSTIN
  formatCompanyType(ctb: string): string {
    const companyTypes: Record<string, string> = {
      'Partnership': 'Partnership Firm',
      'Private Limited Company': 'Private Limited',
      'Public Limited Company': 'Public Limited',
      'Proprietorship': 'Sole Proprietorship',
      'LLP': 'Limited Liability Partnership',
      'Trust': 'Trust',
      'Society': 'Society',
      'HUF': 'Hindu Undivided Family',
      'Government': 'Government Entity',
      'Others': 'Others'
    };
    
    return companyTypes[ctb] || ctb;
  }

  // Parse and format address
  parseAddress(address: string): {
    address: string;
    city: string;
    state: string;
    pincode: string;
  } {
    // Basic address parsing - can be enhanced based on actual data format
    const parts = address.split(',').map(part => part.trim());
    const lastPart = parts[parts.length - 1];
    const pincodeMatch = lastPart.match(/\d{6}/);
    
    return {
      address: parts.slice(0, -2).join(', '),
      city: parts[parts.length - 2] || '',
      state: parts[parts.length - 1]?.replace(/\d{6}/, '').trim() || '',
      pincode: pincodeMatch ? pincodeMatch[0] : ''
    };
  }
}

export const gstService = new GSTService();