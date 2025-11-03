import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    enum: ['invoice', 'quotation', 'proforma', 'quote_draft', 'quote_ready', 'quote_sent'],
    default: 'invoice'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'quote_draft', 'quote_ready', 'quote_sent', 'pending_approval', 'approved', 'rejected'],
    default: 'draft'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Dates
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  // Invoice items
  items: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    taxable: {
      type: Boolean,
      default: true
    },
    hsn: String, // HSN/SAC code for GST
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 28
    }
  }],
  // Amounts
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // GST details
  gst: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    applicable: { type: Boolean, default: true }
  },
  // Payment information
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'online', 'upi'],
    default: 'online'
  },
  // Bank details for payment
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },
  // Notes and terms
  notes: String,
  terms: String,
  internalNotes: String,
  
  // Collection and payment method
  collectionMethod: {
    type: String,
    enum: ['account_1', 'account_2', 'cash', 'cheque'],
    default: 'account_1'
  },
  
  // Razorpay integration data
  razorpayData: {
    paymentLinkId: String,
    orderId: String,
    shortUrl: String,
    collectionMethod: String,
    status: String,
    createdAt: Date,
    paidAt: Date
  },
  
  // Task relation for automated quote generation
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  // Admin approval workflow
  adminApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_required'],
      default: 'not_required'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    sendLater: {
      type: Boolean,
      default: false
    },
    scheduledSendDate: Date,
    notes: String
  },
  
  // Quote to Invoice conversion tracking
  conversionTracking: {
    convertedFromQuote: {
      type: Boolean,
      default: false
    },
    originalQuoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    convertedAt: Date,
    convertedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Document attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Payment tracking
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'online', 'upi'],
      required: true
    },
    reference: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  // Email tracking
  emailHistory: [{
    sentTo: String,
    sentAt: { type: Date, default: Date.now },
    subject: String,
    opened: { type: Boolean, default: false },
    openedAt: Date
  }],
  // Razorpay integration
  razorpay: {
    orderId: String,
    paymentLinkId: String,
    paymentId: String,
    signature: String
  },
  // Recurring invoice settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'yearly']
    },
    nextIssueDate: Date,
    endDate: Date,
    maxOccurrences: Number,
    currentOccurrence: { type: Number, default: 1 }
  },
  parentInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  // Template used
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvoiceTemplate'
  },
  // Reminder tracking
  reminders: [{
    sentAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['due_reminder', 'overdue_reminder', 'payment_reminder']
    },
    daysAfterDue: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ firm: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ type: 1 });

// Virtual for overdue status
invoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'paid' && new Date() > this.dueDate;
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const firm = await mongoose.model('Firm').findById(this.firm);
    let prefix = 'INV';
    
    if (this.type === 'quotation') {
      prefix = firm?.settings?.quotationPrefix || 'QUO';
    } else {
      prefix = firm?.settings?.invoicePrefix || 'INV';
    }
    
    const count = await this.constructor.countDocuments({ 
      firm: this.firm, 
      type: this.type,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), 3, 1), // Financial year starts from April
        $lt: new Date(new Date().getFullYear() + 1, 3, 1)
      }
    });
    
    const year = new Date().getFullYear().toString().slice(-2);
    this.invoiceNumber = `${prefix}${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate amounts before saving
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  
  // Apply discount
  if (this.discount.type === 'percentage') {
    this.discount.amount = (this.subtotal * this.discount.value) / 100;
  } else {
    this.discount.amount = this.discount.value;
  }
  
  const discountedAmount = this.subtotal - this.discount.amount;
  
  // Calculate tax if GST is applicable
  if (this.gst.applicable) {
    this.taxAmount = this.items.reduce((sum, item) => {
      if (item.taxable) {
        return sum + (item.amount * item.taxRate) / 100;
      }
      return sum;
    }, 0);
    
    // Distribute tax between CGST, SGST, or IGST based on business logic
    this.gst.cgst = this.taxAmount / 2;
    this.gst.sgst = this.taxAmount / 2;
    this.gst.igst = 0; // Set based on interstate transaction logic
  }
  
  // Calculate total
  this.totalAmount = discountedAmount + this.taxAmount;
  
  // Calculate balance
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    if (this.status === 'paid' || this.status === 'partially_paid') {
      this.status = 'sent';
    }
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
    if (!this.paidDate) this.paidDate = new Date();
  } else {
    this.status = 'partially_paid';
  }
  
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;