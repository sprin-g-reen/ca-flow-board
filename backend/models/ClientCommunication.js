import mongoose from 'mongoose';

const clientCommunicationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  communicationType: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'meeting', 'document', 'internal_note'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  recipientPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  isInternal: {
    type: Boolean,
    default: false // true for internal team communications
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  }],
  // For real-time features
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
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
clientCommunicationSchema.index({ clientId: 1, createdAt: -1 });
clientCommunicationSchema.index({ firmId: 1, isInternal: 1 });
clientCommunicationSchema.index({ createdBy: 1 });
clientCommunicationSchema.index({ isRead: 1 });

const ClientCommunication = mongoose.model('ClientCommunication', clientCommunicationSchema);

export default ClientCommunication;