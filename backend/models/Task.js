import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  taskId: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    required: [true, 'Task type is required'],
    enum: [
      'gst_filing',
      'income_tax_return',
      'tds_return',
      'audit',
      'compliance',
      'consultation',
      'documentation',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'review', 'completed', 'cancelled'],
    default: 'todo'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional to allow unassigned tasks
  },
  // Additional collaborators who can work on this task
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false // Made optional to allow tasks without specific clients
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  // Task details
  estimatedHours: {
    type: Number,
    min: 0.5,
    max: 1000
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  fixedPrice: {
    type: Number,
    min: 0
  },
  // Recurring task settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: function() { return this.isRecurring; }
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: Date,
    maxOccurrences: Number
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  // Templates
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskTemplate',
    required: false // Made optional to handle frontend template IDs
  },
  // Documents and attachments
  documents: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Comments and updates
  comments: [{
    text: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
  }],
  // Progress tracking
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Billing
  billable: {
    type: Boolean,
    default: true
  },
  invoiced: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  // Notifications
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: Date,
  // Custom fields for specific task types
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Task dependencies
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'],
      default: 'finish_to_start'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // Archive functionality
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ collaborators: 1 });
taskSchema.index({ client: 1 });
taskSchema.index({ firm: 1 });
taskSchema.index({ type: 1 });
taskSchema.index({ isRecurring: 1 });
taskSchema.index({ billable: 1 });
taskSchema.index({ invoiced: 1 });
taskSchema.index({ taskId: 1 });
taskSchema.index({ isArchived: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && new Date() > this.dueDate;
});

// Virtual for total cost
taskSchema.virtual('totalCost').get(function() {
  if (this.fixedPrice) return this.fixedPrice;
  if (this.hourlyRate && this.actualHours) return this.hourlyRate * this.actualHours;
  if (this.hourlyRate && this.estimatedHours) return this.hourlyRate * this.estimatedHours;
  return 0;
});

// Generate task ID before saving
taskSchema.pre('save', async function(next) {
  if (this.isNew && !this.taskId) {
    const firm = await mongoose.model('Firm').findById(this.firm);
    const prefix = firm?.settings?.taskPrefix || 'TSK';
    const count = await this.constructor.countDocuments({ firm: this.firm });
    this.taskId = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update completed date when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedDate) {
      this.completedDate = new Date();
      this.progressPercentage = 100;
    } else if (this.status !== 'completed') {
      this.completedDate = undefined;
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;