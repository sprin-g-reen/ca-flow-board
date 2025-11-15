import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-z0-9._-]{3,30}$/, 'Username may contain letters, numbers, dot, underscore and hyphen']
  },
  email: {
    type: String,
    required: false,
    unique: false,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'owner', 'employee', 'client'],
    default: 'employee',
    required: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: function() {
      return this.role !== 'superadmin';
    }
  },
  // Employee specific fields
  employeeId: {
    type: String,
    sparse: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['taxation', 'audit', 'advisory', 'compliance', 'general'],
    default: 'general'
  },
  expertise: [{
    type: String,
    enum: ['gst', 'income_tax', 'corporate_tax', 'audit', 'compliance', 'advisory']
  }],
  salary: {
    type: Number,
    min: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  // Client specific fields
  clientId: {
    type: String,
    sparse: true,
    unique: true
  },
  companyName: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  preferredCommunication: {
    type: String,
    enum: ['email', 'phone', 'whatsapp'],
    default: 'email'
  },
  // Notification preferences
  notificationPreferences: {
    email: {
      taskAssigned: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      taskOverdue: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      taskUpdated: { type: Boolean, default: false },
      clientDocumentUploaded: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      systemAnnouncement: { type: Boolean, default: true }
    },
    inApp: {
      taskAssigned: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      taskOverdue: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      taskUpdated: { type: Boolean, default: true },
      clientDocumentUploaded: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      systemAnnouncement: { type: Boolean, default: true }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    }
  },
  // Security
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  // Two-Factor Authentication (TOTP)
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false // Don't include in queries by default
  },
  twoFactorSetupComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ firmId: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (starts with $2a$ or $2b$ for bcrypt)
  if (this.password && this.password.match(/^\$2[aby]\$/)) {
    return next();
  }
  
  // Use 10 rounds for better performance (still very secure)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Update passwordChangedAt when password is modified
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate auto IDs for employees and clients
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Auto-generate username from fullName if not provided
    if (!this.username && this.fullName) {
      const firstName = this.fullName.trim().split(/\s+/)[0];
      const baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Ensure uniqueness
      let username = baseUsername;
      let counter = 1;
      while (await this.constructor.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      this.username = username;
    }
    
    if (this.role === 'employee' && !this.employeeId) {
      const count = await this.constructor.countDocuments({ role: 'employee', firmId: this.firmId });
      this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    } else if (this.role === 'client' && !this.clientId) {
      const count = await this.constructor.countDocuments({ role: 'client', firmId: this.firmId });
      this.clientId = `CLT${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;