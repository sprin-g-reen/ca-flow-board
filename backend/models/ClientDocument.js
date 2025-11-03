import mongoose from 'mongoose';

const clientDocumentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  documentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Document name cannot exceed 200 characters']
  },
  documentType: {
    type: String,
    enum: [
      'identity_proof',
      'address_proof',
      'business_registration',
      'tax_document',
      'financial_statement',
      'contract',
      'invoice',
      'receipt',
      'correspondence',
      'other'
    ],
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true // stored file name
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileExtension: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'archived'],
    default: 'active'
  },
  expiryDate: {
    type: Date
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  isProtected: {
    type: Boolean,
    default: false,
    description: 'Protected documents require admin/owner permissions to access'
  },
  isRestricted: {
    type: Boolean,
    default: false,
    description: 'Restricted documents have limited employee access'
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
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date
  },
  lastDownloadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Firm association
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  uploadedBy: {
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
clientDocumentSchema.index({ clientId: 1, status: 1 });
clientDocumentSchema.index({ firmId: 1, documentType: 1 });
clientDocumentSchema.index({ uploadedBy: 1 });
clientDocumentSchema.index({ createdAt: -1 });
clientDocumentSchema.index({ expiryDate: 1 });

// Virtual for file URL
clientDocumentSchema.virtual('fileUrl').get(function() {
  return `/api/documents/${this._id}/download`;
});

const ClientDocument = mongoose.model('ClientDocument', clientDocumentSchema);

export default ClientDocument;