import api from './api';

export interface InvoiceAccount {
  id: string;
  name: string;
  companyName: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  razorpayDetails: {
    keyId: string;
    keySecret: string;
    accountId?: string;
    webhookSecret?: string;
  };
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoFile?: string; // Base64 encoded or file path
    footerText?: string;
    termsAndConditions?: string;
  };
}

export interface CompanySettings {
  name: string; // Primary field - matches backend
  companyName?: string; // Legacy field for backwards compatibility
  businessType?: string;
  email: string;
  phone: string;
  address: string;
  dateFormat: string;
  timeZone: string;
  currency: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  registrationNumber?: string;
  website?: string;
  description?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoFile?: string;
    footerText?: string;
    termsAndConditions?: string;
  };
  invoiceAccounts?: {
    account_1: InvoiceAccount;
    account_2: InvoiceAccount;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  taskAssignments: boolean;
  invoiceEvents: boolean;
  clientSignups: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  paymentReminders: boolean;
  deadlineAlerts: boolean;
  systemMaintenance: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginAttempts: number;
  passwordComplexity: boolean;
  ipRestriction: boolean;
  allowedIPs: string[];
}

export interface BillingSettings {
  subscriptionPlan: string;
  billingCycle: string;
  autoRenewal: boolean;
  paymentMethod: {
    type: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface SystemSettings {
  backupFrequency: string;
  dataRetention: number;
  auditLogs: boolean;
  performanceMonitoring: boolean;
  errorReporting: boolean;
  maintenanceMode: boolean;
  apiRateLimit: number;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
}

export interface AutomationSettings {
  taskReminders: boolean;
  invoiceGeneration: boolean;
  clientCommunication: boolean;
  reportGeneration: boolean;
  dataBackup: boolean;
  emailTemplates: boolean;
  workflowTriggers: boolean;
}

export interface AllSettings {
  company: CompanySettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  billing: BillingSettings;
  system: SystemSettings;
  automation: AutomationSettings;
}

class SettingsService {
  // Get all settings
  async getAllSettings(): Promise<AllSettings> {
    try {
      const response = await api.get('/settings') as any;
      console.log('📡 API response - getAllSettings:', response);
      // Normalize: some backends return { data: ... } while apiClient returns body directly
      const settings = response?.data || response;
      console.log('📡 Normalized settings:', settings);
      return settings;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  }

  // Get specific settings category
  async getSettings(category: keyof AllSettings): Promise<any> {
    try {
      const response = await api.get(`/settings/${category}`) as any;
      console.log(`📡 API response - getSettings(${category}):`, response);
      return response?.data || response;
    } catch (error) {
      console.error(`Failed to fetch ${category} settings:`, error);
      throw error;
    }
  }

  // Update specific settings category
  async updateSettings(category: keyof AllSettings, settings: any): Promise<any> {
    try {
      const response = await api.put(`/settings/${category}`, settings) as any;
      return response?.data || response;
    } catch (error) {
      console.error(`Failed to update ${category} settings:`, error);
      throw error;
    }
  }

  // Update individual setting
  async updateSetting(category: keyof AllSettings, key: string, value: any): Promise<any> {
    try {
      console.log('📡 API call - updateSetting:', { category, key, value });
      const response = await api.put(`/settings/${category}/${key}`, { value }) as any;
      console.log('📡 API response - updateSetting:', response);
      return response?.data || response;
    } catch (error) {
      console.error(`Failed to update ${category}.${key} setting:`, error);
      throw error;
    }
  }

  // Reset settings to default
  async resetSettings(category?: keyof AllSettings): Promise<any> {
    try {
      const endpoint = category ? `/settings/${category}/reset` : '/settings/reset';
      const response = await api.post(endpoint) as any;
      return response?.data || response;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  // Export settings
  async exportSettings(): Promise<AllSettings> {
    try {
      const response = await api.get('/settings/export') as any;
      return response?.data || response;
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  // Import settings
  async importSettings(settings: Partial<AllSettings>): Promise<any> {
    try {
      const response = await api.post('/settings/import', settings) as any;
      return response?.data || response;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  // Persist settings file on the backend (development only)
  async saveSettingsFile(): Promise<any> {
    try {
      const response = await api.post('/settings/save-file');
      return response;
    } catch (error) {
      console.error('Failed to save settings file:', error);
      throw error;
    }
  }

  // Get default settings
  getDefaultSettings(): AllSettings {
    return {
      company: {
        name: 'Your Firm Name',
        businessType: 'Chartered Accountancy Firm',
        email: 'contact@yourfirm.com',
        phone: '+91 00000 00000',
        address: '',
        dateFormat: 'DD/MM/YYYY',
        timeZone: 'Asia/Kolkata',
        currency: 'INR',
        gstNumber: '',
        panNumber: '',
        cinNumber: '',
        registrationNumber: '',
        website: '',
        description: '',
        invoiceAccounts: {
          account_1: {
            id: 'account_1',
            name: 'Account 1',
            companyName: 'Your Firm Name',
            gstNumber: '',
            panNumber: '',
            address: '',
            email: 'contact@yourfirm.com',
            phone: '+91 00000 00000',
            website: '',
            logo: '',
            razorpayDetails: {
              keyId: '',
              keySecret: '',
              accountId: '',
              webhookSecret: ''
            },
            branding: {
              primaryColor: '#3b82f6',
              secondaryColor: '#1e40af',
              logoFile: '',
              footerText: 'Thank you for your business!',
              termsAndConditions: 'Payment due within 30 days of invoice date.'
            }
          },
          account_2: {
            id: 'account_2',
            name: 'Account 2',
            companyName: 'Your Firm Name',
            gstNumber: '',
            panNumber: '',
            address: '',
            email: 'contact@yourfirm.com',
            phone: '+91 00000 00000',
            website: '',
            logo: '',
            razorpayDetails: {
              keyId: '',
              keySecret: '',
              accountId: '',
              webhookSecret: ''
            },
            branding: {
              primaryColor: '#10b981',
              secondaryColor: '#047857',
              logoFile: '',
              footerText: 'Thank you for your business!',
              termsAndConditions: 'Payment due within 30 days of invoice date.'
            }
          }
        }
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        taskAssignments: true,
        invoiceEvents: true,
        clientSignups: true,
        dailyReports: false,
        weeklyReports: true,
        paymentReminders: true,
        deadlineAlerts: true,
        systemMaintenance: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        loginAttempts: 5,
        passwordComplexity: true,
        ipRestriction: false,
        allowedIPs: []
      },
      billing: {
        subscriptionPlan: 'premium',
        billingCycle: 'monthly',
        autoRenewal: true,
        paymentMethod: {
          type: 'card',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025
        },
        billingAddress: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      },
      system: {
        backupFrequency: 'daily',
        dataRetention: 365,
        auditLogs: true,
        performanceMonitoring: true,
        errorReporting: true,
        maintenanceMode: false,
        apiRateLimit: 1000,
        maxFileUploadSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png']
      },
      automation: {
        taskReminders: true,
        invoiceGeneration: true,
        clientCommunication: true,
        reportGeneration: true,
        dataBackup: true,
        emailTemplates: true,
        workflowTriggers: true
      }
    };
  }
}

export const settingsService = new SettingsService();