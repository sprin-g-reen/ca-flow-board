import mongoose from 'mongoose';

const clientContactSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  designation: {
    type: String,
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
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
  mobile: {
    type: String,
    trim: true,
    maxlength: [20, 'Mobile number cannot exceed 20 characters']
  },
  alternateEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  whatsapp: {
    type: String,
    trim: true,
    maxlength: [20, 'WhatsApp number cannot exceed 20 characters']
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  birthday: {
    type: Date
  },
  anniversary: {
    type: Date
  },
  // Social media handles
  linkedIn: {
    type: String,
    trim: true
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
clientContactSchema.index({ clientId: 1, isActive: 1 });
clientContactSchema.index({ firmId: 1 });
clientContactSchema.index({ email: 1 }, { sparse: true });
clientContactSchema.index({ phone: 1 }, { sparse: true });
clientContactSchema.index({ isPrimary: 1 });

// Ensure only one primary contact per client
clientContactSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary status from other contacts for this client
    await this.constructor.updateMany(
      { 
        clientId: this.clientId, 
        _id: { $ne: this._id } 
      },
      { isPrimary: false }
    );
  }
  next();
});

const ClientContact = mongoose.model('ClientContact', clientContactSchema);

export default ClientContact;