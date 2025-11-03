import mongoose from 'mongoose';

const layoutPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  layoutName: {
    type: String,
    required: true,
    trim: true
  },
  layoutType: {
    type: String,
    enum: ['task-board', 'client-view', 'dashboard'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  settings: {
    // Board View Settings
    boardView: {
      type: String,
      enum: ['kanban', 'list', 'grid', 'calendar'],
      default: 'kanban'
    },
    
    // Column Configuration for List View
    visibleColumns: [{
      key: String,
      label: String,
      width: Number,
      sortable: Boolean,
      visible: Boolean
    }],
    
    // Filter Settings
    defaultFilters: {
      status: [String],
      priority: [String],
      category: [String],
      assignedTo: [String]
    },
    
    // Sort Settings
    defaultSort: {
      field: String,
      direction: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
      }
    },
    
    // Display Preferences
    cardSize: {
      type: String,
      enum: ['compact', 'normal', 'large'],
      default: 'normal'
    },
    
    showSubtasks: {
      type: Boolean,
      default: true
    },
    
    showClientInfo: {
      type: Boolean,
      default: true
    },
    
    showDueDates: {
      type: Boolean,
      default: true
    },
    
    // Color Scheme
    colorScheme: {
      type: String,
      enum: ['default', 'minimal', 'colorful', 'dark'],
      default: 'default'
    }
  }
}, {
  timestamps: true
});

// Ensure only one default layout per user per type
layoutPreferenceSchema.index({ userId: 1, layoutType: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

// Ensure unique layout names per user per type
layoutPreferenceSchema.index({ userId: 1, layoutType: 1, layoutName: 1 }, { unique: true });

export default mongoose.model('LayoutPreference', layoutPreferenceSchema);