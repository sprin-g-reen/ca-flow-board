import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: false
  },
  queryType: {
    type: String,
    enum: ['chat', 'summary', 'function_call'],
    default: 'chat'
  },
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    default: 'success'
  },
  responseTime: {
    type: Number, // in milliseconds
    required: false
  },
  tokensUsed: {
    type: Number,
    required: false
  },
  functionsCalled: [{
    name: String,
    arguments: mongoose.Schema.Types.Mixed,
    timestamp: Date
  }],
  errorMessage: {
    type: String,
    required: false
  },
  privacy: {
    type: Boolean,
    default: false
  },
  metadata: {
    model: String,
    endpoint: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
aiUsageSchema.index({ user: 1, createdAt: -1 });
aiUsageSchema.index({ firm: 1, createdAt: -1 });
aiUsageSchema.index({ status: 1 });
aiUsageSchema.index({ queryType: 1 });

export default mongoose.model('AIUsage', aiUsageSchema);
