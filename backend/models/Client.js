import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [200, 'Client name cannot exceed 200 characters']
  },
  clientCode: {
    type: String,
    unique: true,
    trim: true,
    sparse: true // Allows multiple null values
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  billingAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Billing address cannot exceed 500 characters']
  },
  shippingAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Shipping address cannot exceed 500 characters']
  },
  // Company registration details
  companyRegistrationNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [50, 'Company registration number cannot exceed 50 characters']
  },
  cinNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [21, 'CIN number cannot exceed 21 characters'],
    validate: {
      validator: function(v) {
        // CIN validation pattern
        return !v || /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(v);
      },
      message: 'Please enter a valid CIN number'
    }
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [15, 'GST number cannot exceed 15 characters'],
    validate: {
      validator: function(v) {
        // GST validation pattern
        return !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Please enter a valid GST number'
    }
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [10, 'PAN number cannot exceed 10 characters'],
    validate: {
      validator: function(v) {
        // PAN validation pattern
        return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'Please enter a valid PAN number'
    }
  },
  // Business details
  businessType: {
    type: String,
    enum: [
      'proprietorship',
      'partnership',
      'private_limited',
      'public_limited',
      'llp',
      'trust',
      'society',
      'huf',
      'other'
    ],
    default: 'private_limited'
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Financial details
  paymentTerms: {
    type: Number,
    default: 30,
    min: [0, 'Payment terms cannot be negative'],
    max: [365, 'Payment terms cannot exceed 365 days']
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // GST/CIN API data (auto-populated)
  companyData: {
    registeredName: String,
    registrationDate: Date,
    status: String,
    address: String,
    directors: [{
      name: String,
      din: String,
      designation: String
    }],
    authorizedCapital: Number,
    paidUpCapital: Number,
    lastFetchedAt: Date
  },
  gstData: {
    legalName: String,
    tradeName: String,
    registrationDate: Date,
    status: String,
    businessType: String,
    stateCode: String,
    address: String,
    filingFrequency: String,
    lastFetchedAt: Date
  },
  // Firm association
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
clientSchema.index({ firmId: 1, isDeleted: 1 });
clientSchema.index({ gstNumber: 1 }, { sparse: true });
clientSchema.index({ cinNumber: 1 }, { sparse: true });
clientSchema.index({ panNumber: 1 }, { sparse: true });
clientSchema.index({ email: 1 }, { sparse: true });
clientSchema.index({ status: 1 });
clientSchema.index({ createdAt: -1 });

// Generate unique client code before saving
clientSchema.pre('save', async function(next) {
  if (this.isNew && !this.clientCode) {
    const count = await this.constructor.countDocuments({ firmId: this.firmId });
    this.clientCode = `CL${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for tasks count
clientSchema.virtual('tasksCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'clientId',
  count: true
});

// Virtual for invoices count
clientSchema.virtual('invoicesCount', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'clientId',
  count: true
});

// Virtual for total outstanding amount
clientSchema.virtual('outstandingAmount', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'clientId',
  match: { status: { $in: ['sent', 'overdue'] } },
  // This would need to be calculated in the application logic
});

// Method to fetch and update GST data
clientSchema.methods.fetchGSTData = async function() {
  if (!this.gstNumber) return null;
  
  // This would integrate with GST API
  // For now, returning a placeholder
  const gstData = {
    legalName: this.name,
    status: 'active',
    lastFetchedAt: new Date()
  };
  
  this.gstData = gstData;
  await this.save();
  return gstData;
};

// Method to fetch and update CIN data
clientSchema.methods.fetchCINData = async function() {
  if (!this.cinNumber) return null;
  
  // This would integrate with MCA API
  // For now, returning a placeholder
  const companyData = {
    registeredName: this.name,
    status: 'active',
    lastFetchedAt: new Date()
  };
  
  this.companyData = companyData;
  await this.save();
  return companyData;
};

const Client = mongoose.model('Client', clientSchema);

export default Client;