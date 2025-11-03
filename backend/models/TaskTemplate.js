import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subtask title is required'],
    trim: true,
    maxlength: [200, 'Subtask title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Subtask description cannot exceed 500 characters']
  },
  dueDate: {
    type: String, // Store as string for flexible date patterns like "5th of every month"
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedHours: {
    type: Number,
    min: 0
  }
}, { _id: true });

const taskTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: [200, 'Template title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Template description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Template category is required'],
    enum: ['gst', 'itr', 'roc', 'other']
  },
  // Recurring settings
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    type: String,
    enum: ['monthly', 'yearly', 'custom'],
    required: function() {
      return this.is_recurring;
    }
  },
  // Billing settings
  is_payable_task: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    min: 0,
    required: function() {
      return this.is_payable_task;
    }
  },
  payable_task_type: {
    type: String,
    enum: ['payable_task_1', 'payable_task_2'],
    required: function() {
      return this.is_payable_task;
    }
  },
  // Assignment
  assigned_employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  // Template details
  deadline: {
    type: String, // Flexible deadline specification like "20th of every month"
    trim: true
  },
  subtasks: [subtaskSchema],
  // Estimated time and complexity
  estimated_hours: {
    type: Number,
    min: 0
  },
  complexity: {
    type: String,
    enum: ['simple', 'medium', 'complex'],
    default: 'medium'
  },
  // Template metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  // Usage tracking
  usage_count: {
    type: Number,
    default: 0
  },
  last_used: {
    type: Date
  },
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  // Custom fields for template-specific data
  custom_fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
taskTemplateSchema.index({ category: 1 });
taskTemplateSchema.index({ firm: 1 });
taskTemplateSchema.index({ created_by: 1 });
taskTemplateSchema.index({ is_active: 1 });
taskTemplateSchema.index({ is_deleted: 1 });
taskTemplateSchema.index({ is_recurring: 1 });
taskTemplateSchema.index({ is_payable_task: 1 });
taskTemplateSchema.index({ tags: 1 });

// Virtual for subtask count
taskTemplateSchema.virtual('subtask_count').get(function() {
  return this.subtasks ? this.subtasks.length : 0;
});

// Method to increment usage count
taskTemplateSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  this.last_used = new Date();
  return this.save();
};

// Static method to find active templates
taskTemplateSchema.statics.findActive = function(firmId, filters = {}) {
  return this.find({
    firm: firmId,
    is_active: true,
    is_deleted: false,
    ...filters
  }).populate('assigned_employee_id', 'fullName email employee_id')
    .populate('client_id', 'name email')
    .populate('created_by', 'fullName email')
    .sort({ createdAt: -1 });
};

// Static method to find templates by category
taskTemplateSchema.statics.findByCategory = function(firmId, category) {
  return this.findActive(firmId, { category });
};

const TaskTemplate = mongoose.model('TaskTemplate', taskTemplateSchema);

export default TaskTemplate;