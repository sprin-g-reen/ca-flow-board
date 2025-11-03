import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // System notifications won't have a sender
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_due_soon',
      'task_overdue',
      'task_completed',
      'task_updated',
      'client_document_uploaded',
      'payment_received',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Task', 'Client', 'Invoice', 'Payment', 'Document'],
      required: false
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  lastReminderAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if notification is recent (within 24 hours)
notificationSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to create and send notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // TODO: Send real-time notification via websocket
  // TODO: Send email notification if user preferences allow
  
  return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;