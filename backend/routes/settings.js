import express from 'express';
import auth from '../middleware/auth.js';
import { requireOwnerOrAdmin } from '../middleware/authorize.js';

const router = express.Router();

// Settings model - we'll create a simple in-memory store for now
// In production, this would be stored in MongoDB
let settingsStore = {
  company: {
    name: 'Your Firm Name',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    phone: '+91 00000 00000',
    email: 'contact@yourfirm.com',
    address: '',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Asia/Kolkata',
    currency: 'INR',
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
    email: true,
    sms: false,
    push: true,
    taskAssignments: true,
    taskCompletions: true,
    dueDateReminders: true,
    clientActivities: true,
    paymentUpdates: true,
    systemAlerts: true
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipRestrictions: false,
    allowedIPs: '',
    dataRetentionPeriod: 365,
    autoDeleteOldData: false
  },
  billing: {
    currentPlan: 'Premium',
    monthlyRate: 4999,
    nextBillingDate: 'May 15, 2025',
    autoRenewal: true,
    emailInvoices: true,
    taxId: '',
    billingAddress: ''
  },
  system: {
    enableDebugMode: false,
    logLevel: 'info',
    maintenanceMode: false,
    backupFrequency: 'daily',
    apiRateLimit: 1000
  },
  automation: {
    enableRecurringTasks: true,
    enableEmailTemplates: true,
    enableNotificationRules: true,
    taskReminderDays: 3,
    invoiceReminderDays: 7
  }
};

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private (Owner/Admin only)
router.get('/', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: settingsStore
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/settings/:category
// @desc    Get settings by category
// @access  Private (Owner/Admin only)
router.get('/:category', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!settingsStore[category]) {
      return res.status(404).json({ 
        success: false,
        message: 'Settings category not found' 
      });
    }

    res.json({
      success: true,
      data: settingsStore[category]
    });
  } catch (error) {
    console.error('Error fetching settings category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/settings/:category
// @desc    Update settings for a category
// @access  Private (Owner/Admin only)
router.put('/:category', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const settings = req.body;

    if (!settingsStore[category]) {
      return res.status(404).json({ 
        success: false,
        message: 'Settings category not found' 
      });
    }

    // Update the settings
    settingsStore[category] = { ...settingsStore[category], ...settings };

    res.json({
      success: true,
      data: settingsStore[category],
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/settings/:category/:key
// @desc    Update a specific setting
// @access  Private (Owner/Admin only)
router.put('/:category/:key', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { category, key } = req.params;
    const { value } = req.body;
    
    if (!settingsStore[category]) {
      return res.status(404).json({ 
        success: false,
        message: 'Settings category not found' 
      });
    }

    // For nested updates, simply set the value
    // This allows updating nested objects like invoiceAccounts
    settingsStore[category][key] = value;

    res.json({ 
      success: true,
      data: {
        category,
        key,
        value: settingsStore[category][key]
      },
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   POST /api/settings/reset
// @desc    Reset settings to default values
// @access  Private (Owner/Admin only)
router.post('/reset', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { category } = req.body;

    // Default settings
    const defaultSettings = {
      company: {
        name: 'Your Firm Name',
        registrationNumber: '',
        gstNumber: '',
        panNumber: '',
        phone: '+91 00000 00000',
        email: 'contact@yourfirm.com',
        address: '',
        dateFormat: 'DD/MM/YYYY',
        timeZone: 'Asia/Kolkata',
        currency: 'INR',
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
        email: true,
        sms: false,
        push: true,
        taskAssignments: true,
        taskCompletions: true,
        dueDateReminders: true,
        clientActivities: true,
        paymentUpdates: true,
        systemAlerts: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        ipRestrictions: false,
        allowedIPs: '',
        dataRetentionPeriod: 365,
        autoDeleteOldData: false
      },
      billing: {
        currentPlan: 'Premium',
        monthlyRate: 4999,
        nextBillingDate: 'May 15, 2025',
        autoRenewal: true,
        emailInvoices: true,
        taxId: '',
        billingAddress: ''
      },
      system: {
        enableDebugMode: false,
        logLevel: 'info',
        maintenanceMode: false,
        backupFrequency: 'daily',
        apiRateLimit: 1000
      },
      automation: {
        enableRecurringTasks: true,
        enableEmailTemplates: true,
        enableNotificationRules: true,
        taskReminderDays: 3,
        invoiceReminderDays: 7
      }
    };

    if (category) {
      // Reset specific category
      if (!defaultSettings[category]) {
        return res.status(404).json({ message: 'Settings category not found' });
      }
      settingsStore[category] = { ...defaultSettings[category] };
      res.json(settingsStore[category]);
    } else {
      // Reset all settings
      settingsStore = { ...defaultSettings };
      res.json(settingsStore);
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/settings/export
// @desc    Export settings
// @access  Private (Owner/Admin only)
router.post('/export', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      settings: settingsStore
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/settings/import
// @desc    Import settings
// @access  Private (Owner/Admin only)
router.post('/import', auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    // Validate and merge imported settings
    const validCategories = ['company', 'notifications', 'security', 'billing', 'system', 'automation'];
    
    for (const category of validCategories) {
      if (settings[category]) {
        // Validate each setting in the category
        const validatedSettings = {};
        for (const [key, value] of Object.entries(settings[category])) {
          if (settingsStore[category] && settingsStore[category].hasOwnProperty(key)) {
            validatedSettings[key] = value;
          }
        }
        
        if (Object.keys(validatedSettings).length > 0) {
          settingsStore[category] = {
            ...settingsStore[category],
            ...validatedSettings
          };
        }
      }
    }

    res.json({
      message: 'Settings imported successfully',
      settings: settingsStore
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;