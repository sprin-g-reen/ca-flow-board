import mongoose from 'mongoose';

const viewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  entity: { 
    type: String, 
    enum: [
      'clients', 
      'invoices', 
      'tasks', 
      'users', 
      'chat_messages', 
      'chat_rooms',
      'communications',
      'documents',
      'notifications',
      'user_activity',
      'gst_reports',
      'analytics'
    ], 
    required: true 
  },
  scope: { type: String, enum: ['private', 'team', 'public'], default: 'private' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firm: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', required: true },
  config: {
    type: Object,
    default: { filters: [], columns: [], sort: [], group: [], aggregations: [] }
  },
  sharedWithUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sharedWithTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  isTemplate: { type: Boolean, default: false },
  templateKey: { type: String, trim: true },
  // Visualization settings
  visualizationType: { 
    type: String, 
    enum: ['table', 'bar', 'line', 'pie', 'donut', 'area', 'scatter'], 
    default: 'table' 
  },
  chartConfig: {
    xAxis: String,
    yAxis: String,
    groupBy: String,
    aggregation: { type: String, enum: ['count', 'sum', 'avg', 'min', 'max'], default: 'count' }
  }
}, {
  timestamps: true,
});

viewSchema.index({ firm: 1, owner: 1, entity: 1, scope: 1, name: 1 });

const View = mongoose.model('View', viewSchema);
export default View;
