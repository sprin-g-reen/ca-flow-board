import api from './api';

// HSN/SAC Codes with GST rates
export interface HSNCode {
  hsn: string;
  description: string;
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  category: string;
}

// Service for HSN/SAC lookup and GST rate fetching
class HSNService {
  private hsnData: HSNCode[] = [];
  private initialized = false;

  // Initialize with common HSN codes - in production this would come from API
  private async initializeHSNData() {
    if (this.initialized) return;

    try {
      // Try to fetch from API first
      const response = await api.get('/hsn/codes') as any;
      this.hsnData = response.data || [];
    } catch (error) {
      console.warn('Failed to fetch HSN data from API, using fallback data');
      
      // Fallback HSN data for common services
      this.hsnData = [
        // Professional Services
        { hsn: '998311', description: 'Accounting and bookkeeping services', cgst: 9, sgst: 9, igst: 18, category: 'Professional Services' },
        { hsn: '998312', description: 'Auditing services', cgst: 9, sgst: 9, igst: 18, category: 'Professional Services' },
        { hsn: '998313', description: 'Tax consultancy services', cgst: 9, sgst: 9, igst: 18, category: 'Professional Services' },
        { hsn: '998314', description: 'Insolvency resolution process services', cgst: 9, sgst: 9, igst: 18, category: 'Professional Services' },
        
        // Legal Services  
        { hsn: '998211', description: 'Legal services', cgst: 9, sgst: 9, igst: 18, category: 'Legal Services' },
        { hsn: '998212', description: 'Arbitration services', cgst: 9, sgst: 9, igst: 18, category: 'Legal Services' },
        
        // IT Services
        { hsn: '998431', description: 'Information technology software services', cgst: 9, sgst: 9, igst: 18, category: 'IT Services' },
        { hsn: '998432', description: 'Information technology consulting services', cgst: 9, sgst: 9, igst: 18, category: 'IT Services' },
        
        // GST Registration Services
        { hsn: '998319', description: 'GST registration services', cgst: 9, sgst: 9, igst: 18, category: 'GST Services' },
        { hsn: '998320', description: 'GST return filing services', cgst: 9, sgst: 9, igst: 18, category: 'GST Services' },
        
        // ROC Services
        { hsn: '998315', description: 'Company incorporation services', cgst: 9, sgst: 9, igst: 18, category: 'ROC Services' },
        { hsn: '998316', description: 'ROC compliance services', cgst: 9, sgst: 9, igst: 18, category: 'ROC Services' },
        
        // Income Tax Services
        { hsn: '998317', description: 'Income tax return filing services', cgst: 9, sgst: 9, igst: 18, category: 'Income Tax Services' },
        { hsn: '998318', description: 'Income tax assessment services', cgst: 9, sgst: 9, igst: 18, category: 'Income Tax Services' },
        
        // Common Goods (for reference)
        { hsn: '49011010', description: 'Printed books, brochures, leaflets', cgst: 2.5, sgst: 2.5, igst: 5, category: 'Books' },
        { hsn: '84713000', description: 'Laptops including notebooks', cgst: 9, sgst: 9, igst: 18, category: 'Electronics' },
        { hsn: '85171211', description: 'Mobile phones', cgst: 6, sgst: 6, igst: 12, category: 'Electronics' },
      ];
    }
    
    this.initialized = true;
  }

  // Search HSN codes by code or description
  async searchHSN(query: string): Promise<HSNCode[]> {
    await this.initializeHSNData();
    
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    
    return this.hsnData.filter(item => 
      item.hsn.includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results
  }

  // Get HSN details by exact code
  async getHSNByCode(hsnCode: string): Promise<HSNCode | null> {
    await this.initializeHSNData();
    
    return this.hsnData.find(item => item.hsn === hsnCode) || null;
  }

  // Calculate tax amounts based on HSN and amount
  calculateTax(hsnCode: HSNCode, amount: number, isInterState: boolean = false) {
    if (isInterState) {
      // Inter-state transaction - only IGST
      const igst = (amount * hsnCode.igst) / 100;
      const cess = hsnCode.cess ? (amount * hsnCode.cess) / 100 : 0;
      
      return {
        cgst: 0,
        sgst: 0,
        igst: igst,
        cess: cess,
        totalTax: igst + cess,
        totalAmount: amount + igst + cess
      };
    } else {
      // Intra-state transaction - CGST + SGST
      const cgst = (amount * hsnCode.cgst) / 100;
      const sgst = (amount * hsnCode.sgst) / 100;
      const cess = hsnCode.cess ? (amount * hsnCode.cess) / 100 : 0;
      
      return {
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        cess: cess,
        totalTax: cgst + sgst + cess,
        totalAmount: amount + cgst + sgst + cess
      };
    }
  }

  // Get all HSN codes for a category
  async getHSNByCategory(category: string): Promise<HSNCode[]> {
    await this.initializeHSNData();
    
    return this.hsnData.filter(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get common CA services HSN codes
  async getCAServicesHSN(): Promise<HSNCode[]> {
    await this.initializeHSNData();
    
    return this.hsnData.filter(item => 
      ['Professional Services', 'GST Services', 'ROC Services', 'Income Tax Services', 'Legal Services']
        .includes(item.category)
    );
  }
}

// Create singleton instance
export const hsnService = new HSNService();

// Export default
export default hsnService;