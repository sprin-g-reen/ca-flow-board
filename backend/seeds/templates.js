/**
 * Common CA Task Templates
 * These are standard templates that every CA firm needs
 */

export const commonTemplates = [
  // ==================== GST TEMPLATES ====================
  {
    title: 'GST Return Filing - GSTR-1',
    description: 'Monthly outward supply return filing with invoice details',
    category: 'gst',
    is_recurring: true,
    recurrence_pattern: 'monthly',
    is_payable_task: true,
    price: 1500,
    payable_task_type: 'payable_task_1',
    deadline: '11th of every month',
    estimated_hours: 3,
    complexity: 'medium',
    tags: ['gst', 'compliance', 'monthly', 'filing'],
    subtasks: [
      {
        title: 'Collect invoice data from client',
        description: 'Gather all B2B, B2C, export invoices and credit/debit notes',
        dueDate: '5th of month',
        order: 1,
        estimatedHours: 0.5
      },
      {
        title: 'Verify HSN codes and tax rates',
        description: 'Check accuracy of HSN codes and applicable GST rates',
        dueDate: '7th of month',
        order: 2,
        estimatedHours: 1
      },
      {
        title: 'Prepare and upload GSTR-1',
        description: 'Enter data on GST portal and upload return',
        dueDate: '9th of month',
        order: 3,
        estimatedHours: 1
      },
      {
        title: 'File return and obtain ARN',
        description: 'Submit return and save acknowledgement number',
        dueDate: '11th of month',
        order: 4,
        estimatedHours: 0.5
      }
    ]
  },
  {
    title: 'GST Return Filing - GSTR-3B',
    description: 'Monthly summary return with tax liability and input tax credit',
    category: 'gst',
    is_recurring: true,
    recurrence_pattern: 'monthly',
    is_payable_task: true,
    price: 1200,
    payable_task_type: 'payable_task_1',
    deadline: '20th of every month',
    estimated_hours: 2.5,
    complexity: 'medium',
    tags: ['gst', 'compliance', 'monthly', 'filing'],
    subtasks: [
      {
        title: 'Reconcile GSTR-2A with purchase records',
        description: 'Match input tax credit with supplier returns',
        dueDate: '15th of month',
        order: 1,
        estimatedHours: 1
      },
      {
        title: 'Calculate tax liability',
        description: 'Compute output tax and eligible input tax credit',
        dueDate: '17th of month',
        order: 2,
        estimatedHours: 0.5
      },
      {
        title: 'Prepare GSTR-3B summary',
        description: 'Fill all tables with accurate figures',
        dueDate: '18th of month',
        order: 3,
        estimatedHours: 0.5
      },
      {
        title: 'File return and make payment',
        description: 'Submit return and pay tax liability online',
        dueDate: '20th of month',
        order: 4,
        estimatedHours: 0.5
      }
    ]
  },
  {
    title: 'GST Annual Return - GSTR-9',
    description: 'Annual GST return consolidating all monthly/quarterly returns',
    category: 'gst',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 8000,
    payable_task_type: 'payable_task_2',
    deadline: '31st December',
    estimated_hours: 12,
    complexity: 'complex',
    tags: ['gst', 'compliance', 'annual', 'filing'],
    subtasks: [
      {
        title: 'Collect all financial records for FY',
        description: 'Gather books of accounts, returns filed, and supporting documents',
        dueDate: '15th November',
        order: 1,
        estimatedHours: 2
      },
      {
        title: 'Reconcile returns with books',
        description: 'Match GSTR-1, 3B with financial statements',
        dueDate: '30th November',
        order: 2,
        estimatedHours: 4
      },
      {
        title: 'Prepare GSTR-9 draft',
        description: 'Fill all sections of annual return',
        dueDate: '15th December',
        order: 3,
        estimatedHours: 4
      },
      {
        title: 'Review and file GSTR-9',
        description: 'Final verification and submission on portal',
        dueDate: '31st December',
        order: 4,
        estimatedHours: 2
      }
    ]
  },

  // ==================== ITR TEMPLATES ====================
  {
    title: 'Income Tax Return - ITR-1 (Salaried)',
    description: 'Individual income tax return for salary income',
    category: 'itr',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 2500,
    payable_task_type: 'payable_task_1',
    deadline: '31st July',
    estimated_hours: 3,
    complexity: 'simple',
    tags: ['itr', 'income-tax', 'individual', 'salaried'],
    subtasks: [
      {
        title: 'Collect Form 16 and salary slips',
        description: 'Get TDS certificate and complete salary details',
        dueDate: '15th June',
        order: 1,
        estimatedHours: 0.5
      },
      {
        title: 'Gather investment proofs',
        description: 'Collect 80C, 80D, home loan interest certificates',
        dueDate: '30th June',
        order: 2,
        estimatedHours: 0.5
      },
      {
        title: 'Compute taxable income',
        description: 'Calculate gross total income and deductions',
        dueDate: '15th July',
        order: 3,
        estimatedHours: 1
      },
      {
        title: 'File ITR-1 online',
        description: 'Submit return on income tax portal with e-verification',
        dueDate: '31st July',
        order: 4,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'Income Tax Return - ITR-3 (Business)',
    description: 'Income tax return for business and professional income',
    category: 'itr',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 5000,
    payable_task_type: 'payable_task_2',
    deadline: '31st July',
    estimated_hours: 8,
    complexity: 'complex',
    tags: ['itr', 'income-tax', 'business', 'professional'],
    subtasks: [
      {
        title: 'Prepare books of accounts',
        description: 'Finalize ledgers, profit & loss, balance sheet',
        dueDate: '30th June',
        order: 1,
        estimatedHours: 3
      },
      {
        title: 'Calculate business income',
        description: 'Compute income as per tax provisions with adjustments',
        dueDate: '10th July',
        order: 2,
        estimatedHours: 2
      },
      {
        title: 'Prepare tax computation',
        description: 'Calculate tax liability, advance tax, and TDS',
        dueDate: '20th July',
        order: 3,
        estimatedHours: 2
      },
      {
        title: 'File ITR-3 with audit report',
        description: 'Upload return with Form 3CD if audit applicable',
        dueDate: '31st July',
        order: 4,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'TDS Return Filing - 24Q (Salary)',
    description: 'Quarterly TDS return for salary payments',
    category: 'itr',
    is_recurring: true,
    recurrence_pattern: 'quarterly',
    is_payable_task: true,
    price: 2000,
    payable_task_type: 'payable_task_1',
    deadline: '31st of quarter end month',
    estimated_hours: 4,
    complexity: 'medium',
    tags: ['tds', 'compliance', 'quarterly', 'salary'],
    subtasks: [
      {
        title: 'Collect employee salary data',
        description: 'Get salary register with PAN and TDS details',
        dueDate: '15th of quarter end month',
        order: 1,
        estimatedHours: 1
      },
      {
        title: 'Verify TDS deducted and deposited',
        description: 'Match challan payments with deductions',
        dueDate: '20th of quarter end month',
        order: 2,
        estimatedHours: 1
      },
      {
        title: 'Prepare return file',
        description: 'Create RPU file with all salary details',
        dueDate: '25th of quarter end month',
        order: 3,
        estimatedHours: 1
      },
      {
        title: 'Upload and file TDS return',
        description: 'Submit on TRACES portal and download receipt',
        dueDate: '31st of quarter end month',
        order: 4,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'TDS Return Filing - 26Q (Non-Salary)',
    description: 'Quarterly TDS return for payments other than salary',
    category: 'itr',
    is_recurring: true,
    recurrence_pattern: 'quarterly',
    is_payable_task: true,
    price: 2500,
    payable_task_type: 'payable_task_1',
    deadline: '31st of quarter end month',
    estimated_hours: 5,
    complexity: 'medium',
    tags: ['tds', 'compliance', 'quarterly', 'non-salary'],
    subtasks: [
      {
        title: 'Compile all payment vouchers',
        description: 'Collect contractor, professional fees, rent vouchers',
        dueDate: '10th of quarter end month',
        order: 1,
        estimatedHours: 1.5
      },
      {
        title: 'Verify PAN and section codes',
        description: 'Check PAN validity and correct TDS sections',
        dueDate: '20th of quarter end month',
        order: 2,
        estimatedHours: 1.5
      },
      {
        title: 'Prepare 26Q return file',
        description: 'Create RPU with all deductee details',
        dueDate: '25th of quarter end month',
        order: 3,
        estimatedHours: 1
      },
      {
        title: 'File return on TRACES',
        description: 'Upload and submit return online',
        dueDate: '31st of quarter end month',
        order: 4,
        estimatedHours: 1
      }
    ]
  },

  // ==================== ROC TEMPLATES ====================
  {
    title: 'Annual Filing - AOC-4 (Financial Statements)',
    description: 'Filing of annual accounts with Registrar of Companies',
    category: 'roc',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 6000,
    payable_task_type: 'payable_task_2',
    deadline: '30th November',
    estimated_hours: 10,
    complexity: 'complex',
    tags: ['roc', 'compliance', 'annual', 'financial-statements'],
    subtasks: [
      {
        title: 'Prepare financial statements',
        description: 'Finalize Balance Sheet, P&L, Cash Flow Statement',
        dueDate: '30th September',
        order: 1,
        estimatedHours: 4
      },
      {
        title: 'Get Board approval',
        description: 'Conduct Board meeting and get approval on accounts',
        dueDate: '15th October',
        order: 2,
        estimatedHours: 1
      },
      {
        title: 'Obtain digital signatures',
        description: 'Get DSC from Directors and auditor',
        dueDate: '31st October',
        order: 3,
        estimatedHours: 1
      },
      {
        title: 'File AOC-4 on MCA portal',
        description: 'Upload documents and submit form',
        dueDate: '30th November',
        order: 4,
        estimatedHours: 4
      }
    ]
  },
  {
    title: 'Annual Filing - MGT-7 (Annual Return)',
    description: 'Annual return filing with company details and shareholding',
    category: 'roc',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 5000,
    payable_task_type: 'payable_task_2',
    deadline: '30th November',
    estimated_hours: 8,
    complexity: 'complex',
    tags: ['roc', 'compliance', 'annual', 'return'],
    subtasks: [
      {
        title: 'Update company master data',
        description: 'Verify registered office, directors, shareholders details',
        dueDate: '31st August',
        order: 1,
        estimatedHours: 2
      },
      {
        title: 'Prepare shareholding pattern',
        description: 'Update share transfer register and debenture details',
        dueDate: '30th September',
        order: 2,
        estimatedHours: 2
      },
      {
        title: 'Complete MGT-7 form',
        description: 'Fill all annexures and attachments',
        dueDate: '31st October',
        order: 3,
        estimatedHours: 3
      },
      {
        title: 'File MGT-7 online',
        description: 'Submit on MCA portal with required fees',
        dueDate: '30th November',
        order: 4,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'Form DIR-3 KYC (Director KYC)',
    description: 'Annual KYC for all Directors with DIN',
    category: 'roc',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 1500,
    payable_task_type: 'payable_task_1',
    deadline: '30th September',
    estimated_hours: 2,
    complexity: 'simple',
    tags: ['roc', 'compliance', 'director', 'kyc'],
    subtasks: [
      {
        title: 'Collect director details',
        description: 'Get updated address, email, mobile, and documents',
        dueDate: '31st August',
        order: 1,
        estimatedHours: 0.5
      },
      {
        title: 'Verify DIN and DSC validity',
        description: 'Check DIN status and digital signature certificate',
        dueDate: '10th September',
        order: 2,
        estimatedHours: 0.5
      },
      {
        title: 'File DIR-3 KYC',
        description: 'Submit form for each director with DSC',
        dueDate: '30th September',
        order: 3,
        estimatedHours: 1
      }
    ]
  },

  // ==================== AUDIT TEMPLATES ====================
  {
    title: 'Tax Audit - Form 3CD',
    description: 'Tax audit report for business exceeding turnover threshold',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 15000,
    payable_task_type: 'payable_task_2',
    deadline: '30th September',
    estimated_hours: 40,
    complexity: 'complex',
    tags: ['audit', 'tax-audit', 'compliance'],
    subtasks: [
      {
        title: 'Plan audit and send engagement letter',
        description: 'Prepare audit plan and get client acceptance',
        dueDate: '15th June',
        order: 1,
        estimatedHours: 2
      },
      {
        title: 'Conduct audit procedures',
        description: 'Verify books, vouchers, compliance with tax provisions',
        dueDate: '31st July',
        order: 2,
        estimatedHours: 25
      },
      {
        title: 'Prepare Form 3CD',
        description: 'Complete all clauses with findings and observations',
        dueDate: '31st August',
        order: 3,
        estimatedHours: 10
      },
      {
        title: 'Issue audit report',
        description: 'Sign and deliver Form 3CA/3CB and 3CD',
        dueDate: '30th September',
        order: 4,
        estimatedHours: 3
      }
    ]
  },
  {
    title: 'Statutory Audit - Companies Act',
    description: 'Annual audit of company financial statements',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'yearly',
    is_payable_task: true,
    price: 25000,
    payable_task_type: 'payable_task_2',
    deadline: '30th September',
    estimated_hours: 60,
    complexity: 'complex',
    tags: ['audit', 'statutory-audit', 'companies-act'],
    subtasks: [
      {
        title: 'Accept audit appointment',
        description: 'Confirm eligibility and get Board resolution',
        dueDate: '30th April',
        order: 1,
        estimatedHours: 2
      },
      {
        title: 'Plan and execute audit',
        description: 'Perform substantive and compliance testing',
        dueDate: '31st July',
        order: 2,
        estimatedHours: 40
      },
      {
        title: 'Review and finalize accounts',
        description: 'Suggest adjustments and discuss with management',
        dueDate: '31st August',
        order: 3,
        estimatedHours: 10
      },
      {
        title: 'Issue audit report',
        description: 'Sign audit report as per Companies Act format',
        dueDate: '30th September',
        order: 4,
        estimatedHours: 8
      }
    ]
  },

  // ==================== OTHER COMPLIANCE TEMPLATES ====================
  {
    title: 'PF Return Filing - ECR',
    description: 'Monthly Provident Fund return filing',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'monthly',
    is_payable_task: true,
    price: 1000,
    payable_task_type: 'payable_task_1',
    deadline: '15th of every month',
    estimated_hours: 2,
    complexity: 'simple',
    tags: ['pf', 'epf', 'compliance', 'monthly'],
    subtasks: [
      {
        title: 'Collect employee attendance',
        description: 'Get salary and attendance details for the month',
        dueDate: '5th of month',
        order: 1,
        estimatedHours: 0.5
      },
      {
        title: 'Calculate PF contributions',
        description: 'Compute employee and employer PF amounts',
        dueDate: '10th of month',
        order: 2,
        estimatedHours: 0.5
      },
      {
        title: 'Upload ECR on EPFO portal',
        description: 'Submit electronic challan cum return',
        dueDate: '15th of month',
        order: 3,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'ESI Return Filing',
    description: 'Half-yearly ESI return for employees',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'custom',
    is_payable_task: true,
    price: 1500,
    payable_task_type: 'payable_task_1',
    deadline: 'April 30 & October 31',
    estimated_hours: 3,
    complexity: 'simple',
    tags: ['esi', 'compliance', 'half-yearly'],
    subtasks: [
      {
        title: 'Collect employee details',
        description: 'Get Aadhaar, bank, and family details for new employees',
        dueDate: '10 days before deadline',
        order: 1,
        estimatedHours: 1
      },
      {
        title: 'Calculate ESI contributions',
        description: 'Compute 6 months contribution for all employees',
        dueDate: '5 days before deadline',
        order: 2,
        estimatedHours: 1
      },
      {
        title: 'File return online',
        description: 'Submit on ESIC portal with payment',
        dueDate: 'Deadline day',
        order: 3,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'Professional Tax Return',
    description: 'Monthly/Quarterly professional tax return filing',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'monthly',
    is_payable_task: true,
    price: 800,
    payable_task_type: 'payable_task_1',
    deadline: 'Last day of next month',
    estimated_hours: 1.5,
    complexity: 'simple',
    tags: ['professional-tax', 'compliance', 'monthly'],
    subtasks: [
      {
        title: 'Calculate PT liability',
        description: 'Compute professional tax as per state rates',
        dueDate: '15th of next month',
        order: 1,
        estimatedHours: 0.5
      },
      {
        title: 'File PT return',
        description: 'Submit return on state portal',
        dueDate: 'Last day of next month',
        order: 2,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'Accounting & Bookkeeping (Monthly)',
    description: 'Monthly accounting services and book maintenance',
    category: 'other',
    is_recurring: true,
    recurrence_pattern: 'monthly',
    is_payable_task: true,
    price: 3000,
    payable_task_type: 'payable_task_1',
    deadline: '10th of every month',
    estimated_hours: 8,
    complexity: 'medium',
    tags: ['accounting', 'bookkeeping', 'monthly'],
    subtasks: [
      {
        title: 'Collect vouchers and bills',
        description: 'Get all purchase, sales, expense, and bank statements',
        dueDate: '3rd of month',
        order: 1,
        estimatedHours: 1
      },
      {
        title: 'Enter transactions',
        description: 'Record all transactions in accounting software',
        dueDate: '7th of month',
        order: 2,
        estimatedHours: 4
      },
      {
        title: 'Reconcile bank statements',
        description: 'Match bank transactions with books',
        dueDate: '8th of month',
        order: 3,
        estimatedHours: 1.5
      },
      {
        title: 'Generate financial reports',
        description: 'Prepare P&L, Balance Sheet, cash flow for the month',
        dueDate: '10th of month',
        order: 4,
        estimatedHours: 1.5
      }
    ]
  },
  {
    title: 'Business Registration - GST',
    description: 'New GST registration for business',
    category: 'gst',
    is_recurring: false,
    is_payable_task: true,
    price: 3500,
    payable_task_type: 'payable_task_1',
    deadline: 'As per client requirement',
    estimated_hours: 5,
    complexity: 'medium',
    tags: ['gst', 'registration', 'new-business'],
    subtasks: [
      {
        title: 'Collect client documents',
        description: 'Get PAN, Aadhaar, business proof, bank statement',
        order: 1,
        estimatedHours: 1
      },
      {
        title: 'Verify address and documents',
        description: 'Check eligibility and document authenticity',
        order: 2,
        estimatedHours: 1
      },
      {
        title: 'File GST application',
        description: 'Submit REG-01 on GST portal with documents',
        order: 3,
        estimatedHours: 2
      },
      {
        title: 'Obtain GSTIN',
        description: 'Download registration certificate after approval',
        order: 4,
        estimatedHours: 1
      }
    ]
  },
  {
    title: 'Company Incorporation - Private Limited',
    description: 'Complete company registration process',
    category: 'roc',
    is_recurring: false,
    is_payable_task: true,
    price: 12000,
    payable_task_type: 'payable_task_2',
    deadline: 'As per client requirement',
    estimated_hours: 15,
    complexity: 'complex',
    tags: ['roc', 'incorporation', 'company', 'registration'],
    subtasks: [
      {
        title: 'Name reservation - RUN',
        description: 'Apply for company name approval on MCA',
        order: 1,
        estimatedHours: 2
      },
      {
        title: 'Obtain DIN and DSC',
        description: 'Get Director Identification Number and Digital Signature',
        order: 2,
        estimatedHours: 3
      },
      {
        title: 'Draft MOA and AOA',
        description: 'Prepare Memorandum and Articles of Association',
        order: 3,
        estimatedHours: 4
      },
      {
        title: 'File incorporation forms',
        description: 'Submit SPICe+ forms with required documents',
        order: 4,
        estimatedHours: 4
      },
      {
        title: 'Obtain incorporation certificate',
        description: 'Download CIN and incorporation documents',
        order: 5,
        estimatedHours: 2
      }
    ]
  }
];
