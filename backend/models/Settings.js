import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  firm: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

settingsSchema.index({ firm: 1 }, { unique: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
