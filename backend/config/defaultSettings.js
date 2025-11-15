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

export default defaultSettings;
