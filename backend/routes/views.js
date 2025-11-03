import express from 'express';
import auth from '../middleware/auth.js';
import View from '../models/View.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

const router = express.Router();

// Build a Mongo filter from simple config
function buildFilter(filters = []) {
  const query = {};
  for (const f of filters) {
    const { field, op = 'eq', value } = f;
    if (!field) continue;
    switch (op) {
      case 'eq':
        query[field] = value;
        break;
      case 'in':
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'ne':
        query[field] = { $ne: value };
        break;
      case 'gt':
        query[field] = { $gt: value };
        break;
      case 'gte':
        query[field] = { $gte: value };
        break;
      case 'lt':
        query[field] = { $lt: value };
        break;
      case 'lte':
        query[field] = { $lte: value };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          query[field] = { $gte: value[0], $lte: value[1] };
        }
        break;
      case 'regex':
        query[field] = { $regex: value, $options: 'i' };
        break;
      default:
        query[field] = value;
    }
  }
  return query;
}

// GET /api/views
router.get('/', auth, async (req, res) => {
  try {
    const { scope, entity } = req.query;
    const base = { firm: req.user.firmId._id };
    const scopeFilter = scope === 'team' || scope === 'public' ? { scope } : { $or: [
      { scope: 'public' },
      { owner: req.user._id },
      { scope: 'team' } // refine with team membership later
    ]};
    const entityFilter = entity ? { entity } : {};

    const views = await View.find({ ...base, ...scopeFilter, ...entityFilter })
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: views });
  } catch (err) {
    console.error('List views error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, scope = 'private', entity, config } = req.body;
    const view = await View.create({
      name,
      description,
      scope,
      entity,
      config: config || {},
      owner: req.user._id,
      firm: req.user.firmId._id,
    });
    res.status(201).json({ success: true, data: view });
  } catch (err) {
    console.error('Create view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/views/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Get view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/views/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await View.findOneAndUpdate(
      { _id: req.params.id, firm: req.user.firmId._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/views/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await View.findOneAndDelete({ _id: req.params.id, firm: req.user.firmId._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'View not found' });
    res.json({ success: true, message: 'View deleted' });
  } catch (err) {
    console.error('Delete view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views/:id/share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { scope, users = [], teams = [] } = req.body;
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });
    if (!['private', 'team', 'public'].includes(scope)) {
      return res.status(400).json({ success: false, message: 'Invalid scope' });
    }
    view.scope = scope;
    view.sharedWithUsers = users;
    view.sharedWithTeams = teams;
    await view.save();
    res.json({ success: true, data: view });
  } catch (err) {
    console.error('Share view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/views/:id/run
router.post('/:id/run', auth, async (req, res) => {
  try {
    console.log('=== VIEW RUN DEBUG ===');
    console.log('View ID:', req.params.id);
    console.log('User firm ID:', req.user.firmId._id);
    
    const { page = 1, pageSize = 25 } = req.body || {};
    const view = await View.findOne({ _id: req.params.id, firm: req.user.firmId._id });
    console.log('Found view:', !!view);
    console.log('View entity:', view?.entity);
    console.log('View config:', JSON.stringify(view?.config, null, 2));
    
    if (!view) return res.status(404).json({ success: false, message: 'View not found' });

    const filter = buildFilter(view.config?.filters || []);
    console.log('Built filter (before firm constraint):', JSON.stringify(filter, null, 2));
    
    const sort = {};
    const sortRules = view.config?.sort || [];
    for (const s of sortRules) {
      if (s?.field) sort[s.field] = s.direction === 'desc' ? -1 : 1;
    }

    // Always constrain to firm
    if (view.entity === 'clients') filter['firmId'] = req.user.firmId._id;
    if (view.entity === 'tasks') filter['firm'] = req.user.firmId._id;
    if (view.entity === 'invoices') filter['firm'] = req.user.firmId._id;
    if (view.entity === 'users') filter['firmId'] = req.user.firmId._id;
    
    console.log('Final filter (after firm constraint):', JSON.stringify(filter, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    let Model;
    if (view.entity === 'clients') Model = Client;
    if (view.entity === 'tasks') Model = Task;
    if (view.entity === 'invoices') Model = Invoice;
    if (view.entity === 'users') Model = User;

    if (!Model) {
      console.log('No model found for entity:', view.entity);
      return res.status(400).json({ success: false, message: `Invalid entity type: ${view.entity}` });
    }

    console.log('Using model:', Model.modelName);
    const total = await Model.countDocuments(filter);
    console.log('Total count:', total);
    
    const rows = await Model.find(filter)
      .sort(Object.keys(sort).length ? sort : { updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
      
    console.log('Returned rows count:', rows.length);
    console.log('=== END VIEW RUN DEBUG ===');

    res.json({ success: true, data: { rows, pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total } } });
  } catch (err) {
    console.error('Run view error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
