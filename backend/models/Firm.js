import mongoose from 'mongoose';

const firmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Firm name is required'],
    trim: true,
    maxlength: [200, 'Firm name cannot exceed 200 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  logo: {
    type: String,
    default: null
  },
  // Tax and legal information
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    trim: true,
    uppercase: true
  },
  // Bank details for payments
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },
  // Razorpay configuration
  paymentGateway: {
    razorpay: {
      keyId: String,
      keySecret: String,
      enabled: { type: Boolean, default: false }
    }
  },
  // Firm settings
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    invoicePrefix: { type: String, default: 'INV' },
    quotationPrefix: { type: String, default: 'QUO' },
    taskPrefix: { type: String, default: 'TSK' },
    autoInvoiceGeneration: { type: Boolean, default: true },
    reminderDays: { type: Number, default: 3 },
    allowClientSelfRegistration: { type: Boolean, default: false }
  },
  // Subscription and billing
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'trial', 'expired'], default: 'trial' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxUsers: { type: Number, default: parseInt(process.env.DEFAULT_MAX_USERS) || 5 },
    maxClients: { type: Number, default: parseInt(process.env.DEFAULT_MAX_CLIENTS) || 50 },
    maxStorage: { type: Number, default: parseInt(process.env.DEFAULT_MAX_STORAGE) || 1000 } // in MB
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
firmSchema.index({ email: 1 });
firmSchema.index({ owner: 1 });
firmSchema.index({ isActive: 1 });

// Virtual for full address
firmSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Virtual to get total users count
firmSchema.virtual('totalUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'firmId',
  count: true
});

// Virtual to get total clients count
firmSchema.virtual('totalClients', {
  ref: 'User',
  localField: '_id',
  foreignField: 'firmId',
  count: true,
  match: { role: 'client' }
});

const Firm = mongoose.model('Firm', firmSchema);

export default Firm;